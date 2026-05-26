const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const paths = require('./paths');

/**
 * Executes a JSX script inside After Effects using child_process.spawn
 * @param {string} scriptPath Absolute path to the JSX script
 * @param {function} callback Optional completion callback
 */
function runAeScript(scriptPath, callback) {
    // Validate AE executable existence
    if (!fs.existsSync(paths.afterEffectsPath)) {
        console.error(`
=============================================================================
[ERRO] Executável do After Effects não encontrado!
Caminho configurado: ${paths.afterEffectsPath}

Verifique se o caminho no seu 'config.json' está correto.
=============================================================================
`);
        if (callback) callback(new Error('After Effects executable not found'));
        return;
    }

    // Validate Script existence
    if (!fs.existsSync(scriptPath)) {
        console.error(`
=============================================================================
[ERRO] Script ExtendScript (.jsx) não encontrado!
Caminho: ${scriptPath}
=============================================================================
`);
        if (callback) callback(new Error('Script JSX not found'));
        return;
    }

    console.log(`\n[Executando] Iniciando script no After Effects...`);
    console.log(`Script: ${path.basename(scriptPath)}`);
    
    try {
        // Rule 10: Use spawn instead of exec
        // On Windows, running AfterFX.exe will target the running instance or launch a new one.
        // We use detached: true and unref() because AE is a persistent GUI app.
        const aeProcess = spawn(paths.afterEffectsPath, ['-r', scriptPath], {
            detached: true,
            stdio: 'ignore'
        });
        
        aeProcess.unref();
        
        console.log(`[Ponte] Comando enviado com sucesso para o After Effects.`);
        console.log(`Acompanhe o status no arquivo de log: ${path.join(paths.logDir, 'ae_bridge.log')}`);
        
        if (callback) callback(null);
    } catch (err) {
        console.error(`[ERRO] Falha ao iniciar processo do After Effects: ${err.message}`);
        if (callback) callback(err);
    }
}

module.exports = runAeScript;
