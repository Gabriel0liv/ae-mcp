// Export Active Composition Script
#include "utils/json.jsx"
#include "utils/safe.jsx"
#include "utils/layer_utils.jsx"

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
    writeLog("Starting export_active_comp...");
    var comp = app.project ? app.project.activeItem : null;
    if (!comp || !(comp instanceof CompItem)) {
        var errPayload = {
            ok: false,
            code: "NO_ACTIVE_COMP",
            command: "export-active-comp",
            message: "Nenhuma composição ativa encontrada.",
            suggestedFix: "Abra ou selecione uma composição no After Effects e tente novamente."
        };
        try {
            var root = getProjectRootDir();
            var dataFolder = new Folder(root.fsName + "/data");
            if (!dataFolder.exists) dataFolder.create();
            var outFile = new File(dataFolder.fsName + "/active_comp.json");
            outFile.open("w");
            outFile.write(JSON.stringify(errPayload));
            outFile.close();
            writeLog("ERROR: No active composition found for export-active-comp.");
        } catch(e) {}
        return;
    }
    
    var projName = "Sem Titulo";
    if (app.project.file) {
        projName = app.project.file.name;
    }
    
    var compData = {
        projectName: projName,
        compName: comp.name,
        width: comp.width,
        height: comp.height,
        frameRate: comp.frameRate,
        duration: comp.duration,
        numLayers: comp.numLayers,
        workAreaStart: comp.workAreaStart,
        workAreaDuration: comp.workAreaDuration,
        motionBlurEnabled: comp.motionBlur,
        layers: []
    };
    
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        var parentIdx = null;
        if (layer.parent) {
            parentIdx = layer.parent.index;
        }
        
        var hasEffects = false;
        try {
            var effectGroup = layer.property("ADBE Effect Group");
            if (effectGroup !== null && effectGroup.numProperties > 0) {
                hasEffects = true;
            }
        } catch (e) {}
        
        var hasMasks = false;
        try {
            var maskGroup = layer.property("ADBE Mask Group");
            if (maskGroup !== null && maskGroup.numProperties > 0) {
                hasMasks = true;
            }
        } catch (e) {}
        
        var hasExpr = hasTransformExpression(layer);
        
        var layerInfo = {
            index: layer.index,
            name: layer.name,
            type: getLayerType(layer),
            enabled: layer.enabled,
            solo: layer.solo,
            shy: layer.shy,
            locked: layer.locked,
            selected: layer.selected,
            inPoint: layer.inPoint,
            outPoint: layer.outPoint,
            startTime: layer.startTime,
            parentIndex: parentIdx,
            hasVideo: layer.hasVideo,
            hasAudio: layer.hasAudio,
            blendingMode: String(layer.blendingMode),
            hasEffects: hasEffects,
            hasMasks: hasMasks,
            hasExpressionInTransform: hasExpr,
            effects: getLayerEffectsLight(layer)
        };
        
        compData.layers.push(layerInfo);
    }
    
    try {
        var root = getProjectRootDir();
        var dataFolder = new Folder(root.fsName + "/data");
        if (!dataFolder.exists) {
            dataFolder.create();
        }
        var outFile = new File(dataFolder.fsName + "/active_comp.json");
        outFile.open("w");
        outFile.write(JSON.stringify(compData));
        outFile.close();
        writeLog("Successfully exported active comp to: " + outFile.fsName);
    } catch (err) {
        writeLog("ERROR writing active_comp.json: " + err.toString());
    }
})();
