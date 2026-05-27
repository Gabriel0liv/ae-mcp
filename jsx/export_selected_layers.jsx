// Export Selected Layers Script
#include "utils/json.jsx"
#include "utils/safe.jsx"
#include "utils/layer_utils.jsx"

(function() {
    writeLog("Starting export_selected_layers...");
    var comp = app.project ? app.project.activeItem : null;
    if (!comp || !(comp instanceof CompItem)) {
        var errPayload = {
            ok: false,
            code: "NO_ACTIVE_COMP",
            command: "export-selected-layers",
            message: "Nenhuma composição ativa encontrada.",
            suggestedFix: "Abra ou selecione uma composição no After Effects e tente novamente."
        };
        try {
            var root = getProjectRootDir();
            var dataFolder = new Folder(root.fsName + "/data");
            if (!dataFolder.exists) dataFolder.create();
            var outFile = new File(dataFolder.fsName + "/selected_layers.json");
            outFile.open("w");
            outFile.write(JSON.stringify(errPayload));
            outFile.close();
            writeLog("ERROR: No active composition found for export-selected-layers.");
        } catch(e) {}
        return;
    }
    
    var err = requireSelectedLayers(comp, "export-selected-layers");
    if (err) {
        return;
    }
    
    var selectedIndices = getSelectedLayerIndices(comp);
    var layersData = [];
    var selectedLayers = getLayersByIndices(comp, selectedIndices);
    
    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        var parentIdx = null;
        if (layer.parent) {
            parentIdx = layer.parent.index;
        }
        
        var layerData = {
            index: layer.index,
            name: layer.name,
            type: getLayerType(layer),
            parentIndex: parentIdx,
            transforms: getLayerTransforms(layer)
        };
        
        layersData.push(layerData);
    }
    
    try {
        var root = getProjectRootDir();
        var dataFolder = new Folder(root.fsName + "/data");
        if (!dataFolder.exists) {
            dataFolder.create();
        }
        var outFile = new File(dataFolder.fsName + "/selected_layers.json");
        outFile.open("w");
        outFile.write(JSON.stringify(layersData));
        outFile.close();
        writeLog("Successfully exported selected layers to: " + outFile.fsName);
    } catch (err) {
        writeLog("ERROR writing selected_layers.json: " + err.toString());
    }
})();
