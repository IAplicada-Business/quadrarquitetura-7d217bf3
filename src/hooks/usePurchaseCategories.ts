import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const DEFAULT_CATEGORIES = [
  "Obra Civil",
  "Elétrica",
  "Hidráulica",
  "Pintura",
  "Forro/Gesso",
  "Marcenaria",
  "Mobiliário",
  "Vidros",
  "Revestimentos",
  "Louças e Metais",
  "Iluminação",
  "Eletrodomésticos",
  "Diversos",
];

export function usePurchaseCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["purchase_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("id, purchase_categories")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const save = useMutation({
    mutationFn: async (categories: string[]) => {
      if (query.data?.id) {
        const { error } = await supabase
          .from("settings")
          .update({ purchase_categories: categories })
          .eq("id", query.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("settings")
          .insert({ user_id: user!.id, purchase_categories: categories });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_categories"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Categorias atualizadas" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const categories =
    (query.data?.purchase_categories as string[] | null) ?? DEFAULT_CATEGORIES;

  return { categories, isLoading: query.isLoading, save };
}
