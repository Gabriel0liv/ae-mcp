const fs = require('fs');
const path = require('path');
const paths = require('./paths');

const SENSITIVE_KEYWORDS = [
    'license', 'licence', 'serial', 'keygen', 'crack',
    'activation', 'token', 'password', 'credential', 'credentials'
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

// Rule 6: Check for sensitive keywords (handles 'auth' while bypassing 'author', 'authoring', etc.)
function isSensitive(name) {
    const lower = name.toLowerCase();
    
    // Check general terms
    const hasGeneralTerm = SENSITIVE_KEYWORDS.some(kw => lower.includes(kw));
    if (hasGeneralTerm) return true;
    
    // Evolved check for 'auth' to avoid false positives in author, authoring, authority, authorization, authorized
    if (lower.includes('auth')) {
        const cleaned = lower
            .replace(/authority/g, '')
            .replace(/authorization/g, '')
            .replace(/authorized/g, '')
            .replace(/authoring/g, '')
            .replace(/author/g, '');
        if (cleaned.includes('auth')) {
            return true;
        }
    }
    
    return false;
}

// Normalizes path by expanding environment variables, resolving, stripping trailing slashes, and lowercasing on Windows
function normalizePath(p) {
    if (!p) return '';
    const expanded = p.replace(/%([^%]+)%/g, (_, name) => process.env[name] || `%${name}%`);
    let resolved = path.isAbsolute(expanded)
        ? path.resolve(expanded)
        : path.resolve(paths.projectBasePath || process.cwd(), expanded);
        
    if (resolved.length > 3 && (resolved.endsWith('\\') || resolved.endsWith('/'))) {
        resolved = resolved.slice(0, -1);
    }
    if (process.platform === 'win32') {
        resolved = resolved.toLowerCase();
    }
    return resolved;
}

// Rule 4: Check if a target path is inside a root path using path.relative to prevent prefix false positives
function isInsidePath(targetPath, rootPath) {
    const normalizedTarget = normalizePath(targetPath);
    const normalizedRoot = normalizePath(rootPath);

    if (normalizedTarget === normalizedRoot) {
        return true;
    }

    const relative = path.relative(normalizedRoot, normalizedTarget);

    return relative &&
        !relative.startsWith('..') &&
        !path.isAbsolute(relative);
}

// Rule 4: Evolved isPathInsideAny() helper using isInsidePath
function isPathInsideAny(targetPath, dirsList) {
    if (!dirsList || !Array.isArray(dirsList)) return false;
    return dirsList.some(rawDir => isInsidePath(targetPath, rawDir));
}

// Guess tool vendor based on filename or parent folders
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

// Rule 3: Calculate topLevelToolFolder relative to sourceRoot
// Returns null if file is directly located in sourceRoot
function getTopLevelToolFolder(filePath, sourceRoot) {
    const relative = path.relative(sourceRoot, filePath);
    const parts = relative.split(path.sep);
    if (parts.length > 1 && parts[0] !== '') {
        return parts[0]; // Returns first folder name relative to root
    }
    return null; // Directly inside root
}

const inventory = [];
const fileDedupeSet = new Set();
const directoryMap = {};

// Evolved file classification logic
function classifyFile(filePath, ext) {
    const lowerPath = filePath.toLowerCase();
    
    if (lowerPath.includes('scriptui panels')) {
        if (ext === '.jsx' || ext === '.jsxbin') return 'scriptui_panel';
    }
    
    if (lowerPath.includes('cep\\extensions') || lowerPath.includes('cep/extensions')) {
        if (ext === '.zxp') return 'cep_extension_package';
    }
    
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
function scanDirRecursive(currentPath, sourceConfigKey, sourceRoot, inventoryConfig) {
    let stats;
    try {
        stats = fs.statSync(currentPath);
    } catch (e) {
        return; // Skip inaccessible items
    }

    if (stats.isDirectory()) {
        const dirName = path.basename(currentPath);
        
        // Safety check: Completely ignore sensitive directories
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
            scanDirRecursive(path.join(currentPath, file), sourceConfigKey, sourceRoot, inventoryConfig);
        }
    } else if (stats.isFile()) {
        const fileName = path.basename(currentPath);
        const ext = path.extname(currentPath).toLowerCase();

        // Safety check: Ignore sensitive filenames
        if (isSensitive(fileName)) {
            return;
        }

        // Check if extension is relevant
        if (!RELEVANT_EXTENSIONS.includes(ext)) {
            return;
        }

        // Deduplication (Windows is case-insensitive, resolve paths)
        const normalizedPath = path.resolve(currentPath);
        const dedupeKey = normalizedPath.toLowerCase();
        if (fileDedupeSet.has(dedupeKey)) {
            return;
        }
        fileDedupeSet.add(dedupeKey);

        const category = classifyFile(currentPath, ext);
        
        let guessedToolName = path.basename(fileName, ext);
        guessedToolName = guessedToolName.replace(/[_-]/g, ' ');
        const possibleVendor = guessVendor(currentPath);

        // Rule 5: Resolve flags dynamically against the entire config (preserving flags after dedupe)
        const isInPluginFolder = isPathInsideAny(currentPath, inventoryConfig.pluginDirs);
        const isInScriptFolder = isPathInsideAny(currentPath, inventoryConfig.scriptDirs);
        const isInPresetFolder = isPathInsideAny(currentPath, inventoryConfig.presetDirs);
        const isInExtensionFolder = isPathInsideAny(currentPath, inventoryConfig.extensionDirs);
        const isInMixedContentFolder = isPathInsideAny(currentPath, inventoryConfig.mixedContentDirs);

        const lowerPath = currentPath.toLowerCase();
        const isLikelyPanel = category === 'scriptui_panel' || lowerPath.includes('scriptui panels') || guessedToolName.toLowerCase().includes('panel');
        const isLikelyPreset = category === 'preset' || ext === '.ffx';
        const isLikelyPlugin = category === 'plugin_binary' || ext === '.aex' || ext === '.plugin';
        const isLikelyScript = ['script', 'script_compiled', 'script_include', 'scriptui_panel'].includes(category);

        const parentFolderName = path.basename(path.dirname(currentPath));
        const topLevelToolFolder = getTopLevelToolFolder(currentPath, sourceRoot);

        // Rule 6: Strictly metadata-only (no content reading)
        // Mesmo arquivos .jsx, .json, .html, .txt, .md e .pdf não serão lidos.
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
            parentFolderGroup: parentFolderName, // Evolved 2-level grouping fields
            topLevelToolGroup: topLevelToolFolder  // Evolved 2-level grouping fields
        };

        inventory.push(fileItem);

        // Rule 3: Grouping on parent level
        const parentDir = path.dirname(currentPath);
        const parentDirKey = path.resolve(parentDir).toLowerCase();
        const parentKey = "parent:" + parentDirKey;
        if (!directoryMap[parentKey]) {
            directoryMap[parentKey] = {
                dirPath: parentDir,
                dirName: parentFolderName,
                sourceRoot: sourceRoot,
                sourceConfigKey: sourceConfigKey,
                groupLevel: 'parent', // Rule 1: Set groupLevel
                files: []
            };
        }
        directoryMap[parentKey].files.push(fileItem);

        // Rule 3 & 4: Grouping on top level
        if (topLevelToolFolder) {
            const topLevelPath = path.join(sourceRoot, topLevelToolFolder);
            const topLevelKey = path.resolve(topLevelPath).toLowerCase();
            const tlKey = "topLevel:" + topLevelKey;
            
            // Only add if parent and top level are different folders
            if (topLevelKey !== parentDirKey) {
                if (!directoryMap[tlKey]) {
                    directoryMap[tlKey] = {
                        dirPath: topLevelPath,
                        dirName: topLevelToolFolder,
                        sourceRoot: sourceRoot,
                        sourceConfigKey: sourceConfigKey,
                        groupLevel: 'topLevel', // Rule 1: Set groupLevel
                        files: []
                    };
                }
                directoryMap[tlKey].files.push(fileItem);
            }
        }
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
            // CEP Extensions directory scan (folders & .zxp)
            try {
                const items = fs.readdirSync(resolvedDir);
                for (const item of items) {
                    const itemPath = path.join(resolvedDir, item);
                    
                    if (isSensitive(item)) {
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
                            isInPluginFolder: isPathInsideAny(itemPath, inventoryConfig.pluginDirs),
                            isInScriptFolder: isPathInsideAny(itemPath, inventoryConfig.scriptDirs),
                            isInPresetFolder: isPathInsideAny(itemPath, inventoryConfig.presetDirs),
                            isInExtensionFolder: true,
                            isInMixedContentFolder: isPathInsideAny(itemPath, inventoryConfig.mixedContentDirs),
                            isLikelyPanel: true,
                            isLikelyPreset: false,
                            isLikelyPlugin: false,
                            isLikelyScript: false,
                            parentFolderGroup: path.basename(resolvedDir),
                            topLevelToolGroup: item
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
                            isInPluginFolder: isPathInsideAny(itemPath, inventoryConfig.pluginDirs),
                            isInScriptFolder: isPathInsideAny(itemPath, inventoryConfig.scriptDirs),
                            isInPresetFolder: isPathInsideAny(itemPath, inventoryConfig.presetDirs),
                            isInExtensionFolder: true,
                            isInMixedContentFolder: isPathInsideAny(itemPath, inventoryConfig.mixedContentDirs),
                            isLikelyPanel: true,
                            isLikelyPreset: false,
                            isLikelyPlugin: false,
                            isLikelyScript: false,
                            parentFolderGroup: path.basename(resolvedDir),
                            topLevelToolGroup: null
                        });
                    }
                }
            } catch (err) {
                console.warn(`[Aviso] Falha ao escanear pasta CEP: ${resolvedDir} (${err.message})`);
            }
        } else {
            // General scan
            scanDirRecursive(resolvedDir, target.key, resolvedDir, inventoryConfig);
        }
    }
}

