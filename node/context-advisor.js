const fs = require('fs');
const path = require('path');

const INTENTS_FILE = path.join(__dirname, '../actions/assistant_intents.json');
const KNOWLEDGE_DIR = path.join(__dirname, '../knowledge');

function loadIntents() {
    try {
        if (fs.existsSync(INTENTS_FILE)) {
            return JSON.parse(fs.readFileSync(INTENTS_FILE, 'utf8'));
        }
    } catch (e) {
        // Fallback
    }
    return [
        { "intent": "how_to", "needsInventory": true, "needsKnowledge": true },
        { "intent": "troubleshoot", "needsInventory": true, "needsProjectContext": true },
        { "intent": "visual_review", "needsInventory": true, "needsProjectContext": true, "needsVisualContext": true },
        { "intent": "plan_workflow", "needsInventory": true, "needsKnowledge": true },
        { "intent": "safe_edit_proposal", "needsInventory": true, "needsProjectContext": true }
    ];
}

const args = process.argv.slice(2);
let jsonMode = false;
let query = '';

for (const arg of args) {
    if (arg === '--json') {
        jsonMode = true;
    } else {
        query += (query ? ' ' : '') + arg;
    }
}

if (!query) {
    if (jsonMode) {
        console.log(JSON.stringify({ error: "Query vazia. Por favor forneça uma pergunta ou descrição." }, null, 2));
    } else {
        console.log("Uso: node node/context-advisor.js <pergunta> [--json]");
    }
    process.exit(1);
}

const lowerQuery = query.toLowerCase();

// 1. Heuristics for Intent and Confidence
let intent = "plan_workflow";
let confidence = "low";
let reason = "Não foi encontrada correspondência forte. Assumindo planejamento de workflow geral.";

const troubleshootKeywords = ["erro", "bug", "falha", "not working", "problema", "nao funciona", "não funciona", "quebrou", "offline", "ausente", "missing", "invalido", "inválido", "warn", "warning", "trava", "error", "dá erro", "da erro"];
const visualKeywords = ["estranho", "feio", "ugly", "esquisito", "ruim", "olhar", "review", "estilo", "timing", "sincronia", "ritmo", "visual", "desajustado", "esquisita", "glow", "impacto fraco", "fraco", "ilegivel", "ilegível", "poluido", "poluído", "enquadrado", "enquadramento", "cores ruins", "cc ruim", "shake exagerado", "dura", "sem fluidez", "falta de foco"];
const editKeywords = ["aplicar", "escrever script", "gerar script", "automatizar", "modificar", "alterar", "preset-apply", "aplicar preset", "safe edit", "corrigir com script", "scriptar", "rodar jsx"];
const howtoKeywords = ["como fazer", "como faço", "como posso", "como criar", "how to", "passos para", "como posicionar", "criar rig", "como configurar", "como animar", "como usar", "como"];

let troubleshootCount = troubleshootKeywords.filter(k => lowerQuery.includes(k)).length;
let visualCount = visualKeywords.filter(k => lowerQuery.includes(k)).length;
let editCount = editKeywords.filter(k => lowerQuery.includes(k)).length;
let howtoCount = howtoKeywords.filter(k => lowerQuery.includes(k)).length;

if (visualCount > 0) {
    intent = "visual_review";
    confidence = visualCount > 1 ? "high" : "medium";
    reason = "Detectado termos relacionados a avaliação estética, sincronia, enquadramento ou review visual.";
} else if (troubleshootCount > 0) {
    intent = "troubleshoot";
    confidence = troubleshootCount > 1 ? "high" : "medium";
    reason = "Detectado termos relacionados a erros técnicos, falhas ou problemas de execução de scripts/ferramentas.";
} else if (editCount > 0) {
    intent = "safe_edit_proposal";
    confidence = editCount > 1 ? "high" : "medium";
    reason = "Detectado interesse em aplicar mídias ou gerar scripts automatizados de edição.";
} else if (howtoCount > 0) {
    intent = "how_to";
    confidence = howtoCount > 1 ? "high" : "medium";
    reason = "Detectado termos interrogativos sobre como criar ou configurar efeitos e elementos.";
}

