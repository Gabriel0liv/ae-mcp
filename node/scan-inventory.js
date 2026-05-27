const fs = require('fs');
const path = require('path');
const paths = require('./paths');

const IGNORED_KEYWORDS = [/license/i, /licence/i, /serial/i, /keygen/i, /crack/i, /activation/i, /token/i, /password/i];
const RELEVANT_EXTENSIONS = ['.aex', '.plugin', '.jsx', '.jsxbin', '.jsxinc', '.ffx', '.zxp', '.md', '.txt', '.pdf', '.html', '.json'];

// Helper to expand environment variables like %USERNAME% or %APPDATA%
function expandEnvVars(pathStr) {
    return pathStr.replace(/%([^%]+)%/g, (_, name) => {
        return process.env[name] || `%${name}%`;
    });
}

// Guesses a vendor based on the file path keywords
function guessVendor(fullPath) {
    const lowerPath = fullPath.toLowerCase();
    if (lowerPath.includes('redgiant') || lowerPath.includes('red giant')) return 'Red Giant';
    if (lowerPath.includes('videocopilot') || lowerPath.includes('video copilot')) return 'Video Copilot';
    if (lowerPath.includes('rainbox') || lowerPath.includes('duik')) return 'Rainbox Laboratory';
    if (lowerPath.includes('misterhorse') || lowerPath.includes('mister horse')) return 'Mister Horse';
    if (lowerPath.includes('rowbyte')) return 'Rowbyte';
    if (lowerPath.includes('cvalley') || lowerPath.includes('autosway')) return 'cvalley';
    if (lowerPath.includes('aescripts')) return 'aescripts + aeplugins';
    if (lowerPath.includes('rtfx')) return 'RTFX';
    return 'Desconhecido';
}

const inventory = [];

// Recursive scanning for files
function scanDirRecursive(currentPath, baseCategory, inventoryList) {
    let stats;
    try {
        stats = fs.statSync(currentPath);
    } catch (e) {
        return; // Ignore unreadable files
    }

    if (stats.isDirectory()) {
        let files;
        try {
            files = fs.readdirSync(currentPath);
        } catch (e) {
            console.warn(`[Aviso] Falha ao ler pasta: ${currentPath} (${e.message})`);
            return;
        }

        for (const file of files) {
            scanDirRecursive(path.join(currentPath, file), baseCategory, inventoryList);
        }
    } else if (stats.isFile()) {
        const ext = path.extname(currentPath).toLowerCase();
        const fileName = path.basename(currentPath);

        // Security check: Ignore keys, licensing, piracy, crack, etc.
        const isIgnored = IGNORED_KEYWORDS.some(regex => regex.test(fileName));
        if (isIgnored) {
            return;
        }

        // Limit to relevant file types
        if (!RELEVANT_EXTENSIONS.includes(ext)) {
            return;
        }

        let category = baseCategory;
        if (baseCategory === 'script') {
            if (currentPath.toLowerCase().includes('scriptui panels')) {
                category = 'scriptui_panel';
            }
        }

        let guessedToolName = path.basename(fileName, ext);
        guessedToolName = guessedToolName.replace(/[_-]/g, ' ');

        inventoryList.push({
            name: fileName,
            path: currentPath,
            extension: ext,
            sizeBytes: stats.size,
            modifiedAt: stats.mtime.toISOString(),
            category: category,
            guessedToolName: guessedToolName,
            possibleVendor: guessVendor(currentPath)
        });
    }
}

// Start Main Scan
const inventoryConfig = paths.config.inventory || {};

const targetDirs = [
    { key: 'pluginDirs', category: 'plugin_binary' },
    { key: 'scriptDirs', category: 'script' },
    { key: 'presetDirs', category: 'preset' },
    { key: 'extensionDirs', category: 'cep_extension' },
    { key: 'docDirs', category: 'doc' }
];

for (const target of targetDirs) {
    const dirsList = inventoryConfig[target.key];
    if (!dirsList || !Array.isArray(dirsList)) continue;

    for (const rawDir of dirsList) {
        const expandedDir = expandEnvVars(rawDir);
        
        // Resolve path relative to project root or use absolute path
        const resolvedDir = path.isAbsolute(expandedDir) 
            ? expandedDir 
            : path.resolve(paths.projectBasePath, expandedDir);

        if (!fs.existsSync(resolvedDir)) {
            console.warn(`[Aviso] Diretório de inventário configurado não existe: ${resolvedDir} (Config: ${target.key})`);
            continue;
        }

        console.log(`[Inventário] Escaneando '${target.key}' em: ${resolvedDir}`);

        if (target.category === 'cep_extension') {
            // For CEP Extensions, list immediate subfolders and any .zxp packages directly
            try {
                const items = fs.readdirSync(resolvedDir);
                for (const item of items) {
                    const itemPath = path.join(resolvedDir, item);
                    const stats = fs.statSync(itemPath);

                    if (stats.isDirectory()) {
                        const isIgnored = IGNORED_KEYWORDS.some(regex => regex.test(item));
                        if (isIgnored) continue;

                        inventory.push({
                            name: item,
                            path: itemPath,
                            extension: '.dir',
                            sizeBytes: 0,
                            modifiedAt: stats.mtime.toISOString(),
                            category: 'cep_extension',
                            guessedToolName: item.replace(/[_-]/g, ' '),
                            possibleVendor: guessVendor(itemPath)
                        });
                    } else if (stats.isFile()) {
                        const ext = path.extname(item).toLowerCase();
                        if (ext === '.zxp') {
                            const isIgnored = IGNORED_KEYWORDS.some(regex => regex.test(item));
                            if (isIgnored) continue;

                            inventory.push({
                                name: item,
                                path: itemPath,
                                extension: ext,
                                sizeBytes: stats.size,
                                modifiedAt: stats.mtime.toISOString(),
                                category: 'cep_extension',
                                guessedToolName: path.basename(item, ext).replace(/[_-]/g, ' '),
                                possibleVendor: guessVendor(itemPath)
                            });
                        }
                    }
                }
            } catch (err) {
                console.warn(`[Aviso] Falha ao varrer pasta CEP: ${resolvedDir} (${err.message})`);
            }
        } else {
            // General recursive files sweep
            scanDirRecursive(resolvedDir, target.category, inventory);
        }
    }
}

// Write the local inventory JSON output
const outputPath = path.join(paths.dataDir, 'local_inventory.json');
try {
    fs.writeFileSync(outputPath, JSON.stringify(inventory, null, 2), 'utf8');
    console.log(`\n[Inventário] Concluído! Catalogados ${inventory.length} itens.`);
    console.log(`Inventário salvo em: ${outputPath}`);
} catch (err) {
    console.error(`[Erro] Falha ao escrever inventário local: ${err.message}`);
    process.exit(1);
}
