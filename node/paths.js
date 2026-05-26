const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');

// Rule 11: If config.json does not exist, display clear instructions to copy config.example.json and exit.
if (!fs.existsSync(configPath)) {
    console.error(`
=============================================================================
[ERRO DE CONFIGURAÇÃO] Arquivo config.json não encontrado.

Por favor, copie o modelo 'config.example.json' para 'config.json':
  No terminal/prompt:
    copy config.example.json config.json
  Ou no PowerShell:
    cp config.example.json config.json

Abra o arquivo 'config.json' e configure:
1. "afterEffectsPath": O caminho completo para o 'AfterFX.exe' no seu sistema.
2. "projectBasePath": O caminho absoluto para esta pasta do projeto.
=============================================================================
`);
    process.exit(1);
}

let config;
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
    console.error(`Erro ao decodificar 'config.json': ${e.message}`);
    process.exit(1);
}

// Resolve absolute base path
const projectBasePath = path.resolve(config.projectBasePath || path.join(__dirname, '..'));

// Ensure required fields
if (!config.afterEffectsPath) {
    console.error("Erro no config.json: O campo 'afterEffectsPath' é obrigatório.");
    process.exit(1);
}

// Helper to ensure directory exists
function ensureDir(dirName) {
    const fullPath = path.isAbsolute(dirName) ? dirName : path.join(projectBasePath, dirName);
    if (!fs.existsSync(fullPath)) {
        try {
            fs.mkdirSync(fullPath, { recursive: true });
        } catch (e) {
            console.error(`Não foi possível criar o diretório '${fullPath}': ${e.message}`);
        }
    }
    return fullPath;
}

// Ensure required project folders are present
const dataDir = ensureDir(config.dataDir || 'data');
const logDir = ensureDir(config.logDir || 'logs');
const generatedDir = ensureDir('generated');

module.exports = {
    config,
    projectBasePath,
    afterEffectsPath: config.afterEffectsPath,
    dataDir,
    logDir,
    generatedDir,
    
    // Resolves a script name to its absolute JSX path (looks in root of jsx/ or in jsx/presets/)
    resolveScriptPath(scriptName) {
        // Normalize name
        let cleanName = scriptName;
        if (!cleanName.endsWith('.jsx')) {
            cleanName += '.jsx';
        }
        
        const pathDirect = path.join(projectBasePath, 'jsx', cleanName);
        const pathPreset = path.join(projectBasePath, 'jsx/presets', cleanName);
        
        if (fs.existsSync(pathDirect)) {
            return pathDirect;
        } else if (fs.existsSync(pathPreset)) {
            return pathPreset;
        }
        
        // If not found, return the expected location in the root of jsx/ for error reporting
        return pathDirect;
    }
};
