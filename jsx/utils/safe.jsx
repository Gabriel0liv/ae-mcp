// ExtendScript Safety Utilities

// Get the root directory of the project based on the location of this script
function getProjectRootDir() {
    var file = new File($.fileName);
    var parentName = file.parent.name.toLowerCase();
    // If running from within jsx/utils or jsx/presets, go up two levels; if from jsx, go up one level.
    if (parentName === "utils" || parentName === "presets") {
        return file.parent.parent.parent;
    }
    return file.parent.parent;
}

// Write simple log message to logs/ae_bridge.log
function writeLog(message) {
    try {
        var root = getProjectRootDir();
        var logFolder = new Folder(root.fsName + "/logs");
        if (!logFolder.exists) {
            logFolder.create();
        }
        var logFile = new File(logFolder.fsName + "/ae_bridge.log");
        if (logFile.open("a")) {
            var date = new Date();
            var dateStr = date.getFullYear() + "-" + 
                          ("0" + (date.getMonth() + 1)).slice(-2) + "-" + 
                          ("0" + date.getDate()).slice(-2) + " " + 
                          ("0" + date.getHours()).slice(-2) + ":" + 
                          ("0" + date.getMinutes()).slice(-2) + ":" + 
                          ("0" + date.getSeconds()).slice(-2);
            logFile.writeln("[" + dateStr + "] " + message);
            logFile.close();
        }
    } catch (e) {
        // Fail silently to avoid breaking execution
    }
}

// Check if app.project.activeItem is a valid CompItem
function checkActiveComp() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        writeLog("ERROR: Active item is not a composition.");
        return null;
    }
    return comp;
}

// Safely duplicate a CompItem with a unique name
// Checks if the generated name already exists and appends incrementing counter if necessary.
// Returns the duplicated CompItem. Does NOT manually change app.project.activeItem.
function duplicateCompSafely(comp, suffix) {
    if (!comp || !(comp instanceof CompItem)) {
        throw new Error("Invalid composition item provided to duplicate.");
    }
    
    var baseName = comp.name + suffix;
    var uniqueName = baseName;
    var counter = 1;
    
    var nameExists = true;
    while (nameExists) {
        nameExists = false;
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i).name === uniqueName) {
                nameExists = true;
                uniqueName = baseName + "_" + ("00" + counter).slice(-3);
                counter++;
                break;
            }
        }
    }
    
    var duplicatedComp = comp.duplicate();
    duplicatedComp.name = uniqueName;
    writeLog("Duplicated comp '" + comp.name + "' to '" + uniqueName + "'");
    return duplicatedComp;
}

// Wrap operations in an undo group
function wrapUndoGroup(groupName, callback) {
    app.beginUndoGroup(groupName);
    try {
        var result = callback();
        app.endUndoGroup();
        return result;
    } catch (e) {
        app.endUndoGroup();
        writeLog("ERROR in undo group '" + groupName + "': " + e.toString());
        throw e;
    }
}

// Return 1-based indices of all selected layers in a comp
function getSelectedLayerIndices(comp) {
    var indices = [];
    if (!comp) return indices;
    var selected = comp.selectedLayers;
    for (var i = 0; i < selected.length; i++) {
        indices.push(selected[i].index);
    }
    return indices;
}

// Retrieve layers in a comp based on an array of indices
function getLayersByIndices(comp, indices) {
    var layers = [];
    if (!comp || !indices) return layers;
    for (var i = 0; i < indices.length; i++) {
        var idx = indices[i];
        if (idx >= 1 && idx <= comp.numLayers) {
            layers.push(comp.layer(idx));
        }
    }
    return layers;
}

// Return an array of selected layers safely without throwing on empty selection
function getSelectedLayersSafe(comp) {
    var layers = [];
    if (!comp) return layers;
    try {
        var selected = comp.selectedLayers;
        if (selected) {
            for (var i = 0; i < selected.length; i++) {
                layers.push(selected[i]);
            }
        }
    } catch(e) {
        writeLog("WARNING: Error in getSelectedLayersSafe: " + e.toString());
    }
    return layers;
}

// Return structured error if no layers are selected, writing it to data/<command>_status.json (or selected_layers.json)
function requireSelectedLayers(comp, commandName) {
    var date = new Date();
    var dateStr = date.toISOString ? date.toISOString() : date.toString();
    var errPayload = null;
    
    if (!comp) {
        errPayload = {
            ok: false,
            code: "NO_ACTIVE_COMP",
            command: commandName,
            message: "Nenhuma composição ativa encontrada.",
            suggestedFix: "Abra ou selecione uma composição antes de rodar este comando.",
            createdAt: dateStr
        };
    } else {
        var selected = comp.selectedLayers;
        if (!selected || selected.length === 0) {
            errPayload = {
                ok: false,
                code: "NO_SELECTED_LAYERS",
                command: commandName,
                message: "Nenhum layer selecionado.",
                suggestedFix: "Selecione um ou mais layers na timeline antes de rodar este comando.",
                createdAt: dateStr
            };
        }
    }
    
    if (errPayload) {
        try {
            var root = getProjectRootDir();
            var dataFolder = new Folder(root.fsName + "/data");
            if (!dataFolder.exists) {
                dataFolder.create();
            }
            
            var filename = commandName + "_status.json";
            if (commandName === "export-selected-layers") {
                filename = "selected_layers.json";
            }
            
            var outFile = new File(dataFolder.fsName + "/" + filename);
            outFile.open("w");
            outFile.write(JSON.stringify(errPayload));
            outFile.close();
            writeLog("requireSelectedLayers failed for command '" + commandName + "' with code " + errPayload.code + ". Exported error to: " + outFile.fsName);
        } catch(e) {
            writeLog("CRITICAL: Failed to write requireSelectedLayers status: " + e.toString());
        }
        
        return errPayload;
    }
    return null;
}
