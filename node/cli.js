const paths = require('./paths');
const runAeScript = require('./run-ae-script');

const command = process.argv[2];

// Map command args to corresponding JSX script filenames
const COMMAND_MAP = {
    'export-active-comp': 'export_active_comp.jsx',
    'export-selected-layers': 'export_selected_layers.jsx',
    'check-missing-footage': 'check_missing_footage.jsx',
    'check-expression-errors': 'check_expression_errors.jsx',
    'mmv-shake': 'mmv_shake_selected.jsx',
    'zoom-impact': 'zoom_impact_selected.jsx',
    'text-flicker': 'text_flicker_selected.jsx'
};

if (!command || !COMMAND_MAP[command]) {
    console.log(`
=============================================================================
AE-MCP Bridge - CLI Local (Fase Bridge/CLI)
=============================================================================
Uso:
  node node/cli.js <comando>

Comandos de Leitura (Gera arquivos JSON na pasta 'data/'):
  export-active-comp         Exporta metadados da comp ativa e seus layers.
  export-selected-layers     Exporta transformações e keyframes dos layers selecionados.
  check-missing-footage      Identifica footages ausentes no projeto.
  check-expression-errors    Faz varredura profunda por erros de expressões.

Comandos de Edição (Cria cópia segura e aplica efeitos/expressões):
  mmv-shake                  Aplica tremor de posição e ativa Motion Blur.
  zoom-impact                Aplica animação curta de impacto na Escala/Posição.
  text-flicker               Aplica flicker estroboscópico de opacidade.

Exemplos:
  node node/cli.js export-active-comp
  node node/cli.js mmv-shake
=============================================================================
`);
    process.exit(1);
}

const scriptName = COMMAND_MAP[command];
const scriptPath = paths.resolveScriptPath(scriptName);

runAeScript(scriptPath, (err) => {
    if (err) {
        process.exit(1);
    }
    process.exit(0);
});
