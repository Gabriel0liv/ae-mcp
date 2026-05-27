const fs = require('fs');
const path = require('path');
const paths = require('./paths');

const SENSITIVE_KEYWORDS = [
    'license', 'licence', 'serial', 'keygen', 'crack',
    'activation', 'token', 'password', 'auth', 'credential', 'credentials'
];

const RELEVANT_EXTENSIONS = [
    '.aex', '.plugin', '.jsx', '.jsxbin', '.jsxinc',
    '.ffx', '.zxp', '.md', '.txt', '.pdf', '.html', '.json'
];

const KNOWN_TOOLS = [
    'duik', 'autosway', 'rtfx', 'red giant', 'redgiant', 'sapphire', 'bcc',
    'mister horse', 'misterhorse', 'boris', 'trapcode', 'universe', 'magic bullet',
    'element 3d', 'optical flares', 'saber', 'plexus', 'rowbyte', 'overlord'
];

// Helper to expand environment variables
function expandEnvVars(pathStr) {
    return pathStr.replace(/%([^%]+)%/g, (_, name) => {
        return process.env[name] || `%${name}%`;
    });
}

// Check if a file/folder name contains sensitive licensing keywords
function isSensitive(name) {
    const lower = name.toLowerCase();
    return SENSITIVE_KEYWORDS.some(kw => lower.includes(kw));
}

// Evolved vendor guesser
function guessVendor(nameOrPath) {
    const lower = nameOrPath.toLowerCase();
    if (lower.includes('duik') || lower.includes('rainbox')) return 'Rainbox Laboratory';
    if (lower.includes('autosway') || lower.includes('cvalley')) return 'cvalley';
    if (lower.includes('rtfx')) return 'RTFX';
    if (lower.includes('redgiant') || lower.includes('red giant') || lower.includes('universe') || lower.includes('trapcode') || lower.includes('magic bullet') || lower.includes('magicbullet')) return 'Red Giant / Maxon';
    if (lower.includes('maxon')) return 'Maxon';
    if (lower.includes('video copilot') || lower.includes('videocopilot') || lower.includes('element 3d') || lower.includes('element3d') || lower.includes('optical flares') || lower.includes('opticalflares') || lower.includes('saber')) return 'Video Copilot';
    if (lower.includes('aescripts')) return 'aescripts + aeplugins';
    if (lower.includes('mister horse') || lower.includes('misterhorse')) return 'Mister Horse';
    if (lower.includes('boris') || lower.includes('bcc') || lower.includes('sapphire') || lower.includes('mocha')) return 'Boris FX';
    if (lower.includes('rowbyte') || lower.includes('plexus')) return 'Rowbyte';
    if (lower.includes('dataclay')) return 'Dataclay';
    if (lower.includes('battleaxe') || lower.includes('overlord')) return 'Battle Axe';
    return 'Desconhecido';
}

// Calculate topLevelToolFolder relative to sourceRoot
function getTopLevelToolFolder(filePath, sourceRoot) {
    const relative = path.relative(sourceRoot, filePath);
    const parts = relative.split(path.sep);
    if (parts.length > 1) {
        return parts[0];
    }
    return null;
}

const inventory = [];
const fileDedupeSet = new Set();
const directoryMap = {};

// Evolved file classification logic by extension and context
function classifyFile(filePath, ext) {
    const lowerPath = filePath.toLowerCase();
    
    // Check path context first
    if (lowerPath.includes('scriptui panels')) {
        if (ext === '.jsx' || ext === '.jsxbin') return 'scriptui_panel';
    }
    
    if (lowerPath.includes('cep\\extensions') || lowerPath.includes('cep/extensions')) {
        if (ext === '.zxp') return 'cep_extension_package';
    }
    
    // Classify by extension rules
    switch (ext) {
        case '.aex':
        case '.plugin':
            return 'plugin_binary';
        case '.jsx':
            return 'script';
        case '.jsxbin':
            return 'script_compiled';
        case '.jsxinc':
            return 'script_include';
        case '.ffx':
            return 'preset';
        case '.zxp':
            return 'cep_extension_package';
        case '.md':
        case '.txt':
        case '.pdf':
        case '.html':
            return 'doc';
        case '.json':
            return 'metadata_or_doc';
        default:
            return 'unknown';
    }
}

