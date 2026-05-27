// Export Composition by Name or ID Script
#include "utils/json.jsx"
#include "utils/safe.jsx"
#include "utils/layer_utils.jsx"
#include "utils/property_tree_utils.jsx"

function getLayerEffectsLight(layer) {
    var list = [];
    try {
        var effectGroup = layer.property("ADBE Effect Group");
        if (effectGroup !== null) {
            for (var i = 1; i <= effectGroup.numProperties; i++) {
                var effect = effectGroup.property(i);
                if (effect) {
                    var enabledVal = false;
                    try { enabledVal = effect.enabled; } catch (e) {}
                    var activeVal = false;
                    try { activeVal = effect.active; } catch (e) {}
                    list.push({
                        name: effect.name,
                        matchName: effect.matchName || "",
                        enabled: enabledVal,
                        active: activeVal
                    });
                }
            }
        }
    } catch (e) {}
    return list;
}

(function() {
    writeLog("Starting export_comp_by_name...");
    
    var project = app.project;
    if (!project) {
        writeLog("ERROR: No active project found.");
        return;
    }
    
    var root = getProjectRootDir();
    var dataFolder = new Folder(root.fsName + "/data");
    var compsFolder = new Folder(dataFolder.fsName + "/comps");
    if (!compsFolder.exists) {
        compsFolder.create();
    }
    
    // Default request details
    var request = {
        compName: "",
        compId: null,
        mode: "light"
    };
    
    // Read request file
    try {
        var reqFile = new File(dataFolder.fsName + "/comp_request.json");
        if (reqFile.exists) {
            reqFile.open("r");
            var text = reqFile.read();
            reqFile.close();
            var parsed = JSON.parse(text);
            if (parsed) {
                if (parsed.compName !== undefined) request.compName = parsed.compName.toString();
                if (parsed.compId !== undefined && parsed.compId !== null) request.compId = parseInt(parsed.compId);
                if (parsed.mode !== undefined) request.mode = parsed.mode.toString();
            }
        } else {
            writeLog("ERROR: comp_request.json does not exist.");
            return;
        }
    } catch(e) {
        writeLog("ERROR parsing comp_request.json: " + e.toString());
        return;
    }
    
    function sanitizeFilename(name) {
        return name.replace(/[^a-zA-Z0-9_\-]/g, "_");
    }
    
    function writeError(code, message, matches) {
        var errPayload = {
            status: "error",
            code: code,
            message: message,
            matches: matches || []
        };
        var filename = sanitizeFilename(request.compName || ("id_" + request.compId)) + "_error.json";
        var errFile = new File(compsFolder.fsName + "/" + filename);
        errFile.open("w");
        errFile.write(JSON.stringify(errPayload));
        errFile.close();
        writeLog("ERROR written to " + filename + ": " + message);
    }
    
    // Recursive property scanner for map expressions (lightweight)
    function scanExpressionsLight(propParent, layerExp) {
        if (!propParent) return;
        try {
            for (var i = 1; i <= propParent.numProperties; i++) {
                var prop = propParent.property(i);
                if (prop instanceof Property) {
                    if (prop.expressionEnabled) {
                        layerExp.hasExpression = true;
                        var rawExpr = prop.expression ? prop.expression : "";
                        var preview = rawExpr.length > 60 ? rawExpr.substring(0, 60) + "..." : rawExpr;
                        var err = prop.expressionError ? prop.expressionError : "";
                        
                        layerExp.list.push({
                            propertyPath: getPropertyPath(prop),
                            expressionLength: rawExpr.length,
                            expressionPreview: preview,
                            expressionError: err
                        });
                        
                        if (err !== "") {
                            layerExp.errors.push(prop.name + ": " + err);
                        }
                    }
                } else if (prop instanceof PropertyGroup) {
                    scanExpressionsLight(prop, layerExp);
                }
            }
        } catch(err) {}
    }
    
    // Find comps matching criteria
    var matches = [];
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        if (item instanceof CompItem) {
            if (request.compId !== null && request.compId !== undefined) {
                if (item.id === request.compId) {
                    matches.push(item);
                }
            } else if (request.compName !== "") {
                if (item.name === request.compName) {
                    matches.push(item);
                }
            }
        }
    }
    
    if (matches.length === 0) {
        writeError("COMP_NOT_FOUND", "Nenhuma composição correspondente aos critérios foi encontrada.");
        return;
    }
    
    if (matches.length > 1) {
        var list = [];
        for (var m = 0; m < matches.length; m++) {
            list.push({ id: matches[m].id, name: matches[m].name });
        }
        writeError("MULTIPLE_COMPS_FOUND", "Múltiplas composições encontradas com o nome '" + request.compName + "'. Use compId para referenciar de forma única.", list);
        return;
    }
    
    var targetComp = matches[0];
    var compData = {
        status: "success",
        compId: targetComp.id,
        name: targetComp.name,
        width: targetComp.width,
        height: targetComp.height,
        frameRate: targetComp.frameRate,
        duration: targetComp.duration,
        numLayers: targetComp.numLayers,
        workAreaStart: targetComp.workAreaStart,
        workAreaDuration: targetComp.workAreaDuration,
        layers: []
    };
    
    var options = {
        maxPropertiesPerLayer: 500,
        maxDepth: 8,
        maxParametersPerEffect: 80,
        maxKeyframesPerProperty: 20,
        maxStringLength: 300
    };
    
    for (var j = 1; j <= targetComp.numLayers; j++) {
        var layer = targetComp.layer(j);
        
        var layerType = "Unknown";
        if (layer instanceof CameraLayer) layerType = "Camera";
        else if (layer instanceof LightLayer) layerType = "Light";
        else if (layer instanceof TextLayer) layerType = "Text";
        else if (layer instanceof ShapeLayer) layerType = "Shape";
        else if (layer.source && layer.source instanceof CompItem) layerType = "Precomp";
        else if (layer.source && layer.source instanceof FootageItem) {
            layerType = layer.source.mainSource instanceof SolidSource ? "Solid" : "Footage";
        }
        
        var isPrecomp = (layer.source && layer.source instanceof CompItem);
        var isFootage = (layer.source && layer.source instanceof FootageItem);
        
        var layerData = {
            layerIndex: layer.index,
            name: layer.name,
            type: layerType,
            enabled: layer.enabled,
            locked: layer.locked,
            shy: layer.shy,
            solo: layer.solo,
            inPoint: layer.inPoint,
            outPoint: layer.outPoint,
            startTime: layer.startTime,
            parentIndex: layer.parent ? layer.parent.index : null,
            parentName: layer.parent ? layer.parent.name : null,
            sourceItemId: layer.source ? layer.source.id : null,
            sourceName: layer.source ? layer.source.name : null,
            isPrecompLayer: isPrecomp,
            isFootageLayer: isFootage,
            is3D: layer.threeDLayer,
            markerCount: (layer.marker && layer.marker.numKeys) ? layer.marker.numKeys : 0
        };
        
        if (request.mode === "deep") {
            var effects = getLayerEffectsDeep(layer, options);
            var treeRes = getLayerPropertyTree(layer, options);
            layerData.effects = effects;
            layerData.propertyTree = treeRes.propertyTree;
            layerData.scanSummary = {
                propertiesScanned: treeRes.state.propertiesScanned,
                expressionCount: treeRes.state.expressionCount,
                expressionErrorCount: treeRes.state.expressionErrorCount,
                keyframedPropertyCount: treeRes.state.keyframedPropertyCount
            };
            layerData.scanErrors = treeRes.state.scanErrors;
        } else if (request.mode === "map") {
            layerData.effects = getLayerEffectsLight(layer);
            var layerExp = { hasExpression: false, list: [], errors: [] };
            scanExpressionsLight(layer, layerExp);
            layerData.hasExpression = layerExp.hasExpression;
            layerData.expressionErrors = layerExp.errors;
            layerData.expressions = layerExp.list;
        } else {
            // "light" mode (default)
            layerData.effects = getLayerEffectsLight(layer);
        }
        
        compData.layers.push(layerData);
    }
    
    // Write JSON file
    try {
        var filename = sanitizeFilename(targetComp.name) + ".json";
        var outFile = new File(compsFolder.fsName + "/" + filename);
        outFile.open("w");
        outFile.write(JSON.stringify(compData));
        outFile.close();
        writeLog("Successfully exported comp '" + targetComp.name + "' with mode '" + request.mode + "' to: " + outFile.fsName);
    } catch(err) {
        writeLog("ERROR writing comp file: " + err.toString());
    }
})();
