// Export Composition by Name or ID Script
#include "utils/json.jsx"
#include "utils/safe.jsx"

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
        mode: "map"
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
    
    // Convert property value to a safe JSON format
    function getSafeValue(val) {
        if (val === null || val === undefined) return null;
        if (typeof val === "number" || typeof val === "string" || typeof val === "boolean") return val;
        if (val.length !== undefined) {
            var arr = [];
            for (var i = 0; i < val.length; i++) {
                arr.push(val[i]);
            }
            return arr;
        }
        return val.toString();
    }
    
    // Recursive property scanner
    function scanProperties(propParent, layer, mode, layerData) {
        if (!propParent) return;
        try {
            for (var i = 1; i <= propParent.numProperties; i++) {
                var prop = propParent.property(i);
                if (prop instanceof Property) {
                    var isDeep = (mode === "deep");
                    
                    if (prop.expressionEnabled) {
                        layerData.hasExpression = true;
                        var rawExpr = prop.expression ? prop.expression : "";
                        var preview = rawExpr.length > 60 ? rawExpr.substring(0, 60) + "..." : rawExpr;
                        var err = prop.expressionError ? prop.expressionError : "";
                        
                        var expData = {
                            propertyPath: propParent.name + " > " + prop.name,
                            expressionLength: rawExpr.length,
                            expressionPreview: preview,
                            expressionError: err
                        };
                        if (isDeep) {
                            expData.expressionFull = rawExpr;
                        }
                        layerData.expressions.push(expData);
                        if (err !== "") {
                            layerData.expressionErrors.push(prop.name + ": " + err);
                        }
                    }
                    
                    if (isDeep) {
                        var propData = {
                            name: prop.name,
                            path: propParent.name + " > " + prop.name,
                            value: getSafeValue(prop.value)
                        };
                        if (prop.numKeys > 0) {
                            propData.hasKeyframes = true;
                            propData.keyframeCount = prop.numKeys;
                            propData.keyframes = [];
                            var limitKeys = Math.min(prop.numKeys, 20);
                            for (var k = 1; k <= limitKeys; k++) {
                                propData.keyframes.push({
                                    time: prop.keyTime(k),
                                    value: getSafeValue(prop.keyValue(k))
                                });
                            }
                        }
                        layerData.properties.push(propData);
                    }
                } else if (prop instanceof PropertyGroup) {
                    scanProperties(prop, layer, mode, layerData);
                }
            }
        } catch(e) {}
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
        
        var effectsList = [];
        try {
            if (layer.effect && layer.effect.numProperties > 0) {
                for (var e = 1; e <= layer.effect.numProperties; e++) {
                    var fx = layer.effect.property(e);
                    effectsList.push({
                        name: fx.name,
                        matchName: fx.matchName,
                        enabled: fx.active
                    });
                }
            }
        } catch(e) {}
        
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
            effects: effectsList,
            hasExpression: false,
            expressionErrors: [],
            expressions: [],
            markerCount: (layer.marker && layer.marker.numKeys) ? layer.marker.numKeys : 0
        };
        
        if (request.mode === "deep") {
            layerData.properties = [];
        }
        
        scanProperties(layer, layer, request.mode, layerData);
        
        compData.layers.push(layerData);
    }
    
    // Write JSON file
    try {
        var filename = sanitizeFilename(targetComp.name) + ".json";
        var outFile = new File(compsFolder.fsName + "/" + filename);
        outFile.open("w");
        outFile.write(JSON.stringify(compData));
        outFile.close();
        writeLog("Successfully exported comp '" + targetComp.name + "' to: " + outFile.fsName);
    } catch(err) {
        writeLog("ERROR writing comp file: " + err.toString());
        alert("Erro ao gravar comp file: " + err.toString());
    }
})();
