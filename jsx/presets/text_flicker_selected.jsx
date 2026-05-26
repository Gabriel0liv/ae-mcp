// Preset: Text Flicker (Opacity Strobe) Selected Layers
#include "../utils/json.jsx"
#include "../utils/safe.jsx"

// --- Preset parameters (Easily adjustable) ---
var FLICKER_FREQUENCY = 18;     // Flicker frequency in Hz (cycles per second)
var FLICKER_MIN_OPACITY = 10;   // Minimum opacity (doesn't go completely black for better visuals)
var FLICKER_MAX_OPACITY = 100;  // Maximum opacity

(function() {
    writeLog("Starting preset: text_flicker_selected...");
    var comp = checkActiveComp();
    if (!comp) {
        alert("Nenhuma composicao ativa encontrada.");
        return;
    }
    
    var selectedIndices = getSelectedLayerIndices(comp);
    if (selectedIndices.length === 0) {
        alert("Por favor, selecione pelo menos um layer para aplicar o flicker.");
        writeLog("WARNING: No layers selected for preset: text_flicker_selected");
        return;
    }
    
    wrapUndoGroup("Text Flicker Selected Layers", function() {
        // Safe duplication of the composition
        var newComp = duplicateCompSafely(comp, "_AI_Flicker");
        
        // Retrieve the corresponding layers in the new composition
        var targetLayers = getLayersByIndices(newComp, selectedIndices);
        
        for (var i = 0; i < targetLayers.length; i++) {
            var layer = targetLayers[i];
            
            try {
                var opacityProp = layer.property("ADBE Transform Group").property("ADBE Opacity");
                if (opacityProp) {
                    var expr = "var freq = " + FLICKER_FREQUENCY + ";\n" +
                               "var minVal = " + FLICKER_MIN_OPACITY + ";\n" +
                               "var maxVal = " + FLICKER_MAX_OPACITY + ";\n" +
                               "var strobe = Math.sin(time * Math.PI * 2 * freq);\n" +
                               "strobe > 0 ? maxVal : minVal;";
                               
                    opacityProp.expression = expr;
                    writeLog("Applied Flicker expression to Opacity on layer: " + layer.name);
                }
            } catch (eOpacity) {
                writeLog("ERROR applying Flicker preset to layer: " + layer.name + " - " + eOpacity.toString());
            }
        }
        
        alert("Preset de Flicker aplicado com sucesso na composicao duplicada: " + newComp.name);
    });
})();
