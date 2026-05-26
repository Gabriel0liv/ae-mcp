// Export Selected Layers Script
#include "utils/json.jsx"
#include "utils/safe.jsx"
#include "utils/layer_utils.jsx"

(function() {
    writeLog("Starting export_selected_layers...");
    var comp = checkActiveComp();
    if (!comp) {
        alert("Nenhuma composicao ativa encontrada. Abra uma composicao e tente novamente.");
        return;
    }
    
    var selectedIndices = getSelectedLayerIndices(comp);
    if (selectedIndices.length === 0) {
        alert("Nenhum layer selecionado na composicao ativa.");
        writeLog("WARNING: No layers selected for export.");
        return;
    }
    
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
        alert("Erro ao gravar selected_layers.json: " + err.toString());
    }
})();