// Recursive directory scan
function scanDirRecursive(currentPath, sourceConfigKey, sourceRoot) {
    let stats;
    try {
        stats = fs.statSync(currentPath);
    } catch (e) {
        return; // Skip inaccessible files
    }

    if (stats.isDirectory()) {
        const dirName = path.basename(currentPath);
        
        // Safety: If directory name is sensitive, ignore it and do not recurse
        if (isSensitive(dirName)) {
            console.log(`[Segurança] Ignorando pasta sensível: ${currentPath}`);
            return;
        }

        let files;
        try {
            files = fs.readdirSync(currentPath);
        } catch (e) {
            console.warn(`[Aviso] Falha ao ler pasta: ${currentPath} (${e.message})`);
            return;
        }

        for (const file of files) {
            scanDirRecursive(path.join(currentPath, file), sourceConfigKey, sourceRoot);
        }
    } else if (stats.isFile()) {
        const fileName = path.basename(currentPath);
        const ext = path.extname(currentPath).toLowerCase();

        // Safety: Ignore file names matching sensitive keywords
        if (isSensitive(fileName)) {
            return;
        }

        // Limit to relevant file extensions
        if (!RELEVANT_EXTENSIONS.includes(ext)) {
            return;
        }

        // Deduplicate file checks (Windows is case-insensitive, normalize paths)
        const normalizedPath = path.resolve(currentPath);
        const dedupeKey = normalizedPath.toLowerCase();
        if (fileDedupeSet.has(dedupeKey)) {
            return; // Already scanned
        }
        fileDedupeSet.add(dedupeKey);

        // Classification
        const category = classifyFile(currentPath, ext);

        // Guessed vendor and tool name
        let guessedToolName = path.basename(fileName, ext);
        guessedToolName = guessedToolName.replace(/[_-]/g, ' ');
        const possibleVendor = guessVendor(currentPath);

        // Context flags
        const lowerPath = currentPath.toLowerCase();
        const isInPluginFolder = sourceConfigKey === 'pluginDirs' || lowerPath.includes('\\plug-ins\\') || lowerPath.includes('/plug-ins/');
        const isInScriptFolder = sourceConfigKey === 'scriptDirs' || lowerPath.includes('\\scripts\\') || lowerPath.includes('/scripts/');
        const isInPresetFolder = sourceConfigKey === 'presetDirs' || lowerPath.includes('\\presets\\') || lowerPath.includes('/presets/');
        const isInExtensionFolder = sourceConfigKey === 'extensionDirs' || lowerPath.includes('\\cep\\') || lowerPath.includes('/cep/');
        const isInMixedContentFolder = sourceConfigKey === 'mixedContentDirs';

        const isLikelyPanel = category === 'scriptui_panel' || lowerPath.includes('scriptui panels') || guessedToolName.toLowerCase().includes('panel');
        const isLikelyPreset = category === 'preset' || ext === '.ffx';
        const isLikelyPlugin = category === 'plugin_binary' || ext === '.aex' || ext === '.plugin';
        const isLikelyScript = ['script', 'script_compiled', 'script_include', 'scriptui_panel'].includes(category);

        const parentFolderName = path.basename(path.dirname(currentPath));
        const topLevelToolFolder = getTopLevelToolFolder(currentPath, sourceRoot);

        // Rule 6: Strictly metadata-only (no content reading)
        const fileItem = {
            name: fileName,
            path: currentPath,
            extension: ext,
            sizeBytes: stats.size,
            modifiedAt: stats.mtime.toISOString(),
            category: category,
            guessedToolName: guessedToolName,
            possibleVendor: possibleVendor,
            sourceRoot: sourceRoot,
            sourceConfigKey: sourceConfigKey,
            isInPluginFolder: isInPluginFolder,
            isInScriptFolder: isInScriptFolder,
            isInPresetFolder: isInPresetFolder,
            isInExtensionFolder: isInExtensionFolder,
            isInMixedContentFolder: isInMixedContentFolder,
            isLikelyPanel: isLikelyPanel,
            isLikelyPreset: isLikelyPreset,
            isLikelyPlugin: isLikelyPlugin,
            isLikelyScript: isLikelyScript,
            parentFolderName: parentFolderName,
            topLevelToolFolder: topLevelToolFolder
        };

        inventory.push(fileItem);

        // Track directory for tool grouping
        const parentDir = path.dirname(currentPath);
        const dirKey = path.resolve(parentDir).toLowerCase();
        if (!directoryMap[dirKey]) {
            directoryMap[dirKey] = {
                dirPath: parentDir,
                dirName: parentFolderName,
                sourceRoot: sourceRoot,
                sourceConfigKey: sourceConfigKey,
                files: []
            };
        }
        directoryMap[dirKey].files.push(fileItem);
    }
}

