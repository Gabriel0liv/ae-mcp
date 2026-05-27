const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const paths = require('./paths');
const runAeScript = require('./run-ae-script');

// Generate YYYY-MM-DD_HH-MM-SS timestamp
const now = new Date();
const timestamp = now.getFullYear() + '-' +
    ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
    ('0' + now.getDate()).slice(-2) + '_' +
    ('0' + now.getHours()).slice(-2) + '-' +
    ('0' + now.getMinutes()).slice(-2) + '-' +
    ('0' + now.getSeconds()).slice(-2);

const previewDir = path.join(paths.dataDir, 'visual_previews', timestamp);

function writeContext(status, details) {
    if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir, { recursive: true });
    }
    const contextPath = path.join(previewDir, 'preview_context.json');
    const payload = {
        createdAt: now.toISOString(),
        status: status,
        visualContextType: "preview",
        ...details
    };
    fs.writeFileSync(contextPath, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`[Preview] Contexto do preview salvo em: ${contextPath}`);
}

function runPrepScriptSync() {
    const prepScript = paths.resolveScriptPath('utils/render_prep.jsx');
    const prepJsonPath = path.join(paths.dataDir, 'render_prep.json');
    if (fs.existsSync(prepJsonPath)) {
        try { fs.unlinkSync(prepJsonPath); } catch(e) {}
    }
    
    let done = false;
    runAeScript(prepScript, (err) => {
        if (err) {
            done = true;
        }
    });
    
    // Poll synchronously for up to 15 seconds
    const start = Date.now();
    const timeout = 15000;
    while (Date.now() - start < timeout) {
        if (fs.existsSync(prepJsonPath)) {
            try {
                return JSON.parse(fs.readFileSync(prepJsonPath, 'utf8'));
            } catch(e) {
                // Wait for file writing completion
            }
        }
        const sleepStart = Date.now();
        while (Date.now() - sleepStart < 200) {}
    }
    return null;
}

function main() {
    console.log(`\n=============================================================================`);
    console.log(`[Preview] Iniciando geração de preview de vídeo...`);
    console.log(`=============================================================================`);
    
    // 1. Check configuration
    const renderConfig = paths.config.render || {};
    const aerenderPath = renderConfig.aerenderPath;
    const previewDurationSeconds = renderConfig.previewDurationSeconds || 8;
    const outputFormat = renderConfig.outputFormat || 'mp4';
    
    if (!aerenderPath) {
        console.error("[Erro] aerenderPath não está configurado em config.json.");
        writeContext("aerender_not_configured", {
            error: "aerenderPath is not defined in config.json.",
            suggestedFix: "Add 'render.aerenderPath' to your config.json."
        });
        process.exit(1);
    }
    
    if (!fs.existsSync(aerenderPath)) {
        console.error(`[Erro] Executável do aerender não encontrado em: ${aerenderPath}`);
        writeContext("aerender_not_configured", {
            error: `aerender.exe was not found at configured path: ${aerenderPath}`,
            suggestedFix: "Check aerenderPath path in config.json."
        });
        process.exit(1);
    }
    
    // 2. Fetch AE comp parameters
    const prepData = runPrepScriptSync();
    if (!prepData) {
        console.error("[Erro] Tempo limite excedido aguardando informações do After Effects.");
        writeContext("no_communication", {
            error: "Failed to communicate with After Effects to gather composition parameters."
        });
        process.exit(1);
    }
    
    if (!prepData.compName) {
        console.error("[Erro] Nenhuma composição ativa selecionada no After Effects.");
        writeContext("no_active_comp", {
            error: "No active composition found.",
            suggestedFix: "Open or select a composition in After Effects before rendering a preview."
        });
        process.exit(1);
    }
    
    if (!prepData.projectPath) {
        console.error("[Erro] O projeto atual do After Effects não está salvo.");
        console.warn("[Aviso] aerender requer que o projeto esteja salvo no disco para renderizar.");
        writeContext("project_not_saved", {
            compName: prepData.compName,
            error: "After Effects project is not saved on disk.",
            suggestedFix: "Save your project file (.aep) before running render-preview."
        });
        process.exit(1);
    }
    
    // Create preview folder
    if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir, { recursive: true });
    }
    
    // Calculate render ranges
    const frameRate = prepData.frameRate || 24;
    const startFrame = Math.floor(prepData.workAreaStart * frameRate);
    const endFrame = Math.floor((prepData.workAreaStart + Math.min(prepData.workAreaDuration, previewDurationSeconds)) * frameRate);
    const durationRendered = (endFrame - startFrame) / frameRate;
    
    const outputFileName = `preview_lowres.${outputFormat}`;
    const outputPath = path.join(previewDir, outputFileName);
    
    console.log(`[Preview] Composição: ${prepData.compName}`);
    console.log(`[Preview] Projeto: ${prepData.projectPath}`);
    console.log(`[Preview] Intervalo de Frames: ${startFrame} até ${endFrame} (Duração: ${durationRendered.toFixed(2)}s @ ${frameRate}fps)`);
    console.log(`[Preview] Destino: ${outputPath}`);
    console.log(`[Preview] Executando aerender...`);
    
    const args = [
        '-project', prepData.projectPath,
        '-comp', prepData.compName,
        '-output', outputPath,
        '-s', startFrame.toString(),
        '-e', endFrame.toString()
    ];
    
    // Add render settings template if configured (e.g. 'Draft Settings' or localized name)
    if (renderConfig.renderSettingsTemplate) {
        args.push('-RStemplate', renderConfig.renderSettingsTemplate);
    }
    
    // Determine Output Module Template: use config value, or default to 'H.264' for mp4 format
    const omTemplate = renderConfig.outputModuleTemplate || (outputFormat.toLowerCase() === 'mp4' ? 'H.264' : null);
    if (omTemplate) {
        args.push('-OMtemplate', omTemplate);
    }
    
    const child = spawn(aerenderPath, args);
    let outputLog = "";
    
    child.stdout.on('data', (data) => {
        const str = data.toString();
        outputLog += str;
        process.stdout.write(str);
    });
    
    child.stderr.on('data', (data) => {
        const str = data.toString();
        outputLog += str;
        process.stderr.write(str);
    });
    
    child.on('close', (code) => {
        console.log(`\n=============================================================================`);
        if (code === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
            console.log(`[Preview] Geração concluída com SUCESSO!`);
            writeContext("preview_available", {
                projectName: prepData.projectName,
                projectPath: prepData.projectPath,
                compName: prepData.compName,
                outputPath: outputPath,
                startFrame: startFrame,
                endFrame: endFrame,
                durationRendered: durationRendered,
                frameRate: frameRate
            });
            process.exit(0);
        } else {
            console.error(`[Erro] Falha na renderização do aerender. Código de saída: ${code}`);
            writeContext("render_failed", {
                projectName: prepData.projectName,
                projectPath: prepData.projectPath,
                compName: prepData.compName,
                exitCode: code,
                error: "aerender failed to output valid media file.",
                aerenderLog: outputLog
            });
            process.exit(1);
        }
    });
}

main();
