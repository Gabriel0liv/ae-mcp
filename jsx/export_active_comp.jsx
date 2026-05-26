// Export Active Composition Script
#include "utils/json.jsx"
#include "utils/safe.jsx"
#include "utils/layer_utils.jsx"

(function() {
    writeLog("Starting export_active_comp...");
    var comp = checkActiveComp();
    if (!comp) {
        alert("Nenhuma composicao ativa encontrada. Abra uma composicao e tente novamente.");
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
            hasExpressionInTransform: hasExpr
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
        alert("Erro ao gravar arquivo de dados: " + err.toString());
    }
})();
