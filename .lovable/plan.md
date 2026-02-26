

# Agente de Voz - Assistente IA com Web Speech API

## Visao Geral
Botao rosa ao lado do sino de notificacoes no header. Ao clicar, abre um Dialog fullscreen com a interface visual do agente de voz (baseada no componente IA Siri Chat). Usa Web Speech API nativa do navegador para transcrever audio, envia a transcricao para uma edge function que usa IA (Gemini) para interpretar e segmentar as informacoes em tarefas estruturadas, e salva automaticamente no banco.

## Arquitetura

```text
[Mic] -> Web Speech API -> Transcricao texto
  -> Edge Function (Gemini 2.5 Flash)
    -> Interpreta e segmenta em tarefas
    -> Retorna JSON estruturado
  -> Frontend salva no banco voice_tasks
  -> Toast de confirmacao
```

## Etapas de Implementacao

### 1. Criar tabela `voice_tasks` no banco
Nova tabela para armazenar tarefas geradas por voz:
- `id`, `user_id`, `project_id` (uuid, obrigatorios)
- `parent_id` (uuid, nullable - para subtarefas)
- `title` (text)
- `description` (text)
- `responsible` (text - nome do responsavel)
- `task_type` (text - tipo da tarefa: projeto, obra, compras, financeiro, etc.)
- `category` (text - aba/pagina associada: cronograma, escopo, pendencias, etc.)
- `status` (text, default 'pendente')
- `priority` (text, default 'media')
- `due_date` (date, nullable)
- `source_transcript` (text - transcricao original)
- `created_at`, `updated_at`
- RLS: usuario so ve/edita proprias tarefas

### 2. Instalar `framer-motion`
Dependencia necessaria para as animacoes do componente visual.

### 3. Criar componente `VoiceChat` em `src/components/ui/ia-siri-chat.tsx`
Adaptar o componente do 21st.dev:
- Remover `demoMode` - usar interacao real
- Integrar Web Speech API (`webkitSpeechRecognition`) para captura de voz
- Cor rosa da marca (accent `350 25% 50%`) nos elementos visuais
- Textos em portugues (Ouvindo..., Processando..., Falando...)
- Ao parar de falar, envia transcricao para processamento

### 4. Criar edge function `process-voice-command`
- Recebe a transcricao em texto
- Recebe lista de projetos do usuario (para associar por nome)
- Usa Gemini 2.5 Flash via Lovable AI para:
  - Extrair tarefas e subtarefas
  - Identificar projeto mencionado
  - Atribuir responsavel, tipo e categoria
  - Retornar JSON estruturado
- Prompt instruindo o modelo sobre a estrutura do sistema (abas, tipos de tarefa, etc.)

### 5. Criar hook `useVoiceTasks`
- CRUD para `voice_tasks`
- Query por projeto
- Mutation para criar tarefas em lote (resultado do processamento IA)

### 6. Criar `VoiceAgentDialog` em `src/components/layout/VoiceAgentDialog.tsx`
- Dialog fullscreen que contem o VoiceChat
- Lista de tarefas ja criadas na sessao
- Seletor de projeto (para contexto)
- Exibe transcricao em tempo real
- Mostra tarefas geradas apos processamento

### 7. Adicionar botao no `AppHeader.tsx`
- Icone `Mic` com cor accent (rosa) ao lado do `NotificationsPanel`
- Ao clicar, abre o `VoiceAgentDialog`

### 8. Criar pagina `/construction/voice-tasks` para visualizar tarefas por obra
- Lista tarefas agrupadas por projeto
- Filtro por tipo, responsavel, status
- Acao de converter tarefa de voz em tarefa do cronograma ou pendencia

## Detalhes Tecnicos

- **Web Speech API**: `window.webkitSpeechRecognition` com `lang='pt-BR'`, `continuous=true`, `interimResults=true`
- **Compatibilidade**: Chrome, Edge. Detectar suporte e mostrar aviso em outros navegadores.
- **Prompt IA**: O modelo recebe contexto sobre as categorias do sistema (Cronograma, Escopo, Orcamentos, Materiais, Pendencias, Financeiro) e tipos de tarefa para classificacao correta.
- **Estrutura JSON de resposta da IA**:
```json
{
  "project_name": "Apartamento Silva",
  "tasks": [
    {
      "title": "Comprar porcelanato",
      "description": "Verificar estoque na loja X",
      "responsible": "Joao",
      "task_type": "compras",
      "category": "materiais",
      "priority": "alta",
      "subtasks": [
        { "title": "Cotar preco na loja Y", "responsible": "Maria" }
      ]
    }
  ]
}
```

