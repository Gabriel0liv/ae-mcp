const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const paths = require('./paths');

// Helper to wait for command execution and file creation
function runCommandAndWaitForFile(fileKey, cliArg, targetFilePath, timeoutMs = 15000) {
    console.log(`[Revisão] Executando: node node/cli.js ${cliArg}...`);
    if (fs.existsSync(targetFilePath)) {
        try { fs.unlinkSync(targetFilePath); } catch(e) {}
    }
    
    try {
        // Run CLI command. Using stdio: 'inherit' to show subprocess stdout.
        execSync(`node node/cli.js ${cliArg}`, { stdio: 'inherit' });
    } catch (err) {
        console.warn(`[Aviso] Falha ao executar 'node/cli.js ${cliArg}': ${err.message}`);
    }
    
    // Poll for the file appearance (wait up to timeoutMs)
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        if (fs.existsSync(targetFilePath)) {
            console.log(`[Revisão] Arquivo gerado com sucesso: ${path.basename(targetFilePath)}`);
            return true;
        }
        // Small synchronous sleep (500ms)
        const sleepStart = Date.now();
        while (Date.now() - sleepStart < 500) {}
    }
    console.log(`[Aviso] Tempo esgotado aguardando pela criação de ${path.basename(targetFilePath)}.`);
    return false;
}

const runChecks = process.argv.includes('--run-checks');

const expectedAEFiles = [
    { key: "active_comp.json", path: "active_comp.json", runArg: "export-active-comp" },
    { key: "selected_layers.json", path: "selected_layers.json", runArg: "export-selected-layers" },
    { key: "expression_errors.json", path: "expression_errors.json", runArg: "check-expression-errors" },
    { key: "missing_footage.json", path: "missing_footage.json", runArg: "check-missing-footage" },
    { key: "diagnostics.json", path: "diagnostics.json", runArg: "export-diagnostics" },
    { key: "project_summary.json", path: "project_summary.json", runArg: "export-project-summary" },
    { key: "project_map.json", path: "project_map.json", runArg: "export-project-map" }
];

if (runChecks) {
    console.log(`\n=============================================================================`);
    console.log(`[Revisão] Iniciando execução prévia de verificações no After Effects...`);
    console.log(`=============================================================================`);
    
    // 1. Refresh inventory
    try {
        console.log(`[Revisão] Atualizando scan-inventory...`);
        execSync(`node node/cli.js scan-inventory`, { stdio: 'inherit' });
    } catch(e) {
        console.warn(`[Aviso] Falha ao rodar scan-inventory: ${e.message}`);
    }
    
    // 2. Run AE exports
    for (const item of expectedAEFiles) {
        const fullPath = path.join(paths.dataDir, item.path);
        runCommandAndWaitForFile(item.key, item.runArg, fullPath, 15000);
    }
}

// Prepare review package folder
const reviewPackagesBaseDir = path.join(paths.dataDir, 'review_packages');
if (!fs.existsSync(reviewPackagesBaseDir)) {
    fs.mkdirSync(reviewPackagesBaseDir, { recursive: true });
}

// Generate YYYY-MM-DD_HH-MM-SS timestamp
const now = new Date();
const timestamp = now.getFullYear() + '-' +
    ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
    ('0' + now.getDate()).slice(-2) + '_' +
    ('0' + now.getHours()).slice(-2) + '-' +
    ('0' + now.getMinutes()).slice(-2) + '-' +
    ('0' + now.getSeconds()).slice(-2);

const packageDir = path.join(reviewPackagesBaseDir, timestamp);
fs.mkdirSync(packageDir, { recursive: true });

console.log(`\n[Revisão] Criando pacote de revisão em: ${packageDir}`);

