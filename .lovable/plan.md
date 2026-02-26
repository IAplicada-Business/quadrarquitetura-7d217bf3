
Objetivo: eliminar o erro persistente “Projeto não identificado” e garantir gravação confiável em Obras > Tarefas.

1) Ajustar resolução de projeto em `src/components/layout/VoiceAgentDialog.tsx`
- Criar `handleProjectChange` para salvar seleção no state e em `useRef` (`selectedProjectIdRef`) imediatamente.
- Trocar lógica de `resolvedProjectId` para priorizar seleção manual:
  - `manualProjectId` (ref) primeiro
  - depois `aiProjectId`
- Validar `resolvedProjectId` contra `projects` carregados (ID existente). Se inválido, tratar como `null`.
- Auto-selecionar projeto padrão quando abrir o modal e existir apenas 1 projeto (ou primeiro projeto, conforme regra definida).

2) Corrigir causa de “salva no chat e não em Obras”
- Manter criação em `voice_tasks` (histórico).
- Inserir em `schedule_tasks` com checagem explícita de erro (não ignorar retorno).
- Fazer insert em lote dos itens pai (`!parent_id`) e `throw` em qualquer falha para exibir toast correto.
- Se falhar `schedule_tasks`, mostrar erro explícito de integração com Obras (não reportar sucesso silencioso).

3) Remover fragilidade de closure no envio do áudio
- No `handleTranscript`, ler projeto atual do `selectedProjectIdRef` (não apenas do closure do callback).
- Isso evita perda da seleção quando houver race entre gravação/finalização e atualização de estado.

4) Melhorar robustez do fluxo com IA
- Enviar `selectedProjectId` atual no body do `process-voice-command` como contexto adicional.
- No frontend, ignorar `project_id` da IA se não existir na lista local de projetos.
- Manter fallback para seleção manual sempre que houver.

5) Garantir atualização da UI após persistência
- Invalidar `["voice_tasks"]`, `["schedule_tasks"]` e `["all_schedule_tasks"]` apenas após sucesso real dos inserts.
- Não adicionar item em `sessionTasks` se persistência em Obras falhar parcialmente sem tratamento.

6) Validação pós-implementação (E2E)
- Cenário A: selecionar projeto manualmente, falar tarefa sem nome de obra → deve criar em `voice_tasks` e aparecer em `/construction/tasks`.
- Cenário B: sem seleção manual, citar nome da obra na fala → deve resolver projeto e criar nas duas tabelas.
- Cenário C: IA retornar `project_id` inválido/null → seleção manual deve prevalecer e fluxo continuar.
- Cenário D: verificar toasts corretos para sucesso total vs erro de gravação em Obras.

Seção técnica (causa raiz encontrada)
- O fluxo atual prioriza `aiProjectId` sobre seleção manual e não valida se o ID retornado pela IA é válido no contexto carregado.
- `voice_tasks` aceita `project_id` sem FK rígida de projeto, mas `schedule_tasks` exige `project_id` válido (FK em `projects`).
- O insert em `schedule_tasks` hoje não checa erro; assim pode falhar silenciosamente e parecer “salvou só no chat”.
- Log recente da função mostra caso real com `project_id: null`, confirmando necessidade de fallback manual robusto.
