// Check Expression Errors Script
#include "utils/json.jsx"
#include "utils/safe.jsx"

// Reconstruct property path by traversing parent properties
function getPropertyPath(prop) {
    var path = prop.name;
    var parent = prop.parentProperty;
    while (parent !== null) {
        path = parent.name + " > " + path;
        parent = parent.parentProperty;
    }
    return path;
}

// Recursively inspect properties
function scanProperties(parentProp, errorsList, layer, comp) {
    if (!parentProp) return;
    try {
        var numProps = parentProp.numProperties;
        if (numProps !== undefined) {
            for (var i = 1; i <= numProps; i++) {
                var prop = parentProp.property(i);
                if (!prop) continue;
                
                // Check if this property has an expression and if it reports an error
                try {
                    if (prop.expressionEnabled) {
                        var exprErr = prop.expressionError;
                        if (exprErr && exprErr !== "") {
                            errorsList.push({
                                compName: comp.name,
                                layerName: layer.name,
                                layerIndex: layer.index,
                                propertyPath: getPropertyPath(prop),
                                expression: prop.expression,
                                error: exprErr
                            });
                        }
                    }
                } catch (eProp) {
                    // Property doesn't support expressions or check failed (safe fallback)
                }
                
                // Recurse into sub-properties (e.g. effects, masks, shapes)
                try {
                    if (prop.numProperties !== undefined && prop.numProperties > 0) {
                        scanProperties(prop, errorsList, layer, comp);
                    }
                } catch (eRecurse) {
                    // Failed to traverse group (safe fallback)
                }
            }
        }
    } catch (eGroup) {
        // Failed reading group properties (safe fallback)
    }
}

(function() {
    writeLog("Starting check_expression_errors...");
    var errorsList = [];
    var numItems = app.project.numItems;
    
    for (var i = 1; i <= numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem) {
            for (var j = 1; j <= item.numLayers; j++) {
                var layer = item.layer(j);
                scanProperties(layer, errorsList, layer, item);
            }
        }
    }
    
    try {
        var root = getProjectRootDir();
        var dataFolder = new Folder(root.fsName + "/data");
        if (!dataFolder.exists) {
            dataFolder.create();
        }
        var outFile = new File(dataFolder.fsName + "/expression_errors.json");
        outFile.open("w");
        outFile.write(JSON.stringify(errorsList));
        outFile.close();
        writeLog("Successfully exported expression errors list (found " + errorsList.length + " errors) to: " + outFile.fsName);
    } catch (err) {
        writeLog("ERROR writing expression_errors.json: " + err.toString());
        alert("Erro ao gravar expression_errors.json: " + err.toString());
    }
})();