// Start scanning
const inventoryConfig = paths.config.inventory || {};

const targetDirs = [
    { key: 'pluginDirs', category: 'plugin_binary' },
    { key: 'scriptDirs', category: 'script' },
    { key: 'presetDirs', category: 'preset' },
    { key: 'extensionDirs', category: 'cep_extension' },
    { key: 'mixedContentDirs', category: 'mixed_content' },
    { key: 'docDirs', category: 'doc' }
];

for (const target of targetDirs) {
    const dirsList = inventoryConfig[target.key];
    if (!dirsList || !Array.isArray(dirsList)) continue;

    for (const rawDir of dirsList) {
        const expandedDir = expandEnvVars(rawDir);
        const resolvedDir = path.isAbsolute(expandedDir)
            ? expandedDir
            : path.resolve(paths.projectBasePath, expandedDir);

        if (!fs.existsSync(resolvedDir)) {
            console.warn(`[Aviso] Diretório de inventário configurado não existe: ${resolvedDir} (Config: ${target.key})`);
            continue;
        }

        console.log(`[Inventário] Escaneando '${target.key}' em: ${resolvedDir}`);

        if (target.key === 'extensionDirs') {
            // For CEP Extensions, record subdirectories and packages directly
            try {
                const items = fs.readdirSync(resolvedDir);
                for (const item of items) {
                    const itemPath = path.join(resolvedDir, item);
                    
                    const isDirSensitive = isSensitive(item);
                    if (isDirSensitive) {
                        console.log(`[Segurança] Ignorando pasta CEP sensível: ${itemPath}`);
                        continue;
                    }
                    
                    const stats = fs.statSync(itemPath);

                    if (stats.isDirectory()) {
                        const normalizedPath = path.resolve(itemPath);
                        const dedupeKey = normalizedPath.toLowerCase();
                        if (fileDedupeSet.has(dedupeKey)) continue;
                        fileDedupeSet.add(dedupeKey);

                        inventory.push({
                            name: item,
                            path: itemPath,
                            extension: '.dir',
                            sizeBytes: 0,
                            modifiedAt: stats.mtime.toISOString(),
                            category: 'cep_extension',
                            guessedToolName: item.replace(/[_-]/g, ' '),
                            possibleVendor: guessVendor(itemPath),
                            sourceRoot: resolvedDir,
                            sourceConfigKey: 'extensionDirs',
                            isInPluginFolder: false,
                            isInScriptFolder: false,
                            isInPresetFolder: false,
                            isInExtensionFolder: true,
                            isInMixedContentFolder: false,
                            isLikelyPanel: true,
                            isLikelyPreset: false,
                            isLikelyPlugin: false,
                            isLikelyScript: false,
                            parentFolderName: path.basename(resolvedDir),
                            topLevelToolFolder: item
                        });
                    } else if (stats.isFile() && path.extname(item).toLowerCase() === '.zxp') {
                        const normalizedPath = path.resolve(itemPath);
                        const dedupeKey = normalizedPath.toLowerCase();
                        if (fileDedupeSet.has(dedupeKey)) continue;
                        fileDedupeSet.add(dedupeKey);

                        inventory.push({
                            name: item,
                            path: itemPath,
                            extension: '.zxp',
                            sizeBytes: stats.size,
                            modifiedAt: stats.mtime.toISOString(),
                            category: 'cep_extension_package',
                            guessedToolName: path.basename(item, '.zxp').replace(/[_-]/g, ' '),
                            possibleVendor: guessVendor(itemPath),
                            sourceRoot: resolvedDir,
                            sourceConfigKey: 'extensionDirs',
                            isInPluginFolder: false,
                            isInScriptFolder: false,
                            isInPresetFolder: false,
                            isInExtensionFolder: true,
                            isInMixedContentFolder: false,
                            isLikelyPanel: true,
                            isLikelyPreset: false,
                            isLikelyPlugin: false,
                            isLikelyScript: false,
                            parentFolderName: path.basename(resolvedDir),
                            topLevelToolFolder: null
                        });
                    }
                }
            } catch (err) {
                console.warn(`[Aviso] Falha ao escanear pasta CEP: ${resolvedDir} (${err.message})`);
            }
        } else {
            // General scanning (deduped recursively)
            scanDirRecursive(resolvedDir, target.key, resolvedDir);
        }
    }
}