// 2. Identify relevant knowledge files
const knowledgeMappings = [
    { key: "impact", file: "workflows/mmv-impact.md" },
    { key: "beat", file: "workflows/mmv-impact.md" },
    { key: "shake", file: "workflows/mmv-impact.md" },
    { key: "zoom", file: "workflows/mmv-impact.md" },
    { key: "batida", file: "workflows/mmv-impact.md" },
    { key: "cor", file: "workflows/color-correction.md" },
    { key: "grade", file: "workflows/color-correction.md" },
    { key: "color", file: "workflows/color-correction.md" },
    { key: "lumetri", file: "workflows/color-correction.md" },
    { key: "curves", file: "workflows/color-correction.md" },
    { key: "looks", file: "workflows/color-correction.md" },
    { key: "composi", file: "workflows/scene-composition.md" },
    { key: "scen", file: "workflows/scene-composition.md" },
    { key: "bg", file: "workflows/scene-composition.md" },
    { key: "parallax", file: "workflows/scene-composition.md" },
    { key: "profundidade", file: "workflows/scene-composition.md" },
    { key: "rotobrush", file: "workflows/scene-composition.md" },
    { key: "duik", file: "workflows/character-animation-duik.md" },
    { key: "duik", file: "tools/duik-angela.md" },
    { key: "angela", file: "workflows/character-animation-duik.md" },
    { key: "angela", file: "tools/duik-angela.md" },
    { key: "rig", file: "workflows/character-animation-duik.md" },
    { key: "rig", file: "tools/duik-angela.md" },
    { key: "personagem", file: "workflows/character-animation-duik.md" },
    { key: "autosway", file: "workflows/autosway-secondary-motion.md" },
    { key: "autosway", file: "tools/autosway.md" },
    { key: "cabelo", file: "workflows/autosway-secondary-motion.md" },
    { key: "cabelo", file: "tools/autosway.md" },
    { key: "roupa", file: "workflows/autosway-secondary-motion.md" },
    { key: "roupa", file: "tools/autosway.md" },
    { key: "vento", file: "workflows/autosway-secondary-motion.md" },
    { key: "vento", file: "tools/autosway.md" },
    { key: "sway", file: "workflows/autosway-secondary-motion.md" },
    { key: "sway", file: "tools/autosway.md" },
    { key: "texto", file: "workflows/text-animation.md" },
    { key: "text", file: "workflows/text-animation.md" },
    { key: "flicker", file: "workflows/text-animation.md" },
    { key: "lyrics", file: "workflows/text-animation.md" },
    { key: "camera", file: "workflows/camera-movement.md" },
    { key: "pan", file: "workflows/camera-movement.md" },
    { key: "3d", file: "workflows/camera-movement.md" },
    { key: "glow", file: "workflows/glow-and-light.md" },
    { key: "luz", file: "workflows/glow-and-light.md" },
    { key: "saber", file: "workflows/glow-and-light.md" },
    { key: "light", file: "workflows/glow-and-light.md" },
    { key: "glitch", file: "workflows/glitch-effects.md" },
    { key: "aberration", file: "workflows/glitch-effects.md" },
    { key: "aberração", file: "workflows/glitch-effects.md" },
    { key: "noise", file: "workflows/glitch-effects.md" },
    { key: "transition", file: "workflows/transitions.md" },
    { key: "transição", file: "workflows/transitions.md" },
    { key: "transicao", file: "workflows/transitions.md" },
    { key: "rtfx", file: "tools/rtfx.md" },
    { key: "sapphire", file: "tools/sapphire.md" },
    { key: "trapcode", file: "tools/trapcode.md" },
    { key: "particular", file: "tools/trapcode.md" },
    { key: "native", file: "tools/native-after-effects.md" },
    { key: "nativo", file: "tools/native-after-effects.md" },
    { key: "expression", file: "troubleshooting/expressions.md" },
    { key: "expressao", file: "troubleshooting/expressions.md" },
    { key: "expressão", file: "troubleshooting/expressions.md" },
    { key: "footage", file: "troubleshooting/missing-footage.md" },
    { key: "missing", file: "troubleshooting/missing-footage.md" },
    { key: "ausente", file: "troubleshooting/missing-footage.md" },
    { key: "offline", file: "troubleshooting/missing-footage.md" },
    { key: "blur", file: "troubleshooting/motion-blur.md" },
    { key: "motion blur", file: "troubleshooting/motion-blur.md" },
    { key: "camera 3d", file: "troubleshooting/3d-camera.md" },
    { key: "camera", file: "troubleshooting/3d-camera.md" },
    { key: "preset", file: "troubleshooting/presets-not-working.md" },
    { key: "ffx", file: "troubleshooting/presets-not-working.md" },
    { key: "duik rig", file: "troubleshooting/duik-rig-not-working.md" },
    { key: "autosway nao funciona", "file": "troubleshooting/autosway-not-working.md" },
    { key: "autosway não funciona", "file": "troubleshooting/autosway-not-working.md" },
    { key: "render", file: "troubleshooting/render-preview-issues.md" },
    { key: "preview", file: "troubleshooting/render-preview-issues.md" },
    { key: "lento", file: "troubleshooting/render-preview-issues.md" },
    { key: "slow", file: "troubleshooting/render-preview-issues.md" },
    { key: "ram", file: "troubleshooting/render-preview-issues.md" }
];

