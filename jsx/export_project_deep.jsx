// Export Project Deep Script
#include "utils/json.jsx"
#include "utils/safe.jsx"

(function() {
    writeLog("Starting export_project_deep...");
    
    var project = app.project;
    if (!project) {
        writeLog("ERROR: No active project found.");
        return;
    }
    
    var root = getProjectRootDir();
    var dataFolder = new Folder(root.fsName + "/data");
    
    // Load request options if available
    var options = {
        maxComps: 5,
        maxLayersPerComp: 20,
        maxPropertiesPerLayer: 50,
        includeExpressions: true,
        includeExpressionSource: false,
        includeKeyframes: "summary" // none | summary | values
    };
    
    try {
        var reqFile = new File(dataFolder.fsName + "/project_deep_request.json");
        if (reqFile.exists) {
            reqFile.open("r");
            var text = reqFile.read();
            reqFile.close();
            var parsed = JSON.parse(text);
            if (parsed) {
                if (parsed.maxComps !== undefined) options.maxComps = parseInt(parsed.maxComps);
                if (parsed.maxLayersPerComp !== undefined) options.maxLayersPerComp = parseInt(parsed.maxLayersPerComp);
                if (parsed.maxPropertiesPerLayer !== undefined) options.maxPropertiesPerLayer = parseInt(parsed.maxPropertiesPerLayer);
                if (parsed.includeExpressions !== undefined) options.includeExpressions = !!parsed.includeExpressions;
                if (parsed.includeExpressionSource !== undefined) options.includeExpressionSource = !!parsed.includeExpressionSource;
                if (parsed.includeKeyframes !== undefined) options.includeKeyframes = parsed.includeKeyframes.toString();
            }
        }
    } catch(e) {
        writeLog("WARNING: Failed to parse project_deep_request.json, using defaults.");
    }
    
    var data = {
        projectName: project.file ? project.file.name : "Unsaved Project",
        warnings: [],
        comps: [],
        dependencies: {
            compUsesPrecomp: [],
            compUsesFootage: [],
            footageUsedBy: [],
            precompUsedBy: []
        }
    };
    
    var footageMap = {};
    var precompMap = {};
    
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
    
    // Recursive property scanner for deep properties
    function scanPropertiesDeep(propParent, layer, layerData, state) {
        if (!propParent) return;
        if (state.propCount >= options.maxPropertiesPerLayer) {
            state.truncated = true;
            return;
        }
        
        try {
            for (var i = 1; i <= propParent.numProperties; i++) {
                if (state.propCount >= options.maxPropertiesPerLayer) {
                    state.truncated = true;
                    break;
                }
                
                var prop = propParent.property(i);
                if (prop instanceof Property) {
                    state.propCount++;
                    var propData = {
                        name: prop.name,
                        path: propParent.name + " > " + prop.name,
                        value: getSafeValue(prop.value)
                    };
                    
                    // Expression handling
                    if (options.includeExpressions && prop.expressionEnabled) {
                        propData.hasExpression = true;
                        var rawExpr = prop.expression ? prop.expression : "";
                        propData.expressionLength = rawExpr.length;
                        propData.expressionPreview = rawExpr.length > 60 ? rawExpr.substring(0, 60) + "..." : rawExpr;
                        if (prop.expressionError) {
                            propData.expressionError = prop.expressionError;
                            layerData.expressionErrors.push(prop.name + ": " + prop.expressionError);
                        }
                        if (options.includeExpressionSource) {
                            propData.expressionFull = rawExpr;
                        }
                    }
                    
                    // Keyframe handling
                    if (options.includeKeyframes !== "none" && prop.numKeys > 0) {
                        propData.hasKeyframes = true;
                        propData.keyframeCount = prop.numKeys;
                        if (options.includeKeyframes === "values") {
                            propData.keyframes = [];
                            var limitKeys = Math.min(prop.numKeys, 20); // Protect against huge keyframe arrays
                            for (var k = 1; k <= limitKeys; k++) {
                                propData.keyframes.push({
                                    index: k,
                                    time: prop.keyTime(k),
                                    value: getSafeValue(prop.keyValue(k))
                                });
                            }
                            if (prop.numKeys > 20) {
                                propData.keyframesWarning = "Truncated to first 20 keyframes.";
                            }
                        }
                    }
                    
                    layerData.properties.push(propData);
                } else if (prop instanceof PropertyGroup) {
                    scanPropertiesDeep(prop, layer, layerData, state);
                }
            }
        } catch(err) {
            // Protect against individual property access exceptions
        }
    }
    
    var compsProcessed = 0;
    
    // Gather all comps first to count them
    var allCompItems = [];
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        if (item instanceof CompItem) {
            allCompItems.push(item);
        }
    }
    
    if (allCompItems.length > options.maxComps) {
        data.warnings.push("O projeto possui " + allCompItems.length + " composições. Scan Deep limitado às primeiras " + options.maxComps + " composições.");
        writeLog("WARNING: Project has too many comps. Limiting deep scan to " + options.maxComps);
    }
    
    var limitComps = Math.min(allCompItems.length, options.maxComps);
    for (var c = 0; c < limitComps; c++) {
        var comp = allCompItems[c];
        
        var compData = {
            compId: comp.id,
            name: comp.name,
            settings: {
                width: comp.width,
                height: comp.height,
                frameRate: comp.frameRate,
                duration: comp.duration,
                numLayers: comp.numLayers,
                workAreaStart: comp.workAreaStart,
                workAreaDuration: comp.workAreaDuration
            },
            layers: [],
            warnings: []
        };
        
        var limitLayers = Math.min(comp.numLayers, options.maxLayersPerComp);
        if (comp.numLayers > options.maxLayersPerComp) {
            compData.warnings.push("Composição possui " + comp.numLayers + " camadas. Scan Deep limitado às primeiras " + options.maxLayersPerComp + " camadas.");
        }
        
        for (var j = 1; j <= limitLayers; j++) {
            var layer = comp.layer(j);
            
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
            
            // Track dependencies
            if (isPrecomp) {
                var childComp = layer.source;
                data.dependencies.compUsesPrecomp.push({
                    parentCompId: comp.id,
                    parentCompName: comp.name,
                    childCompId: childComp.id,
                    childCompName: childComp.name
                });
                if (!precompMap[childComp.id.toString()]) {
                    precompMap[childComp.id.toString()] = { name: childComp.name, compsUsed: {} };
                }
                precompMap[childComp.id.toString()].compsUsed[comp.id.toString()] = comp.name;
            }
            
            if (isFootage) {
                var footage = layer.source;
                data.dependencies.compUsesFootage.push({
                    compId: comp.id,
                    compName: comp.name,
                    footageId: footage.id,
                    footageName: footage.name
                });
                if (!footageMap[footage.id.toString()]) {
                    footageMap[footage.id.toString()] = { name: footage.name, compsUsed: {} };
                }
                footageMap[footage.id.toString()].compsUsed[comp.id.toString()] = comp.name;
            }
            
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
                expressionErrors: [],
                properties: []
            };
            
            // Perform deep scan of properties
            var state = { propCount: 0, truncated: false };
            scanPropertiesDeep(layer, layer, layerData, state);
            if (state.truncated) {
                layerData.propertiesWarning = "Propriedades limitadas a " + options.maxPropertiesPerLayer + " itens.";
            }
            
            compData.layers.push(layerData);
        }
        
        data.comps.push(compData);
    }
    
    // Compile footageUsedBy and precompUsedBy list formats
    for (var fid in footageMap) {
        if (!footageMap.hasOwnProperty(fid)) continue;
        var fUsed = footageMap[fid];
        var fComps = [];
        for (var cid in fUsed.compsUsed) {
            if (fUsed.compsUsed.hasOwnProperty(cid)) {
                fComps.push({ compId: parseInt(cid), compName: fUsed.compsUsed[cid] });
            }
        }
        data.dependencies.footageUsedBy.push({
            footageId: parseInt(fid),
            footageName: fUsed.name,
            usedInComps: fComps
        });
    }
    
    for (var pid in precompMap) {
        if (!precompMap.hasOwnProperty(pid)) continue;
        var pUsed = precompMap[pid];
        var pComps = [];
        for (var ccid in pUsed.compsUsed) {
            if (pUsed.compsUsed.hasOwnProperty(ccid)) {
                pComps.push({ compId: parseInt(ccid), compName: pUsed.compsUsed[ccid] });
            }
        }
        data.dependencies.precompUsedBy.push({
            precompId: parseInt(pid),
            precompName: pUsed.name,
            usedInComps: pComps
        });
    }
    
    // Write JSON file
    try {
        var outFile = new File(dataFolder.fsName + "/project_deep.json");
        outFile.open("w");
        outFile.write(JSON.stringify(data));
        outFile.close();
        writeLog("Successfully exported project deep scan to: " + outFile.fsName);
    } catch(err) {
        writeLog("ERROR writing project_deep.json: " + err.toString());
        alert("Erro ao gravar project_deep.json: " + err.toString());
    }
})();