// Compile Tool Groups (directory grouping)
const toolGroups = [];
const groupDedupeSet = new Set();

for (const dirKey in directoryMap) {
    if (!directoryMap.hasOwnProperty(dirKey)) continue;

    const group = directoryMap[dirKey];
    
    // Group Deduplication check
    const normalizedGroupPath = path.resolve(group.dirPath);
    const groupDedupeKey = normalizedGroupPath.toLowerCase();
    if (groupDedupeSet.has(groupDedupeKey)) {
        continue;
    }
    
    const fileCount = group.files.length;
    if (fileCount === 0) continue;

    const extSet = new Set();
    const typeSet = new Set();
    
    let containsScripts = false;
    let containsPresets = false;
    let containsPlugins = false;
    let containsPanels = false;
    let containsDocs = false;

    for (const f of group.files) {
        extSet.add(f.extension);
        typeSet.add(f.category);
        
        if (f.isLikelyScript) containsScripts = true;
        if (f.isLikelyPreset) containsPresets = true;
        if (f.isLikelyPlugin) containsPlugins = true;
        if (f.isLikelyPanel) containsPanels = true;
        if (f.category === 'doc') containsDocs = true;
    }

    // Check mixture of types
    const typesList = [containsScripts, containsPresets, containsPlugins, containsPanels, containsDocs];
    const typeDiversityCount = typesList.filter(Boolean).length;
    const isMixedType = typeDiversityCount >= 2;

    // Check known tools keywords
    const dirNameLower = group.dirName.toLowerCase();
    const isKnownTool = KNOWN_TOOLS.some(tool => dirNameLower.includes(tool));

    // Refinement 2: Grouping filter criteria
    // A group is registered if:
    // - it has 2 or more files
    // - OR its name matches a known tool keyword
    // - OR it contains a mixture of types
    const shouldGroup = fileCount >= 2 || isKnownTool || isMixedType;
    if (!shouldGroup) {
        continue;
    }

    groupDedupeSet.add(groupDedupeKey);

    // Categorize tool package
    let category = 'tool_package';
    if (group.sourceConfigKey === 'extensionDirs') {
        category = 'cep_extension';
    } else if (isMixedType) {
        category = 'mixed_tool_package';
    } else if (containsPresets && !containsScripts && !containsPlugins) {
        category = 'preset_pack';
    } else if (containsScripts && !containsPresets && !containsPlugins) {
        category = 'script_package';
    } else if (containsPlugins && !containsPresets && !containsScripts) {
        category = 'plugin_package';
    }

    // Set confidence level and reason
    let confidence = 'low';
    let reason = `Folder contains ${fileCount} files of type ${Array.from(typeSet).join(', ')}.`;
    
    if (isKnownTool) {
        confidence = 'high';
        reason = `Folder name matches known tool keyword and contains relevant contents.`;
    } else if (isMixedType) {
        confidence = 'medium';
        reason = `Folder contains a mixture of content types (${typeDiversityCount} different types).`;
    } else if (fileCount >= 2) {
        confidence = 'medium';
        reason = `Folder contains multiple (${fileCount}) files of the same category.`;
    }

    toolGroups.push({
        name: group.dirName,
        rootPath: group.dirPath,
        category: category,
        detectedTypes: Array.from(typeSet),
        fileCount: fileCount,
        extensions: Array.from(extSet),
        possibleVendor: guessVendor(group.dirPath),
        containsScripts: containsScripts,
        containsPresets: containsPresets,
        containsPlugins: containsPlugins,
        containsPanels: containsPanels,
        recommendedInventoryUse: 'recommendation_context',
        confidence: confidence,
        reason: reason
    });
}

// Write the output files
const localInventoryPath = path.join(paths.dataDir, 'local_inventory.json');
const toolGroupsPath = path.join(paths.dataDir, 'tool_groups.json');

try {
    fs.writeFileSync(localInventoryPath, JSON.stringify(inventory, null, 2), 'utf8');
    console.log(`\n[Inventário] Salvo ${inventory.length} itens em: ${localInventoryPath}`);
    
    fs.writeFileSync(toolGroupsPath, JSON.stringify(toolGroups, null, 2), 'utf8');
    console.log(`[Inventário] Salvo ${toolGroups.length} grupos de ferramentas em: ${toolGroupsPath}`);
} catch (err) {
    console.error(`[Erro] Falha ao escrever arquivos do inventário: ${err.message}`);
    process.exit(1);
}