const matchedFilesSet = new Set();
for (const map of knowledgeMappings) {
    if (lowerQuery.includes(map.key)) {
        matchedFilesSet.add(map.file);
    }
}

// Add default fallback knowledge file based on intent if none matched
if (matchedFilesSet.size === 0) {
    if (intent === "troubleshoot") {
        matchedFilesSet.add("troubleshooting/render-preview-issues.md");
    } else if (intent === "visual_review") {
        matchedFilesSet.add("workflows/scene-composition.md");
    } else {
        matchedFilesSet.add("tools/native-after-effects.md");
    }
}

if (intent === "visual_review") {
    const visualWorkflows = [
        "workflows/scene-composition.md",
        "workflows/color-correction.md",
        "workflows/mmv-impact.md",
        "workflows/camera-movement.md",
        "workflows/glow-and-light.md",
        "workflows/transitions.md"
    ];
    for (var w = 0; w < visualWorkflows.length; w++) {
        matchedFilesSet.add(visualWorkflows[w]);
    }
}

const relevantKnowledgeFiles = Array.from(matchedFilesSet).map(f => `knowledge/${f}`);

// 3. Recommended commands & files to send based on intent
let recommendedCommands = [];
let bestNextCommand = "";
let filesToSendToAI = [
    "data/local_inventory.json",
    "data/tool_groups.json",
    "data/effects_catalog.json"
];

// Add tool capabilities JSON
if (fs.existsSync(path.join(__dirname, '../data/tool_capabilities.json'))) {
    filesToSendToAI.push("data/tool_capabilities.json");
} else {
    filesToSendToAI.push("data/tool_capabilities.example.json");
}

let isProjectWide = false;
let isCompSpecific = false;
let targetedCompName = "";

const projectKeywords = ["projeto inteiro", "projeto todo", "todas as comps", "todas as composições", "quais comps", "comp principal", "main comp", "onde é usado", "onde o asset", "onde precomp", "dependencia", "dependência", "estrutura do projeto", "mapear projeto", "mapa do projeto", "project-wide", "summary", "mapa"];
if (projectKeywords.some(k => lowerQuery.includes(k))) {
    isProjectWide = true;
}

