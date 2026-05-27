// Export Active Composition Deep Script
#include "utils/json.jsx"
#include "utils/safe.jsx"
#include "utils/layer_utils.jsx"
#include "utils/property_tree_utils.jsx"

(function() {
    writeLog("Starting export_active_comp_deep...");
    var comp = app.project ? app.project.activeItem : null;
    if (!comp || !(comp instanceof CompItem)) {
        var errPayload = {
            ok: false,
            code: "NO_ACTIVE_COMP",
            command: "export-active-comp-deep",
            message: "Nenhuma composição ativa encontrada.",
            suggestedFix: "Abra ou selecione uma composição no After Effects e tente novamente."
        };
        try {
            var root = getProjectRootDir();
            var dataFolder = new Folder(root.fsName + "/data");
            if (!dataFolder.exists) dataFolder.create();
            var outFile = new File(dataFolder.fsName + "/active_comp_deep_status.json");
            outFile.open("w");
            outFile.write(JSON.stringify(errPayload));
            outFile.close();
            writeLog("ERROR: No active composition found for export-active-comp-deep.");
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
        layers: [],
        metrics: {
            totalLayers: comp.numLayers,
            layersWithEffects: 0,
            totalEffects: 0,
            propertiesScanned: 0,
            expressionCount: 0,
            expressionErrorCount: 0,
            keyframedPropertyCount: 0
        }
    };

    var options = {
        maxPropertiesPerLayer: 500,
        maxDepth: 8,
        maxParametersPerEffect: 80,
        maxKeyframesPerProperty: 20,
        maxStringLength: 300
    };

    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        var parentIdx = null;
        if (layer.parent) {
            parentIdx = layer.parent.index;
        }

        var effects = getLayerEffectsDeep(layer, options);
        var treeRes = getLayerPropertyTree(layer, options);

        if (effects.length > 0) {
            compData.metrics.layersWithEffects++;
            compData.metrics.totalEffects += effects.length;
        }

        compData.metrics.propertiesScanned += treeRes.state.propertiesScanned;
        compData.metrics.expressionCount += treeRes.state.expressionCount;
        compData.metrics.expressionErrorCount += treeRes.state.expressionErrorCount;
        compData.metrics.keyframedPropertyCount += treeRes.state.keyframedPropertyCount;

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
            effects: effects,
            propertyTree: treeRes.propertyTree,
            scanSummary: {
                propertiesScanned: treeRes.state.propertiesScanned,
                expressionCount: treeRes.state.expressionCount,
                expressionErrorCount: treeRes.state.expressionErrorCount,
                keyframedPropertyCount: treeRes.state.keyframedPropertyCount
            },
            scanErrors: treeRes.state.scanErrors
        };

        compData.layers.push(layerInfo);
    }

    try {
        var root = getProjectRootDir();
        var dataFolder = new Folder(root.fsName + "/data");
        if (!dataFolder.exists) {
            dataFolder.create();
        }
        var outFile = new File(dataFolder.fsName + "/active_comp_deep.json");
        outFile.open("w");
        outFile.write(JSON.stringify(compData));
        outFile.close();
        writeLog("Successfully exported deep active comp to: " + outFile.fsName);

        // Write ok status
        var okStatus = {
            ok: true,
            command: "export-active-comp-deep",
            filePath: outFile.fsName
        };
        var statusFile = new File(dataFolder.fsName + "/export_active_comp_deep_status.json");
        statusFile.open("w");
        statusFile.write(JSON.stringify(okStatus));
        statusFile.close();
    } catch (err) {
        writeLog("ERROR writing active_comp_deep.json: " + err.toString());
    }
})();
