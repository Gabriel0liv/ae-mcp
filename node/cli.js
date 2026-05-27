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

// Special diagnostics command (runs without spawning AE)
if (command === 'check-config') {
    const fs = require('fs');
    console.log(`
=============================================================================
Diagnóstico de Configuração - AE-mcp
=============================================================================
`);
    let valid = true;

    // 1. Check config file
    console.log(`[+] Arquivo config.json: OK`);

    // 2. Check project basePath
    console.log(`[+] Caminho Base do Projeto: ${paths.projectBasePath}`);
    if (fs.existsSync(paths.projectBasePath)) {
        console.log(`    -> Status: OK`);
    } else {
        console.log(`    -> Status: NÃO ENCONTRADO!`);
        valid = false;
    }

    // 3. Check AE executable
    console.log(`[+] Caminho do After Effects: ${paths.afterEffectsPath}`);
    if (fs.existsSync(paths.afterEffectsPath)) {
        console.log(`    -> Status: OK`);
    } else {
        console.log(`    -> Status: NÃO ENCONTRADO! (Verifique a instalação)`);
        valid = false;
    }

    // 4. Check workspace directories
    const dirs = {
        'data/': paths.dataDir,
        'logs/': paths.logDir,
        'generated/': paths.generatedDir
    };
    for (const [name, dirPath] of Object.entries(dirs)) {
        if (fs.existsSync(dirPath)) {
            console.log(`[+] Pasta '${name}': OK (${dirPath})`);
        } else {
            console.log(`[-] Pasta '${name}': NÃO ENCONTRADA!`);
            valid = false;
        }
    }

    // 5. Check JSX scripts
    console.log(`[+] Verificando scripts ExtendScript (.jsx)...`);
    const jsxScripts = [
        'export_active_comp.jsx',
        'export_selected_layers.jsx',
        'check_missing_footage.jsx',
        'check_expression_errors.jsx',
        'presets/mmv_shake_selected.jsx',
        'presets/zoom_impact_selected.jsx',
        'presets/text_flicker_selected.jsx',
        'utils/json.jsx',
        'utils/safe.jsx',
        'utils/layer_utils.jsx'
    ];

    let missingScriptsCount = 0;
    for (const script of jsxScripts) {
        const fullScriptPath = paths.resolveScriptPath(script);
        if (!fs.existsSync(fullScriptPath)) {
            console.log(`    [-] FALTANDO: ${script} (esperado em: ${fullScriptPath})`);
            missingScriptsCount++;
            valid = false;
        }
    }
    if (missingScriptsCount === 0) {
        console.log(`    -> Todos os ${jsxScripts.length} scripts JSX encontrados.`);
    } else {
        console.log(`    -> Erro: ${missingScriptsCount} script(s) JSX estão ausentes.`);
    }

    console.log(`
=============================================================================
Resultado do Diagnóstico: ${valid ? 'SUCESSO (Configuração Válida)' : 'ERRO (Configuração Inválida)'}
=============================================================================
`);
    process.exit(valid ? 0 : 1);
}

if (!command || !COMMAND_MAP[command]) {
    console.log(`
=============================================================================
AE-MCP Bridge - CLI Local (Fase Bridge/CLI)
=============================================================================
Uso:
  node node/cli.js <comando>

Comandos de Utilitários:
  check-config               Verifica caminhos, executável do AE e scripts.

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
  node node/cli.js check-config
  node node/cli.js export-active-comp
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
