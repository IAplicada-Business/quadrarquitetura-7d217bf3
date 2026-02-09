

# Definir admins: mariana@iaplicada.com e contato@quadraarq.com

## Estado atual
- `mariana@iaplicada.com` (id: `f6077cab-...`) -- ja e admin
- `contato@quadraarq.com` (id: `627f2b18-...`) -- sem role atribuida

## Acao necessaria

Executar uma migracao SQL para inserir o role `admin` para `contato@quadraarq.com`:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('627f2b18-2233-4595-9081-d658874e9e7d', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

Nenhuma alteracao de codigo e necessaria. Apenas a migracao SQL.

