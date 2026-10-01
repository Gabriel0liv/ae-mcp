# AE-mcp Roadmap

Este roadmap parte do estado atual do projeto: CLI funcional, exports JSX, inventário local, review packages, visual review e contexto profundo.

## Estado atual

Já existe:

- CLI central em `node/cli.js`;
- inventário local de scripts, presets, plugins e grupos;
- catálogo de efeitos reconhecidos pelo After Effects;
- exports leves e profundos de composição ativa;
- export de layers selecionadas;
- summary/map/deep do projeto inteiro;
- pacote técnico de revisão;
- pacote visual com frames;
- context advisor;
- regras de segurança para não modificar `.aep` sem confirmação.

## Fase 7 — MCP Server Foundation

Objetivo: deixar de depender de comandos soltos no terminal e expor tools MCP reais.

Status inicial nesta branch:

- [x] `node/mcp-server.mjs`
- [x] `node/mcp/ae-command-runner.mjs`
- [x] script `npm run mcp`
- [x] tools analíticas MCP
- [x] documentação inicial em `docs/MCP_SERVER.md`
- [x] protocolo de resposta em `docs/AGENT_RESPONSE_PROTOCOL.md`
- [ ] smoke test com MCP Inspector
- [ ] validação em OpenClaude/Claude Desktop/Cursor/Codex
- [ ] melhorar leitura de latest package técnico
- [ ] padronizar retornos de todas as tools

## Fase 8 — Status e execução robusta

Objetivo: controlar melhor comandos que disparam JSX no After Effects.

Tarefas:

- [ ] gerar `request_id` por execução;
- [ ] criar `data/status/<request_id>.json`;
- [ ] status `pending/running/done/error`;
- [ ] timeout por comando;
- [ ] detectar arquivo gerado depois do início do comando;
- [ ] diferenciar erro de CLI, erro de AE e erro de timeout;
- [ ] permitir `ae_wait_for_status` no MCP.

## Fase 9 — Normalização dos JSONs

Objetivo: impedir interpretações erradas por inconsistência entre exporters.

Tarefas:

- [ ] padronizar envelope `{ ok, command, scope, generatedAt, data, warnings, errors }`;
- [ ] padronizar `effects[]` entre active, selected, project map e deep;
- [ ] expor `propertyPath` completo em efeitos/propriedades profundas;
- [ ] adicionar flags `truncated`, `hitMaxDepth`, `hitMaxProperties`;
- [ ] documentar quando `effects[]` é light/medium/deep;
- [ ] garantir que shape layers e effects parade sejam lidos de forma consistente.

## Fase 10 — Analyzer automático

Objetivo: gerar findings estruturados para o agente depender menos de interpretação manual.

Possíveis findings:

- `NO_ACTIVE_COMP`
- `NO_SELECTED_LAYERS`
- `MISSING_FOOTAGE`
- `EXPRESSION_ERROR`
- `CAMERA_NOT_ACTIVE`
- `CAMERAS_OVERLAP`
- `LAYER_3D_WITHOUT_CAMERA_CONTEXT`
- `EFFECT_IN_PROPERTY_TREE_ONLY`
- `KEYFRAMES_TOO_CLOSE`
- `NO_EASING`
- `EXTREME_SCALE`
- `BLEND_MODE_RENDERER_LIMITATION`
- `SHAPE_LAYER_EFFECT_SPACE_ISSUE`

Tarefas:

- [ ] criar `node/analyze-context.js`;
- [ ] ler `active_comp_deep.json`, `selected_layers.json`, `diagnostics.json`;
- [ ] gerar `data/findings.json`;
- [ ] classificar severidade: `info/warn/error`;
- [ ] classificar confiança: `low/medium/high`;
- [ ] referenciar evidências por path JSON.

## Fase 11 — Visual review melhor

Objetivo: tornar avaliação visual mais útil para MMV/edit.

Tarefas:

- [ ] gerar contact sheet automaticamente;
- [ ] exportar frames por markers;
- [ ] exportar frames por work area;
- [ ] render preview low-res por intervalo curto;
- [ ] salvar metadados de FPS/duração;
- [ ] separar análise estática de análise de timing;
- [ ] melhorar mensagens quando `aerender` falha.

## Fase 12 — Safe edit proposals

Objetivo: permitir que o agente proponha edições sem aplicar automaticamente.

Fluxo desejado:

```text
análise → plano → proposta JSX → confirmação → aplicação segura em cópia → relatório
```

Tarefas:

- [ ] `generated/proposals/<id>/plan.json`;
- [ ] `generated/proposals/<id>/script.jsx`;
- [ ] `generated/proposals/<id>/README.md`;
- [ ] `ae_generate_safe_edit_proposal`;
- [ ] `ae_apply_safe_edit_proposal` apenas com confirmação;
- [ ] scripts sempre duplicam composição/layer antes de alterar;
- [ ] relatório `data/edit_reports/<id>.json`.

## Prioridade recomendada

Ordem mais segura:

1. Fase 7 — estabilizar MCP server.
2. Fase 8 — status/wait robusto.
3. Fase 9 — normalização dos JSONs.
4. Fase 10 — analyzer automático.
5. Fase 11 — visual review melhor.
6. Fase 12 — safe edit proposals.

Não priorizar novos presets antes dessas fases. O projeto precisa primeiro ficar confiável como ferramenta de agente.