const filesToCopy = [
    { key: "active_comp.json", source: path.join(paths.dataDir, "active_comp.json") },
    { key: "selected_layers.json", source: path.join(paths.dataDir, "selected_layers.json") },
    { key: "expression_errors.json", source: path.join(paths.dataDir, "expression_errors.json") },
    { key: "missing_footage.json", source: path.join(paths.dataDir, "missing_footage.json") },
    { key: "diagnostics.json", source: path.join(paths.dataDir, "diagnostics.json") },
    { key: "project_summary.json", source: path.join(paths.dataDir, "project_summary.json") },
    { key: "project_map.json", source: path.join(paths.dataDir, "project_map.json") },
    { key: "local_inventory.json", source: path.join(paths.dataDir, "local_inventory.json") },
    { key: "tool_groups.json", source: path.join(paths.dataDir, "tool_groups.json") },
    { key: "effects_catalog.json", source: path.join(paths.dataDir, "effects_catalog.json") }
];

// Add tool capabilities
const localCaps = path.join(paths.dataDir, "tool_capabilities.json");
const exampleCaps = path.join(paths.dataDir, "tool_capabilities.example.json");
if (fs.existsSync(localCaps)) {
    filesToCopy.push({ key: "tool_capabilities.json", source: localCaps });
} else if (fs.existsSync(exampleCaps)) {
    filesToCopy.push({ key: "tool_capabilities.json", source: exampleCaps });
}

const includedFiles = [];
const missingFiles = [];
const recommendedNextCommands = [];

for (const fileItem of filesToCopy) {
    if (fs.existsSync(fileItem.source)) {
        const destName = path.basename(fileItem.source);
        const destPath = path.join(packageDir, destName);
        fs.copyFileSync(fileItem.source, destPath);
        includedFiles.push(destName);
    } else {
        missingFiles.push(fileItem.key);
        // Find if this missing file has an expected AE runner
        const aeFile = expectedAEFiles.find(f => f.key === fileItem.key);
        if (aeFile) {
            recommendedNextCommands.push(`node node/cli.js ${aeFile.runArg}`);
        } else if (fileItem.key === "local_inventory.json") {
            recommendedNextCommands.push("node node/cli.js scan-inventory");
        }
    }
}

// Copy project_deep.json if it exists
const deepPath = path.join(paths.dataDir, "project_deep.json");
if (fs.existsSync(deepPath)) {
    const destPath = path.join(packageDir, "project_deep.json");
    fs.copyFileSync(deepPath, destPath);
    includedFiles.push("project_deep.json");
}

// Copy any comp JSON files from data/comps/*.json
const compsDir = path.join(paths.dataDir, "comps");
if (fs.existsSync(compsDir)) {
    const compFiles = fs.readdirSync(compsDir);
    let compsDestCreated = false;
    for (const f of compFiles) {
        if (f.endsWith('.json')) {
            const src = path.join(compsDir, f);
            const compsDestDir = path.join(packageDir, "comps");
            if (!compsDestCreated) {
                if (!fs.existsSync(compsDestDir)) {
                    fs.mkdirSync(compsDestDir, { recursive: true });
                }
                compsDestCreated = true;
            }
            const dest = path.join(compsDestDir, f);
            fs.copyFileSync(src, dest);
            includedFiles.push(`comps/${f}`);
        }
    }
}

if (recommendedNextCommands.length === 0) {
    recommendedNextCommands.push("Nenhum. Todos os arquivos de contexto necessários foram compilados com sucesso.");
}

