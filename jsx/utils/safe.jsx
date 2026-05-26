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
