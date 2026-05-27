const paths = require('./paths');
const runAeScript = require('./run-ae-script');

const command = process.argv[2];

// Map command args to corresponding JSX script filenames
const COMMAND_MAP = {
    'export-active-comp': 'export_active_comp.jsx',
    'export-selected-layers': 'export_selected_layers.jsx',
    'check-missing-footage': 'check_missing_footage.jsx',
    'check-expression-errors': 'check_expression_errors.jsx',
    'export-effects': 'export_effects_catalog.jsx',
    'mmv-shake': 'mmv_shake_selected.jsx',
    'zoom-impact': 'zoom_impact_selected.jsx',
    'text-flicker': 'text_flicker_selected.jsx'
};

// Command: scan-inventory (runs locally in Node.js, without opening After Effects)
if (command === 'scan-inventory') {
    const { spawn } = require('child_process');
    const path = require('path');
    console.log(`[Ponte] Iniciando varredura local do inventário de ferramentas...\n`);
    
    const scanProcess = spawn(process.execPath, [path.join(__dirname, 'scan-inventory.js')], {
        stdio: 'inherit'
    });
    
    scanProcess.on('close', (code) => {
        process.exit(code);
    });
    return;
}

// Special diagnostics command (runs without spawning AE)
if (command === 'check-config') {
    const fs = require('fs');
    const path = require('path');
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

    // 5. Check Inventory Paths (warnings on missing, NOT fatal errors)
    const inventoryConfig = paths.config.inventory || {};
    const inventoryKeys = [
        { key: 'pluginDirs', label: 'Plug-ins' },
        { key: 'scriptDirs', label: 'Scripts/ScriptUI' },
        { key: 'presetDirs', label: 'Presets' },
        { key: 'extensionDirs', label: 'CEP Extensions' },
        { key: 'mixedContentDirs', label: 'Mixed Content Folders' },
        { key: 'docDirs', label: 'Documentation/Docs' }
    ];

    console.log(`\n[+] Verificando diretórios do Inventário local...`);
    for (const item of inventoryKeys) {
        const pathsList = inventoryConfig[item.key];
        if (pathsList && Array.isArray(pathsList)) {
            console.log(`  * Categoria: ${item.label} (${item.key})`);
            for (const rawPath of pathsList) {
                // Expand variables
                const expanded = rawPath.replace(/%([^%]+)%/g, (_, name) => process.env[name] || `%${name}%`);
                const resolved = path.isAbsolute(expanded) 
                    ? expanded 
                    : path.resolve(paths.projectBasePath, expanded);
                
                if (fs.existsSync(resolved)) {
                    console.log(`    [OK] ${resolved}`);
                } else {
                    console.log(`    [AVISO] Não encontrado: ${resolved}`);
                }
            }
        } else {
            console.log(`  [-] Categoria ausente no config.json: ${item.key}`);
        }
    }

    // Check for overlaps / duplicate paths in configuration
    const pluginDirs = inventoryConfig.pluginDirs || [];
    const mixedContentDirs = inventoryConfig.mixedContentDirs || [];
    const duplicates = [];
    for (const p of pluginDirs) {
        for (const m of mixedContentDirs) {
            const expP = p.replace(/%([^%]+)%/g, (_, name) => process.env[name] || `%${name}%`);
            const resP = path.resolve(paths.projectBasePath, expP).toLowerCase();
            const expM = m.replace(/%([^%]+)%/g, (_, name) => process.env[name] || `%${name}%`);
            const resM = path.resolve(paths.projectBasePath, expM).toLowerCase();
            if (resP === resM) {
                duplicates.push(p);
            }
        }
    }
    if (duplicates.length > 0) {
        console.log(`\n[AVISO] Sobreposição configurada detectada entre pluginDirs e mixedContentDirs:`);
        for (const dup of duplicates) {
            console.log(`  * ${dup}`);
        }
        console.log(`  -> O scanner de inventário desduplicará automaticamente arquivos e grupos durante a varredura.`);
    }

    // 6. Validate Tool Capabilities Specs
    console.log(`\n[+] Verificando arquivos de especificações de ferramentas...`);
    const capabilitiesPath = path.join(paths.projectBasePath, 'data/tool_capabilities.example.json');
    if (fs.existsSync(capabilitiesPath)) {
        console.log(`    [OK] data/tool_capabilities.example.json`);
    } else {
        console.log(`    [ERRO FORTE] data/tool_capabilities.example.json NÃO ENCONTRADO!`);
        valid = false;
    }

    const localCapabilitiesPath = path.join(paths.projectBasePath, 'data/tool_capabilities.json');
    if (fs.existsSync(localCapabilitiesPath)) {
        console.log(`    [OK] data/tool_capabilities.json (Especificações locais carregadas)`);
    } else {
        console.log(`    [AVISO/RECOMENDAÇÃO] Arquivo local data/tool_capabilities.json ausente.`);
        console.log(`    -> Copie o modelo 'data/tool_capabilities.example.json' para personalizações privadas.`);
    }

    // 7. Check Node script files
    console.log(`\n[+] Verificando scripts utilitários do Node...`);
    const nodeScripts = ['paths.js', 'run-ae-script.js', 'cli.js', 'scan-inventory.js'];
    for (const script of nodeScripts) {
        const fullPath = path.join(__dirname, script);
        if (fs.existsSync(fullPath)) {
            console.log(`    [OK] node/${script}`);
        } else {
            console.log(`    [-] FALTANDO: node/${script}`);
            valid = false;
        }
    }

    // 8. Check JSX scripts
    console.log(`\n[+] Verificando scripts ExtendScript (.jsx)...`);
    const jsxScripts = [
        'export_active_comp.jsx',
        'export_selected_layers.jsx',
        'check_missing_footage.jsx',
        'check_expression_errors.jsx',
        'export_effects_catalog.jsx',
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
AE-MCP Bridge - CLI Local (Fase Tool Inventory)
=============================================================================
Uso:
  node node/cli.js <comando>

Comandos de Utilitários:
  check-config               Verifica caminhos, diretórios de inventário e scripts.
  scan-inventory             Mapeia localmente plugins, scripts, presets e docs.

Comandos de Leitura (Gera arquivos JSON na pasta 'data/'):
  export-effects             Exporta catálogo de efeitos instalados no After Effects.
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
  node node/cli.js scan-inventory
  node node/cli.js export-effects
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
