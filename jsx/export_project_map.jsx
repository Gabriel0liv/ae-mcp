// Export Project Map Script
#include "utils/json.jsx"
#include "utils/safe.jsx"

(function() {
    writeLog("Starting export_project_map...");
    
    var project = app.project;
    if (!project) {
        writeLog("ERROR: No active project found.");
        return;
    }
    
    var data = {
        projectName: project.file ? project.file.name : "Unsaved Project",
        comps: [],
        dependencies: {
            compUsesPrecomp: [],
            compUsesFootage: [],
            footageUsedBy: [],
            precompUsedBy: []
        }
    };
    
    // Helpers to build reversed dependencies
    var footageMap = {}; // footageId -> { name, compsUsed: { compId -> name } }
    var precompMap = {}; // precompId -> { name, compsUsed: { compId -> name } }
    
    // Recursive property scanner for expressions
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
                            propertyPath: propParent.name + " > " + prop.name,
                            expressionLength: rawExpr.length,
                            expressionPreview: preview,
                            expressionError: err
                        });
                        
                        if (err !== "") {
                            layerExp.errors.push("Propriedade '" + prop.name + "': " + err);
                        }
                    }
                } else if (prop instanceof PropertyGroup) {
                    scanExpressionsLight(prop, layerExp);
                }
            }
        } catch(err) {}
    }
    
    // Loop through all items
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        if (item instanceof CompItem) {
            var comp = item;
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
                layers: []
            };
            
            for (var j = 1; j <= comp.numLayers; j++) {
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
                    
                    // Add to index
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
                    
                    // Add to index
                    if (!footageMap[footage.id.toString()]) {
                        footageMap[footage.id.toString()] = { name: footage.name, compsUsed: {} };
                    }
                    footageMap[footage.id.toString()].compsUsed[comp.id.toString()] = comp.name;
                }
                
                // Scan effects
                var effectsList = [];
                try {
                    var effectGroup = layer.property("ADBE Effect Group");
                    if (effectGroup !== null) {
                        for (var e = 1; e <= effectGroup.numProperties; e++) {
                            var fx = effectGroup.property(e);
                            if (fx) {
                                var enabledVal = false;
                                try { enabledVal = fx.enabled; } catch (eFx) {}
                                var activeVal = false;
                                try { activeVal = fx.active; } catch (eFx) {}
                                effectsList.push({
                                    name: fx.name,
                                    matchName: fx.matchName || "",
                                    enabled: enabledVal,
                                    active: activeVal
                                });
                            }
                        }
                    }
                } catch(e) {}
                
                // Scan expressions (lightweight)
                var layerExp = { hasExpression: false, list: [], errors: [] };
                scanExpressionsLight(layer, layerExp);
                
                var markers = 0;
                try {
                    if (layer.marker && layer.marker.numKeys) {
                        markers = layer.marker.numKeys;
                    }
                } catch(e) {}
                
                compData.layers.push({
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
                    sourceType: isPrecomp ? "Composition" : (isFootage ? "Footage" : "None"),
                    isPrecompLayer: isPrecomp,
                    isFootageLayer: isFootage,
                    isTextLayer: (layer instanceof TextLayer),
                    isShapeLayer: (layer instanceof ShapeLayer),
                    is3D: layer.threeDLayer,
                    hasEffects: effectsList.length > 0,
                    effects: effectsList,
                    hasExpression: layerExp.hasExpression,
                    expressionErrors: layerExp.errors,
                    expressions: layerExp.list,
                    markerCount: markers
                });
            }
            
            data.comps.push(compData);
        }
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
        var root = getProjectRootDir();
        var dataFolder = new Folder(root.fsName + "/data");
        if (!dataFolder.exists) {
            dataFolder.create();
        }
        var outFile = new File(dataFolder.fsName + "/project_map.json");
        outFile.open("w");
        outFile.write(JSON.stringify(data));
        outFile.close();
        writeLog("Successfully exported project map to: " + outFile.fsName);
    } catch(err) {
        writeLog("ERROR writing project_map.json: " + err.toString());
    }
})();