// Generate prompt_for_ai.md content
const promptContent = `# Pacote de Revisão do After Effects - Prompt de Instruções

Edite as seções marcadas com \`[PREENCHA AQUI]\` abaixo antes de enviar este prompt e os arquivos do pacote para o assistente de IA.

---

## Informações do Projeto
* **Data de Criação**: ${now.toISOString()}
* **Caminho do Pacote**: ${packageDir}
* **Arquivos Incluídos**:
${includedFiles.map(f => `  * ${f}`).join('\n')}
* **Arquivos Ausentes**:
${missingFiles.length > 0 ? missingFiles.map(f => `  * ${f}`).join('\n') : '  * Nenum arquivo ausente.'}

---

## Contexto Criativo (Campos Editáveis)

### 1. Objetivo criativo
[PREENCHA AQUI]
*(Exemplo: "Quero fazer um edit de AMV de ação rápida sincado com as batidas de bateria e golpes de espada.")*

### 2. Problema percebido
[PREENCHA AQUI]
*(Exemplo: "O tremor de câmera (shake) parece muito lento e sem energia nas batidas fortes, e o cabelo ondulado está deformando ao balançar.")*

### 3. Estilo desejado
[PREENCHA AQUI]
*(Exemplo: "Estilo Dark/Action, cores contrastadas e frias, flash no beat e glows densos nos cortes.")*

### 4. O que eu quero receber da IA
[PREENCHA AQUI]
*(Exemplo: "Quero sugestões de curvas no Speed Graph para a transição de zoom e a expressão correta para o rig do cotovelo.")*

---

## Instruções para o Assistente de IA
Como assistente especializado em After Effects, MMV e anime edits:
1. Analise o arquivo \`diagnostics.json\` para mapear problemas técnicos (como opacidade zero, falta de motion blur ou erros de expressões).
2. Analise os arquivos \`active_comp.json\` e \`selected_layers.json\` para entender a hierarquia de layers e keyframes do usuário.
3. Compare o setup do usuário com as ferramentas mapeadas em \`local_inventory.json\` e \`tool_capabilities.json\`.
4. Elabore um plano de ação recomendando correções manuais passo a passo ou propondo códigos JSX seguros para aplicar correções na composição.
`;

fs.writeFileSync(path.join(packageDir, 'prompt_for_ai.md'), promptContent, 'utf8');

// Check for latest visual package
let latestVisualReviewPackage = null;
let visualContextAvailable = false;
try {
    const latestVisualJson = path.join(paths.dataDir, "visual_review_packages", "latest.json");
    if (fs.existsSync(latestVisualJson)) {
        const latestVal = JSON.parse(fs.readFileSync(latestVisualJson, 'utf8'));
        if (latestVal && latestVal.latestPackagePath) {
            latestVisualReviewPackage = latestVal.latestPackagePath;
            if (fs.existsSync(latestVisualReviewPackage)) {
                visualContextAvailable = true;
            }
        }
    }
} catch(e) {}

// Generate review_manifest.json content
const manifest = {
    createdAt: now.toISOString(),
    packagePath: packageDir,
    includedFiles: includedFiles,
    missingFiles: missingFiles,
    visualContextStatus: visualContextAvailable ? "frames_available_via_visual_package" : "not_available",
    latestVisualReviewPackage: latestVisualReviewPackage,
    visualContextAvailable: visualContextAvailable,
    recommendedVisualCommand: "node node/cli.js export-visual-review-package --run-checks",
    recommendedNextCommands: recommendedNextCommands,
    userPromptTemplate: `Olá! Criei um pacote de revisão técnica da minha composição do After Effects. Por favor, analise os arquivos do pacote localizado em "${packageDir.replace(/\\/g, '/')}" com base nas instruções do arquivo prompt_for_ai.md.`
};

fs.writeFileSync(path.join(packageDir, 'review_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

console.log(`\n[Revisão] Pacote gerado com SUCESSO!`);
console.log(`  * Arquivos incluídos no pacote: ${includedFiles.length}`);
console.log(`  * Arquivos ausentes: ${missingFiles.length}`);
if (missingFiles.length > 0) {
    console.log(`  * Dica: Verifique a lista de comandos recomendados para gerar os arquivos ausentes.`);
}
console.log(`  * Prompt gerado em: ${path.join(packageDir, 'prompt_for_ai.md')}`);
console.log(`  * Manifest gerado em: ${path.join(packageDir, 'review_manifest.json')}`);
console.log(`=============================================================================`);
