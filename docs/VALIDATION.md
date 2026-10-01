# Validation Checklist

Use esta checklist antes de mergear a fundação MCP.

## 1. Instalação

```bash
npm install
```

Esperado:

- instala `@modelcontextprotocol/sdk`;
- instala `zod`;
- gera/atualiza `package-lock.json` localmente, se usado no projeto.

## 2. Servidor inicia

```bash
npm run mcp
```

Esperado:

- processo fica aberto aguardando protocolo MCP;
- não imprime logs livres no stdout;
- não encerra imediatamente com erro de import.

## 3. Teste com inspector

```bash
npx @modelcontextprotocol/inspector node node/mcp-server.mjs
```

Ferramentas mínimas para testar:

1. `ae_project_ready`
2. `ae_check_config`
3. `ae_context_advisor`
4. `ae_scan_inventory`

## 4. Teste com After Effects aberto

Abra o After Effects e um projeto `.aep`.

Depois teste:

```json
{
  "tool": "ae_export_active_comp",
  "arguments": {
    "deep": true,
    "timeoutMs": 180000,
    "waitMs": 90000
  }
}
```

Esperado:

- `data/active_comp_deep.json` é gerado/atualizado;
- resposta da tool mostra `ok: true`;
- `expectedFiles.satisfied: true`.

## 5. Teste com layer selecionada

Selecione uma layer na timeline.

Rode:

```json
{
  "tool": "ae_export_selected_layers",
  "arguments": {
    "timeoutMs": 180000,
    "waitMs": 90000
  }
}
```

Esperado:

- `data/selected_layers.json` é gerado;
- se não houver seleção, retorna erro estruturado, não popup travando o AE.

## 6. Teste visual package

```json
{
  "tool": "ae_export_visual_review_package",
  "arguments": {
    "runChecks": true,
    "deep": true,
    "timeoutMs": 300000,
    "waitMs": 120000
  }
}
```

Esperado:

- `data/visual_review_packages/latest.json` é gerado/atualizado;
- pacote contém prompt, manifest, JSONs técnicos e frames quando possível.

## 7. Problemas conhecidos desta fase

- O pacote técnico (`ae_export_review_package`) ainda não espera por um `latest.json` porque o empacotador técnico pode não gerar esse índice.
- Ainda não existe `ae_wait_for_status`; o wait atual é baseado em arquivos esperados.
- Ainda não há analyzer automático `data/findings.json`.
- Ainda não há tools de edição/aplicação segura.

## 8. Critério para merge

Pode mergear se:

- `npm install` passa;
- `npm run mcp` inicia;
- MCP Inspector lista as tools;
- `ae_project_ready` retorna caminhos corretos;
- pelo menos uma tool que chama AE gera o JSON esperado.
