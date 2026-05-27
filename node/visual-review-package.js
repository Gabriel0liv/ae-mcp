const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const paths = require('./paths');

// Helper to run CLI command and wait for file
function runCommandAndWaitForFile(fileKey, cliArg, targetFilePath, timeoutMs = 15000) {
    console.log(`[Pacote Visual] Executando: node node/cli.js ${cliArg}...`);
    if (fs.existsSync(targetFilePath)) {
        try { fs.unlinkSync(targetFilePath); } catch(e) {}
    }
    
    try {
        execSync(`node node/cli.js ${cliArg}`, { stdio: 'inherit' });
    } catch (err) {
        console.warn(`[Aviso] Falha ao executar 'node/cli.js ${cliArg}': ${err.message}`);
    }
    
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        if (fs.existsSync(targetFilePath)) {
            console.log(`[Pacote Visual] Arquivo gerado com sucesso: ${path.basename(targetFilePath)}`);
            return true;
        }
        const sleepStart = Date.now();
        while (Date.now() - sleepStart < 500) {}
    }
    console.log(`[Aviso] Tempo limite esgotado aguardando por ${path.basename(targetFilePath)}.`);
    return false;
}

const runChecks = process.argv.includes('--run-checks');
const now = new Date();

if (runChecks) {
    console.log(`\n=============================================================================`);
    console.log(`[Pacote Visual] Executando verificações no After Effects...`);
    console.log(`=============================================================================`);
    
    // 1. Check local_inventory.json
    const inventoryPath = path.join(paths.dataDir, "local_inventory.json");
    if (!fs.existsSync(inventoryPath)) {
        console.log(`[Pacote Visual] local_inventory.json ausente. Iniciando varredura...`);
        try {
            execSync(`node node/cli.js scan-inventory`, { stdio: 'inherit' });
        } catch(e) {
            console.warn(`[Aviso] Falha ao rodar scan-inventory: ${e.message}`);
        }
    }
    
    // 2. Check effects_catalog.json
    const effectsPath = path.join(paths.dataDir, "effects_catalog.json");
    if (!fs.existsSync(effectsPath)) {
        console.log(`[Pacote Visual] effects_catalog.json ausente. Executando export-effects...`);
        // We will run and wait for file
        runCommandAndWaitForFile("effects_catalog.json", "export-effects", effectsPath, 25000);
    }
    
    // 3. Run diagnostics, project summary, project map, and timeline frames
    const runTargets = [
        { key: "diagnostics.json", path: "diagnostics.json", runArg: "export-diagnostics" },
        { key: "project_summary.json", path: "project_summary.json", runArg: "export-project-summary" },
        { key: "project_map.json", path: "project_map.json", runArg: "export-project-map" },
        { key: "frames_context.json", path: "visual_snapshots/frames/frames_context.json", runArg: "export-timeline-frames" }
    ];
    
    for (const target of runTargets) {
        const fullPath = path.join(paths.dataDir, target.path);
        runCommandAndWaitForFile(target.key, target.runArg, fullPath, 20000);
    }
}

// Generate review package paths
const packagesBaseDir = path.join(paths.dataDir, 'visual_review_packages');
if (!fs.existsSync(packagesBaseDir)) {
    fs.mkdirSync(packagesBaseDir, { recursive: true });
}

const timestamp = now.getFullYear() + '-' +
    ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
    ('0' + now.getDate()).slice(-2) + '_' +
    ('0' + now.getHours()).slice(-2) + '-' +
    ('0' + now.getMinutes()).slice(-2) + '-' +
    ('0' + now.getSeconds()).slice(-2);

const packageDir = path.join(packagesBaseDir, timestamp);
fs.mkdirSync(packageDir, { recursive: true });

