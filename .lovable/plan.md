

## Plano: Abas mobile em dropdown + Toggle dark mode

### 1. `src/pages/ProjectDetail.tsx`

- Importar `useIsMobile` de `@/hooks/use-mobile` e `Select, SelectTrigger, SelectValue, SelectContent, SelectItem` de `@/components/ui/select`
- Definir array de abas: `const tabs = [{value: "resumo", label: "Resumo"}, ...]`
- No bloco das abas (linhas 89-100), renderizar condicionalmente:
  - **Mobile** (`isMobile`): `<Select value={activeTab} onValueChange={setActiveTab}>` com `SelectTrigger` mostrando o nome da aba atual e `SelectItem` para cada aba
  - **Desktop**: manter o `TabsList` horizontal atual
- O `<Tabs>` wrapper e os `<TabsContent>` permanecem iguais

### 2. `src/components/layout/AppHeader.tsx`

- Importar `Sun, Moon` do Lucide
- Adicionar state para tema: `const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')`
- Função `toggleTheme`: alterna `document.documentElement.classList` entre `dark`/não, salva em `localStorage`
- Adicionar botão entre Notifications e Avatar com a mesma classe dos outros botões do header (`p-2.5 rounded-full bg-secondary text-accent shadow-sm hover:bg-secondary/80`)
- Ícone: `Sun` quando dark, `Moon` quando light

### 3. `src/main.tsx` (ou `index.html`)

- Adicionar script inline no `<head>` do `index.html` para aplicar tema salvo antes do primeiro render, evitando flash:
```js
<script>
  if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');
</script>
```

### Arquivos alterados
1. `src/pages/ProjectDetail.tsx`
2. `src/components/layout/AppHeader.tsx`
3. `index.html`

### O que NÃO muda
- Rotas, sidebar, demais componentes e funcionalidades

