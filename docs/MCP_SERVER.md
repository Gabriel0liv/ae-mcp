# AE-mcp MCP Server

Esta fase adiciona um servidor MCP em modo `stdio` por cima da CLI existente do AE-mcp.

O objetivo é permitir que agentes compatíveis com MCP chamem ferramentas estruturadas em vez de depender de comandos soltos no terminal.

## Instalação

No repositório:

```bash
npm install
```

Depois rode um teste local:

```bash
npm run mcp
```

Esse comando inicia o servidor MCP em `stdio`. Ele não deve imprimir logs livres em `stdout`, porque o `stdout` é usado pelo protocolo MCP.

## Configuração em um host MCP

Use o comando abaixo como entrypoint:

```bash
node D:\\documentos\\Projetos\\AE-mcp\\node\\mcp-server.mjs
```

Exemplo genérico de configuração:

```json
{
  "mcpServers": {
    "ae-mcp": {
      "command": "node",
      "args": [
        "D:\\documentos\\Projetos\\AE-mcp\\node\\mcp-server.mjs"
      ]
    }
  }
}
```

Ajuste o caminho conforme a pasta local do projeto.

## Requisitos do After Effects

Antes de usar ferramentas que chamam JSX dentro do AE:

1. Abra o After Effects.
2. Abra o projeto `.aep` desejado.
3. Ative `Allow Scripts to Write Files and Access Network` em `Edit > Preferences > General`.
4. Garanta que `config.json` existe e aponta para o After Effects correto.

## Ferramentas MCP expostas

### `ae_project_ready`

Confere se o servidor enxerga:

- raiz do projeto;
- `node/cli.js`;
- `package.json`;
- `config.json`.

Use primeiro quando o agente não sabe se está operando no projeto certo.

### `ae_check_config`

Executa:

```bash
node node/cli.js check-config
```

Valida caminhos locais e configuração básica.

### `ae_scan_inventory`

Executa:

```bash
node node/cli.js scan-inventory
```

Gera/atualiza:

- `data/local_inventory.json`;
- `data/tool_groups.json`.

### `ae_context_advisor`

Executa:

```bash
node node/cli.js context-advisor "pergunta" --json
```

Use para classificar intenção e decidir o próximo comando.

### `ae_export_effects_catalog`

Executa:

```bash
node node/cli.js export-effects
```

Gera:

- `data/effects_catalog.json`.

### `ae_export_active_comp`

Exporta a composição ativa.

Parâmetro:

```json
{
  "deep": true
}
```

- `deep: false` gera `data/active_comp.json`;
- `deep: true` gera `data/active_comp_deep.json`.

### `ae_export_selected_layers`

Executa:

```bash
node node/cli.js export-selected-layers
```

Gera:

- `data/selected_layers.json`.

Requer uma composição ativa e layers selecionadas.

### `ae_export_diagnostics`

Executa:

```bash
node node/cli.js export-diagnostics
```

Gera:

- `data/diagnostics.json`.

### `ae_export_project_summary`

Executa:

```bash
node node/cli.js export-project-summary
```

Gera:

- `data/project_summary.json`.

### `ae_export_project_map`

Executa:

```bash
node node/cli.js export-project-map
```

Gera:

- `data/project_map.json`.

### `ae_export_comp_by_name`

Executa:

```bash
node node/cli.js export-comp-by-name "Nome da Comp" map
```

Parâmetros:

```json
{
  "comp": "Nome da Comp ou ID",
  "mode": "summary | map | deep"
}
```

### `ae_export_review_package`

Executa pacote técnico.

Parâmetros recomendados:

```json
{
  "runChecks": true,
  "deep": true
}
```

Equivale a:

```bash
node node/cli.js export-review-package --run-checks --deep
```

### `ae_export_visual_review_package`

Executa pacote visual.

Parâmetros recomendados:

```json
{
  "runChecks": true,
  "deep": true
}
```

Equivale a:

```bash
node node/cli.js export-visual-review-package --run-checks --deep
```

Gera/atualiza:

- `data/visual_review_packages/latest.json`.

### `ae_read_latest_context`

Lê JSONs conhecidos em `data/` sem permitir leitura arbitrária fora do projeto.

Exemplo:

```json
{
  "files": [
    "data/active_comp_deep.json",
    "data/diagnostics.json"
  ]
}
```

## Timeouts e espera por arquivos

As tools que chamam After Effects aceitam:

```json
{
  "timeoutMs": 180000,
  "waitMs": 90000
}
```

- `timeoutMs`: tempo máximo do processo Node/CLI.
- `waitMs`: tempo máximo para esperar os JSONs esperados aparecerem ou serem atualizados.

Isso existe porque alguns comandos apenas enviam JSX para o After Effects e o resultado real aparece depois em `data/`.

## Ordem recomendada para agentes

Para perguntas gerais de como fazer algo:

```text
1. ae_context_advisor
2. ler knowledge/docs indicados, se necessário
3. responder com orientação
```

Para problema técnico:

```text
1. ae_context_advisor
2. ae_export_review_package { runChecks: true, deep: true }
3. ae_read_latest_context com os JSONs relevantes
4. responder com diagnóstico
```

Para problema visual/estético:

```text
1. ae_context_advisor
2. ae_export_visual_review_package { runChecks: true, deep: true }
3. analisar frames/pacote visual
4. responder com diagnóstico visual
```

Para layer específica:

```text
1. ae_export_selected_layers
2. ae_read_latest_context ["data/selected_layers.json"]
3. responder sobre a layer selecionada
```

## Segurança

Nesta fase, o MCP server expõe apenas comandos analíticos e de empacotamento.

Ele não aplica presets, não gera JSX de edição automaticamente e não modifica o `.aep` por conta própria.