// Copy technical JSON files
const filesToCopy = [
    { key: "active_comp.json", source: path.join(paths.dataDir, "active_comp.json") },
    { key: "selected_layers.json", source: path.join(paths.dataDir, "selected_layers.json"), optional: true },
    { key: "diagnostics.json", source: path.join(paths.dataDir, "diagnostics.json") },
    { key: "expression_errors.json", source: path.join(paths.dataDir, "expression_errors.json") },
    { key: "missing_footage.json", source: path.join(paths.dataDir, "missing_footage.json") },
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

// Copy project_deep.json if it exists
const deepPath = path.join(paths.dataDir, "project_deep.json");
if (fs.existsSync(deepPath)) {
    filesToCopy.push({ key: "project_deep.json", source: deepPath });
}

const includedFiles = [];
const missingFiles = [];
const optionalUnavailableFiles = [];

for (const fileItem of filesToCopy) {
    let existsAndValid = false;
    if (fs.existsSync(fileItem.source)) {
        try {
            const content = fs.readFileSync(fileItem.source, 'utf8');
            const parsed = JSON.parse(content);
            if (parsed && parsed.ok === false) {
                existsAndValid = false;
            } else {
                existsAndValid = true;
            }
        } catch(e) {
            existsAndValid = true;
        }
    }
    
    if (fs.existsSync(fileItem.source)) {
        const destName = path.basename(fileItem.source);
        fs.copyFileSync(fileItem.source, path.join(packageDir, destName));
        includedFiles.push(destName);
    }
    
    if (!existsAndValid) {
        if (fileItem.optional) {
            optionalUnavailableFiles.push(fileItem.key);
        } else {
            missingFiles.push(fileItem.key);
        }
    }
}

// Copy Comps folder if exists
const compsSource = path.join(paths.dataDir, "comps");
if (fs.existsSync(compsSource)) {
    const compFiles = fs.readdirSync(compsSource);
    let compsDestCreated = false;
    for (const f of compFiles) {
        if (f.endsWith('.json')) {
            const compsDestDir = path.join(packageDir, "comps");
            if (!compsDestCreated) {
                fs.mkdirSync(compsDestDir, { recursive: true });
                compsDestCreated = true;
            }
            fs.copyFileSync(path.join(compsSource, f), path.join(compsDestDir, f));
            includedFiles.push(`comps/${f}`);
        }
    }
}

// Copy Visual Frames
const framesSourceDir = path.join(paths.dataDir, "visual_snapshots", "frames");
const framesDestDir = path.join(packageDir, "frames");
let hasFrames = false;
let frameCount = 0;
let markerFrameCount = 0;

if (fs.existsSync(framesSourceDir)) {
    const frameFiles = fs.readdirSync(framesSourceDir);
    for (const f of frameFiles) {
        if (f.endsWith('.png') || f === 'frames_context.json') {
            if (!hasFrames) {
                fs.mkdirSync(framesDestDir, { recursive: true });
                hasFrames = true;
            }
            fs.copyFileSync(path.join(framesSourceDir, f), path.join(framesDestDir, f));
            includedFiles.push(`frames/${f}`);
            
            if (f.endsWith('.png')) {
                frameCount++;
                if (f.startsWith('marker_')) {
                    markerFrameCount++;
                }
            }
        }
    }
}

// Copy Latest Preview Video (Best-Effort)
const previewsSourceParent = path.join(paths.dataDir, "visual_previews");
const previewDestDir = path.join(packageDir, "preview");
let hasPreview = false;
let previewFileName = null;

if (fs.existsSync(previewsSourceParent)) {
    const subfolders = fs.readdirSync(previewsSourceParent).filter(f => {
        return fs.statSync(path.join(previewsSourceParent, f)).isDirectory();
    });
    
    // Sort subfolders descending to find the latest
    subfolders.sort().reverse();
    
    if (subfolders.length > 0) {
        const latestPreviewDir = path.join(previewsSourceParent, subfolders[0]);
        const previewContext = path.join(latestPreviewDir, "preview_context.json");
        let previewVideo = null;
        let previewExt = "mp4"; // Default fallback
        
        if (fs.existsSync(previewContext)) {
            try {
                const ctx = JSON.parse(fs.readFileSync(previewContext, 'utf8'));
                if (ctx && ctx.status === "preview_available" && ctx.outputPath) {
                    if (fs.existsSync(ctx.outputPath)) {
                        previewVideo = ctx.outputPath;
                        previewExt = path.extname(previewVideo).slice(1);
                    }
                }
            } catch(e) {
                // Ignore parsing errors
            }
        }
        
        // Fallback to checking for mp4, avi, mov in the folder
        if (!previewVideo) {
            const possibleExts = ["mp4", "avi", "mov", "wmv", "mkv"];
            for (const ext of possibleExts) {
                const fileCheck = path.join(latestPreviewDir, `preview_lowres.${ext}`);
                if (fs.existsSync(fileCheck)) {
                    previewVideo = fileCheck;
                    previewExt = ext;
                    break;
                }
            }
        }
        
        if (previewVideo && fs.existsSync(previewVideo)) {
            fs.mkdirSync(previewDestDir, { recursive: true });
            const destFileName = `preview_lowres.${previewExt}`;
            fs.copyFileSync(previewVideo, path.join(previewDestDir, destFileName));
            includedFiles.push(`preview/${destFileName}`);
            hasPreview = true;
            previewFileName = `preview/${destFileName}`;
            
            if (fs.existsSync(previewContext)) {
                fs.copyFileSync(previewContext, path.join(previewDestDir, "preview_context.json"));
                includedFiles.push("preview/preview_context.json");
            }
        }
    }
}

// Calculate Visual Status
let visualStatus = "visual_context_missing";
if (hasFrames && hasPreview) {
    visualStatus = "frames_and_preview_available";
} else if (hasFrames) {
    visualStatus = "frames_available";
} else if (hasPreview) {
    visualStatus = "preview_available";
}

// Determine Active Comp Name
let compName = "caindo"; // Fallback to current project state name
try {
    const diagnosticsPath = path.join(paths.dataDir, "diagnostics.json");
    if (fs.existsSync(diagnosticsPath)) {
        const diag = JSON.parse(fs.readFileSync(diagnosticsPath, 'utf8'));
        if (diag && diag.diagnosticScope) {
            compName = diag.diagnosticScope;
        }
    }
} catch(e) {}

// Create visual_summary.json
const summaryData = {
    hasFrames: hasFrames,
    hasPreview: hasPreview,
    frameCount: frameCount,
    markerFrameCount: markerFrameCount,
    compName: compName,
    visualContextStatus: visualStatus,
    framesPath: hasFrames ? path.join(packageDir, "frames").replace(/\\/g, '/') : null,
    previewPath: hasPreview ? path.join(packageDir, previewFileName).replace(/\\/g, '/') : null,
    recommendedAIUse: hasFrames 
        ? "Use frames for static visual review (composition, framing, glow, color correction, styling)." 
        : "No visual frames available. Review technical logs only.",
    limitations: []
};

if (!hasPreview) {
    summaryData.limitations.push("Without preview video, the AI cannot fully evaluate timing, pacing, or motion fluidity.");
}
if (!hasFrames) {
    summaryData.limitations.push("Without static frame screenshots, the AI cannot evaluate layout composition, alignment, colors, or visual clarity.");
}

fs.writeFileSync(path.join(packageDir, "visual_summary.json"), JSON.stringify(summaryData, null, 2), 'utf8');
includedFiles.push("visual_summary.json");

// Generate prompt_for_visual_ai.md
const promptContent = `# Pacote de Revisão Visual do After Effects - Prompt de Instruções

Edite as seções marcadas com \`[PREENCHA AQUI]\` abaixo antes de enviar este prompt e os arquivos do pacote para o assistente de IA.

---

## Informações do Projeto & Contexto Visual
* **Data de Criação**: ${now.toISOString()}
* **Caminho do Pacote**: ${packageDir}
* **Status do Contexto Visual**: **${visualStatus}**
* **Imagens de Frames Incluídas**: ${hasFrames ? `${frameCount} frame(s)` : 'Nenhuma'}
* **Preview de Vídeo Incluído**: ${hasPreview ? 'Sim (MP4)' : 'Não'}

---

## Contexto Criativo (Campos Editáveis)

### 1. Objetivo criativo
[PREENCHA AQUI]
*(Exemplo: "Quero fazer um impacto no beat de MMV dark/action sincado com a animação de câmera e o corte de cena.")*

### 2. Problema percebido
[PREENCHA AQUI]
*(Exemplo: "O impacto parece fraco, o personagem não se destaca do fundo escuro e o glow nas bordas parece exageradamente forte/estourado.")*

### 3. Estilo desejado
[PREENCHA AQUI]
*(Exemplo: "Estilo anime dark/action, alto contraste, cores dessaturadas com detalhes azuis brilhantes, transição fluida.")*

### 4. O que eu quero receber da IA
[PREENCHA AQUI]
*(Exemplo: "Quero sugestões de correção de cores (CC), níveis de opacidade do glow, enquadramento do personagem e melhorias no gráfico de curvas da câmera.")*

---

## Instruções para o Assistente de IA
Como assistente de IA especializado em After Effects, edição de MMV e anime edits:
1. **Analise os frames estáticos (PNG)** no diretório \`frames/\` (como \`current_frame.png\`, \`start_frame.png\`, etc.) para avaliar enquadramento, contraste de cores (CC), legibilidade de texto, intensidade de glow e poluição visual.
2. **Analise o vídeo de preview (\`preview_lowres.mp4\`)** se disponível, avaliando o ritmo do shake, timing do corte, suavidade de transição e fluidez de movimento.
3. Compare com os metadados técnicos dos arquivos JSON:
   - \`diagnostics.json\` para checar shy layers, falta de motion blur ou opacidade 0.
   - \`active_comp.json\` e \`selected_layers.json\` para ver a estrutura e curvas de keyframes.
   - \`visual_summary.json\` para checar as limitações do pacote.
4. Forneça diagnósticos claros divididos em:
   - **Problemas Técnicos** (erros no código ou flags de renderização).
   - **Problemas Visuais/Estéticos** (composição, luz, contraste, timing).
   - **Correções recomendadas** (passo a passo no After Effects ou JSX seguro a ser rodado apenas em composição cópia).
5. **Atenção**: Se não houver preview de vídeo (apenas frames PNG estáticos), lembre-se de que você não possui contexto de movimento contínuo e não deve fazer afirmações definitivas sobre a fluidez de timing.
`;

fs.writeFileSync(path.join(packageDir, 'prompt_for_visual_ai.md'), promptContent, 'utf8');
includedFiles.push("prompt_for_visual_ai.md");

// Recommended commands for missing parts
const recommendedNextCommands = [];
const missingVisualFiles = [];
const includedVisualFiles = [];

if (hasFrames) {
    includedVisualFiles.push("frames/");
} else {
    missingVisualFiles.push("frames/");
    recommendedNextCommands.push("node node/cli.js export-timeline-frames");
}

if (hasPreview) {
    includedVisualFiles.push(previewFileName);
} else {
    missingVisualFiles.push("preview/preview_lowres.mp4");
    recommendedNextCommands.push("node node/cli.js render-preview");
}

// Generate visual_review_manifest.json
const manifest = {
    createdAt: now.toISOString(),
    packagePath: packageDir,
    includedFiles: includedFiles,
    missingFiles: missingFiles,
    optionalUnavailableFiles: optionalUnavailableFiles,
    includedVisualFiles: includedVisualFiles,
    missingVisualFiles: missingVisualFiles,
    visualContextStatus: visualStatus,
    recommendedNextCommands: recommendedNextCommands.length > 0 ? recommendedNextCommands : ["Nenhum. Todos os arquivos de contexto estão completos."],
    userPromptTemplate: `Olá! Criei um pacote de revisão visual da minha composição do After Effects. Por favor, analise as mídias e JSONs localizados em "${packageDir.replace(/\\/g, '/')}" com base nas orientações do arquivo prompt_for_visual_ai.md.`,
    notesForAI: "Este pacote contém imagens/vídeo para análise estética direta por IAs com capacidade multimodal.",
    note: optionalUnavailableFiles.includes("selected_layers.json") 
        ? "No selected layers were available; package still valid for comp/project review." 
        : "Selected layers and composition context successfully packaged."
};

fs.writeFileSync(path.join(packageDir, 'visual_review_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
includedFiles.push("visual_review_manifest.json");

// Write latest package pointer
const latestPointerPath = path.join(packagesBaseDir, "latest.json");
const latestPointer = {
    latestPackagePath: packageDir.replace(/\\/g, '/')
};
fs.writeFileSync(latestPointerPath, JSON.stringify(latestPointer, null, 2), 'utf8');

console.log(`\n=============================================================================`);
console.log(`[Pacote Visual] Pacote gerado com SUCESSO!`);
console.log(`  * Status: ${visualStatus}`);
console.log(`  * Arquivos incluídos: ${includedFiles.length}`);
if (missingFiles.length > 0 || missingVisualFiles.length > 0) {
    console.log(`  * Arquivos ausentes: ${missingFiles.length} técnicos, ${missingVisualFiles.length} visuais`);
}
console.log(`  * CAMINHO COMPLETO DO PACOTE CRIADO:`);
console.log(`    -> ${path.resolve(packageDir)}`);
console.log(`=============================================================================`);
