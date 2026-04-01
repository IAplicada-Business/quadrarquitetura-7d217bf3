import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useAIChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["chat-conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as ChatConversation[];
    },
    enabled: !!user,
  });

  const loadConversation = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (error) { toast.error("Erro ao carregar conversa"); return; }
    setMessages((data || []).map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
    setCurrentConversationId(convId);
  }, []);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  const saveMessage = useCallback(async (convId: string, role: string, content: string) => {
    if (!user) return;
    await supabase.from("chat_messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role,
      content,
    });
  }, [user]);

  const sendMessage = useCallback(async (input: string, contextPayload?: { route?: string; project_id?: string; lead_id?: string }) => {
    if (!user || !input.trim() || isStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    try {
      // Create or reuse conversation
      let convId = currentConversationId;
      if (!convId) {
        const title = input.trim().slice(0, 60);
        const { data: conv, error } = await supabase
          .from("chat_conversations")
          .insert({ user_id: user.id, title })
          .select("id")
          .single();
        if (error) throw error;
        convId = conv.id;
        setCurrentConversationId(convId);
        queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      } else {
        await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
      }

      // Save user message
      await saveMessage(convId, "user", input.trim());

      // Build history for context
      const history = messages.slice(-18).map(m => ({ role: m.role, content: m.content }));

      const controller = new AbortController();
      abortRef.current = controller;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ message: input.trim(), conversation_id: convId, history }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error("Sem resposta do servidor");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { /* ignore */ }
        }
      }

      // Save assistant message
      if (assistantSoFar) {
        await saveMessage(convId, "assistant", assistantSoFar);
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("Chat error:", err);
      toast.error(err.message || "Erro ao enviar mensagem");
      // Remove user message on error
      setMessages(prev => prev.filter(m => m !== userMsg));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [user, isStreaming, currentConversationId, messages, saveMessage, queryClient]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const deleteConversation = useCallback(async (convId: string) => {
    await supabase.from("chat_conversations").delete().eq("id", convId);
    if (currentConversationId === convId) {
      startNewConversation();
    }
    queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
  }, [currentConversationId, startNewConversation, queryClient]);

  return {
    messages,
    isStreaming,
    conversations,
    currentConversationId,
    sendMessage,
    stopStreaming,
    loadConversation,
    startNewConversation,
    deleteConversation,
  };
}
