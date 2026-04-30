import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

const PAGE_KEYS = [
  { group: "Dashboard", pages: [
    { key: "dashboard_escritorio", label: "Escritório" },
    { key: "dashboard_obras", label: "Obras" },
  ]},
  { group: "Leads", pages: [
    { key: "leads_pipeline", label: "Pipeline" },
    { key: "leads_proposals", label: "Propostas" },
    { key: "leads_contracts", label: "Contratos" },
  ]},
  { group: "Clientes", pages: [
    { key: "clients", label: "Lista" },
  ]},
  { group: "Projetos", pages: [
    { key: "projects", label: "Lista" },
  ]},
  { group: "Obra", pages: [
    { key: "construction_tracking", label: "Acompanhamento" },
    { key: "construction_tasks", label: "Tarefas" },
    { key: "construction_suppliers", label: "Fornecedores" },
    { key: "construction_documents", label: "Documentos" },
    { key: "construction_reports", label: "Relatórios" },
  ]},
  { group: "Administrativo", pages: [
    { key: "admin_settings", label: "Configurações" },
    { key: "admin_users", label: "Usuários" },
  ]},
];

type PermMap = Record<string, { can_view: boolean; can_edit: boolean }>;

export default function AdminUsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [permissions, setPermissions] = useState<PermMap>({});
  const [permLoading, setPermLoading] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "user" });

  const fetchUsers = async () => {
    setLoading(true);
    // Get profiles (admin can see all via RLS)
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, created_at");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    if (!profiles) { setLoading(false); return; }

    const roleMap: Record<string, string> = {};
    roles?.forEach((r: any) => { roleMap[r.user_id] = r.role; });

    const mapped: UserRow[] = profiles.map((p: any) => ({
      id: p.user_id,
      email: "",
      full_name: p.full_name || "",
      role: roleMap[p.user_id] || "user",
      created_at: p.created_at,
    }));

    setUsers(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const fetchPermissions = async (userId: string) => {
    setPermLoading(true);
    const { data } = await supabase
      .from("user_permissions")
      .select("page_key, can_view, can_edit")
      .eq("user_id", userId);

    const map: PermMap = {};
    data?.forEach((p: any) => {
      map[p.page_key] = { can_view: p.can_view, can_edit: p.can_edit };
    });
    setPermissions(map);
    setPermLoading(false);
  };

  const selectUser = (u: UserRow) => {
    setSelectedUser(u);
    fetchPermissions(u.id);
  };

  const togglePerm = (pageKey: string, field: "can_view" | "can_edit") => {
    setPermissions((prev) => {
      const current = prev[pageKey] || { can_view: false, can_edit: false };
      const updated = { ...current, [field]: !current[field] };
      if (field === "can_edit" && updated.can_edit) updated.can_view = true;
      if (field === "can_view" && !updated.can_view) updated.can_edit = false;
      return { ...prev, [pageKey]: updated };
    });
  };

  const savePermissions = async () => {
    if (!selectedUser) return;
    setSavingPerms(true);

    // Delete existing then insert all
    await supabase.from("user_permissions").delete().eq("user_id", selectedUser.id);

    const rows = Object.entries(permissions)
      .filter(([, v]) => v.can_view || v.can_edit)
      .map(([key, v]) => ({
        user_id: selectedUser.id,
        page_key: key,
        can_view: v.can_view,
        can_edit: v.can_edit,
      }));

    if (rows.length > 0) {
      const { error } = await supabase.from("user_permissions").insert(rows);
      if (error) { toast.error("Erro ao salvar permissões"); setSavingPerms(false); return; }
    }

    toast.success("Permissões salvas");
    setSavingPerms(false);
  };

  const createUser = async () => {
    if (!form.email || !form.password || !form.full_name) {
      toast.error("Preencha todos os campos");
      return;
    }
    setCreating(true);

    const { data, error } = await supabase.functions.invoke("create-user", {
      body: form,
    });

    let errorMessage: string | null = null;
    if (error) {
      // Try to extract the JSON error body from FunctionsHttpError
      const ctx = (error as any)?.context;
      if (ctx && typeof ctx.json === "function") {
        try {
          const body = await ctx.json();
          errorMessage = body?.error || null;
        } catch {
          // ignore parse error
        }
      }
      errorMessage = errorMessage || error.message || "Erro ao criar usuário";
    } else if (data?.error) {
      errorMessage = data.error;
    }

    if (errorMessage) {
      if (/already been registered|email_exists|already registered/i.test(errorMessage)) {
        errorMessage = "Já existe um usuário cadastrado com este e-mail";
      }
      toast.error(errorMessage);
      setCreating(false);
      return;
    }

    toast.success("Usuário criado com sucesso");
    setCreateOpen(false);
    setForm({ email: "", password: "", full_name: "", role: "user" });
    setCreating(false);
    fetchUsers();
  };

  const updateRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole as any })
      .eq("user_id", userId);

    if (error) {
      toast.error("Erro ao atualizar função");
      return;
    }
    toast.success("Função atualizada");
    fetchUsers();
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      moderator: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      user: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
    return <Badge className={colors[role] || ""}>{role}</Badge>;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold font-display mb-1">Gestão de Usuários</h1>
      <p className="text-muted-foreground mb-6">Gerenciar usuários e permissões de acesso</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Users className="h-5 w-5" /> Usuários
            </CardTitle>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Criar Usuário</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Criar Novo Usuário</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Senha</Label>
                    <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </div>
                  <div>
                    <Label>Função</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="moderator">Moderador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createUser} disabled={creating} className="w-full">
                    {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow
                      key={u.id}
                      className={`cursor-pointer ${selectedUser?.id === u.id ? "bg-muted" : ""}`}
                      onClick={() => selectUser(u)}
                    >
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell>{roleBadge(u.role)}</TableCell>
                      <TableCell>
                        <Select value={u.role} onValueChange={(v) => updateRole(u.id, v as string)}>
                          <SelectTrigger className="h-8 text-xs" onClick={(e) => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="moderator">Moderador</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Shield className="h-5 w-5" /> Permissões
              {selectedUser && <span className="text-sm font-normal text-muted-foreground ml-2">— {selectedUser.full_name}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedUser ? (
              <p className="text-muted-foreground text-sm text-center py-8">Selecione um usuário para gerenciar permissões</p>
            ) : selectedUser.role === "admin" ? (
              <p className="text-muted-foreground text-sm text-center py-8">Administradores possuem acesso total ao sistema</p>
            ) : permLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="space-y-4">
                {PAGE_KEYS.map((group) => (
                  <div key={group.group}>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">{group.group}</h4>
                    <div className="space-y-2">
                      {group.pages.map((page) => {
                        const perm = permissions[page.key] || { can_view: false, can_edit: false };
                        return (
                          <div key={page.key} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50">
                            <span className="text-sm">{page.label}</span>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Checkbox checked={perm.can_view} onCheckedChange={() => togglePerm(page.key, "can_view")} />
                                Ver
                              </label>
                              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Checkbox checked={perm.can_edit} onCheckedChange={() => togglePerm(page.key, "can_edit")} />
                                Editar
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <Button onClick={savePermissions} disabled={savingPerms} className="w-full mt-4">
                  {savingPerms && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Permissões
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
