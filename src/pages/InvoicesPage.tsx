import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { InvoiceNFList } from "@/components/projects/InvoiceNFList";

export default function InvoicesPage() {
  const { user } = useAuth();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-list-simple"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id, name").order("name");
      return (data ?? []) as { id: string; name: string }[];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6 p-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-playfair">Notas Fiscais</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão consolidada de todas as NFs</p>
        </div>
      </div>
      <InvoiceNFList showProjectColumn projects={projects} />
    </div>
  );
}