// Compile Tool Groups
const toolGroups = [];
const groupDedupeSet = new Set();

for (const dirKey in directoryMap) {
    if (!directoryMap.hasOwnProperty(dirKey)) continue;

    const group = directoryMap[dirKey];
    
    // Rule 2: Evolved Group Deduplication check using compound key
    const normalizedGroupPath = path.resolve(group.dirPath);
    const groupDedupeKey = group.groupLevel + ":" + normalizedGroupPath.toLowerCase();
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

    // Determine type diversity for mixture calculations
    const typesList = [containsScripts, containsPresets, containsPlugins, containsPanels, containsDocs];
    const typeDiversityCount = typesList.filter(Boolean).length;
    const isMixedType = typeDiversityCount >= 2;

    const dirNameLower = group.dirName.toLowerCase();
    const isKnownTool = KNOWN_TOOLS.some(tool => dirNameLower.includes(tool));

    // Rule 2: Decide grouping under filters
    const shouldGroup = fileCount >= 2 || isKnownTool || isMixedType;
    if (!shouldGroup) {
        continue;
    }

    groupDedupeSet.add(groupDedupeKey);

    // Group category priority:
    // - mixed_tool_package if multiple types are present
    // - preset_pack if mostly .ffx presets
    // - script_package if mostly .jsx/.jsxbin/.jsxinc
    // - plugin_package if mostly .aex/.plugin
    // - cep_extension if CEP folder/package
    // - tool_package as fallback
    let category = 'tool_package';
    if (isMixedType) {
        category = 'mixed_tool_package';
    } else if (containsPresets) {
        category = 'preset_pack';
    } else if (containsScripts) {
        category = 'script_package';
    } else if (containsPlugins) {
        category = 'plugin_package';
    } else if (group.sourceConfigKey === 'extensionDirs') {
        category = 'cep_extension';
    }

    // Rule 3: Add confidence and explanatory reasoning details
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

    // Rule 6: tool_groups.json schema format output
    toolGroups.push({
        name: group.dirName,
        rootPath: group.dirPath,
        groupLevel: group.groupLevel, // Added
        category: category,
        detectedTypes: Array.from(typeSet),
        fileCount: fileCount,
        extensions: Array.from(extSet),
        possibleVendor: guessVendor(group.dirPath),
        containsScripts: containsScripts,
        containsPresets: containsPresets,
        containsPlugins: containsPlugins,
        containsPanels: containsPanels,
        containsDocs: containsDocs, // Added
        recommendedInventoryUse: 'recommendation_context',
        reason: reason
    });
}

// Rule 5: Ensure output directory paths.dataDir exists before writing
if (!fs.existsSync(paths.dataDir)) {
    try {
        fs.mkdirSync(paths.dataDir, { recursive: true });
        console.log(`[Inventário] Criando pasta de dados: ${paths.dataDir}`);
    } catch (err) {
        console.error(`[Erro] Falha ao criar pasta de dados: ${err.message}`);
    }
}

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
