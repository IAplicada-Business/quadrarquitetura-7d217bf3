

## Sidebar com tom do header (azul-marinho mais claro)

### O que muda
O sidebar passará do cinza neutro atual para um azul-marinho semelhante ao header, porém com lightness mais alta (mais claro/opaco), criando parentesco visual sem se confundir.

### Edição: `src/index.css`

**Light mode** — sidebar vars:
- `--sidebar-background`: `209 40% 22%` (azul-marinho escuro, mas mais claro que o header `209 59% 30%`)
- `--sidebar-foreground`: `209 15% 80%` (texto claro)
- `--sidebar-accent`: `209 35% 28%` (hover levemente mais claro)
- `--sidebar-accent-foreground`: `0 0% 95%`
- `--sidebar-border`: `209 30% 18%`
- `--sidebar-primary`: `209 59% 30%` (manter)
- `--sidebar-primary-foreground`: `0 0% 100%` (manter)

**Dark mode** — sidebar vars:
- `--sidebar-background`: `209 35% 14%`
- `--sidebar-foreground`: `209 10% 70%`
- `--sidebar-accent`: `209 30% 20%`
- `--sidebar-accent-foreground`: `209 8% 90%`
- `--sidebar-border`: `209 25% 12%`

### Edição: `src/components/layout/AppSidebar.tsx`
- Trocar logo de `logo-dark.png` de volta para `logo-light.png` (fundo escuro precisa de logo clara)

Resultado: sidebar azul-marinho mais suave que o header, criando hierarquia sem sobreposição visual.