const compMatch = lowerQuery.match(/(?:comp|composição|composicao)\s+['"“]?([a-zA-Z0-9_\-\sáàâãéèêíïóôõöúçñ]{2,})['"”]?/i);
if (compMatch) {
    isCompSpecific = true;
    targetedCompName = compMatch[1].trim();
}

if (isProjectWide) {
    recommendedCommands = [
        "node node/cli.js export-project-summary",
        "node node/cli.js export-project-map",
        "node node/cli.js export-review-package"
    ];
    bestNextCommand = "node node/cli.js export-project-summary";
    filesToSendToAI.push("data/project_summary.json", "data/project_map.json");
    intent = "project_wide";
    confidence = "high";
    reason = "Detectado interesse em analisar a estrutura global ou dependências do projeto After Effects.";
} else if (isCompSpecific && targetedCompName) {
    const sanitizeFilename = (name) => name.replace(/[^a-zA-Z0-9_\-]/g, "_");
    recommendedCommands = [
        `node node/cli.js export-comp-by-name "${targetedCompName}"`,
        "node node/cli.js export-project-summary",
        "node node/cli.js export-review-package"
    ];
    bestNextCommand = `node node/cli.js export-comp-by-name "${targetedCompName}"`;
    filesToSendToAI.push(`data/comps/${sanitizeFilename(targetedCompName)}.json`);
    intent = "comp_specific";
    confidence = "high";
    reason = `Detectado interesse em uma composição específica: "${targetedCompName}".`;
} else if (intent === "troubleshoot") {
    recommendedCommands = [
        "node node/cli.js export-diagnostics",
        "node node/cli.js check-expression-errors",
        "node node/cli.js check-missing-footage",
        "node node/cli.js export-active-comp",
        "node node/cli.js export-review-package --run-checks"
    ];
    bestNextCommand = "node node/cli.js export-review-package --run-checks";
    filesToSendToAI.push("data/active_comp.json", "data/diagnostics.json", "data/expression_errors.json", "data/missing_footage.json");
} else if (intent === "visual_review") {
    recommendedCommands = [
        "node node/cli.js export-diagnostics",
        "node node/cli.js export-timeline-frames",
        "node node/cli.js export-visual-review-package --run-checks"
    ];
    bestNextCommand = "node node/cli.js export-visual-review-package --run-checks";
    
    try {
        const latestJsonPath = path.join(paths.dataDir, "visual_review_packages", "latest.json");
        if (fs.existsSync(latestJsonPath)) {
            const latest = JSON.parse(fs.readFileSync(latestJsonPath, 'utf8'));
            if (latest && latest.latestPackagePath) {
                filesToSendToAI.push(latest.latestPackagePath);
            }
        }
    } catch(e) {}
    filesToSendToAI.push("data/visual_review_packages/latest.json");
} else if (intent === "safe_edit_proposal") {
    recommendedCommands = [
        "node node/cli.js export-active-comp",
        "node node/cli.js export-selected-layers",
        "node node/cli.js export-review-package"
    ];
    bestNextCommand = "node node/cli.js export-review-package";
    filesToSendToAI.push("data/active_comp.json", "data/selected_layers.json");
} else {
    // how_to and plan_workflow
    recommendedCommands = [
        "node node/cli.js scan-inventory",
        "node node/cli.js check-config"
    ];
    bestNextCommand = "node node/cli.js scan-inventory";
}

// Heuristic override for deep property tree extraction
const deepKeywords = ["efeito", "glow", "curvas", "curva", "expressão", "expressao", "propriedade", "keyframes", "keyframe", "velocidade", "easing", "transição", "transicao"];
const hasDeepKeywords = deepKeywords.some(k => lowerQuery.includes(k));

if (hasDeepKeywords) {
    bestNextCommand = "node node/cli.js export-review-package --run-checks --deep";
    recommendedCommands.unshift("node node/cli.js export-active-comp-deep");
    recommendedCommands.unshift("node node/cli.js export-review-package --run-checks --deep");
    filesToSendToAI.push("data/active_comp_deep.json");
    reason += " (Sugere-se análise profunda via --deep/active_comp_deep.json devido a termos de efeitos/curvas/expressões)";
}

// Ensure unique files array
filesToSendToAI = Array.from(new Set(filesToSendToAI));

// 4. Output results
if (jsonMode) {
    const jsonOutput = {
        intent: intent,
        confidence: confidence,
        bestNextCommand: bestNextCommand,
        recommendedCommands: recommendedCommands,
        filesToSendToAI: filesToSendToAI,
        relevantKnowledgeFiles: relevantKnowledgeFiles,
        reason: reason
    };
    console.log(JSON.stringify(jsonOutput, null, 2));
} else {
    console.log(`=============================================================================
Conselheiro de Contexto - AE-mcp
=============================================================================
Pergunta: "${query}"
Intent Detectado: ${intent} (Confiança: ${confidence})
Motivo: ${reason}

Melhor Próximo Comando:
  -> ${bestNextCommand}

Outros Comandos Recomendados:
${recommendedCommands.map(cmd => `  * ${cmd}`).join('\n')}

Arquivos de Dados Recomendados para Enviar para a IA:
${filesToSendToAI.map(file => `  [ ] ${file}`).join('\n')}

Guias de Conhecimento Relevantes:
${relevantKnowledgeFiles.map(file => `  [ ] ${file}`).join('\n')}
=============================================================================`);
}
