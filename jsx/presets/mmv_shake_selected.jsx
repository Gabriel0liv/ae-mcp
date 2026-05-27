// Preset: MMV Shake Selected Layers
#include "../utils/json.jsx"
#include "../utils/safe.jsx"

// --- Preset parameters (Easily adjustable) ---
var SHAKE_FREQUENCY = 15; // Hz (wiggle frequency)
var SHAKE_AMPLITUDE = 25;  // Pixels (wiggle amplitude)

(function() {
    writeLog("Starting preset: mmv_shake_selected...");
    var comp = app.project ? app.project.activeItem : null;
    if (!comp || !(comp instanceof CompItem)) {
        comp = null;
    }
    
    var err = requireSelectedLayers(comp, "mmv-shake");
    if (err) {
        return;
    }
    
    var selectedIndices = getSelectedLayerIndices(comp);
    
    wrapUndoGroup("MMV Shake Selected Layers", function() {
        // Safe duplication of the composition
        var newComp = duplicateCompSafely(comp, "_AI_Shake");
        
        // Enable motion blur on the duplicated composition
        newComp.motionBlur = true;
        
        // Retrieve the corresponding layers in the new composition
        var targetLayers = getLayersByIndices(newComp, selectedIndices);
        
        for (var i = 0; i < targetLayers.length; i++) {
            var layer = targetLayers[i];
            
            // Enable motion blur on the layer (only AVLayers support motion blur)
            try {
                if (layer instanceof AVLayer) {
                    layer.motionBlur = true;
                }
            } catch (eMB) {
                writeLog("Could not enable motion blur on layer: " + layer.name);
            }
            
            // Apply shake expression to the position property
            try {
                var positionProp = layer.property("ADBE Transform Group").property("ADBE Position");
                if (positionProp) {
                    // If it is 3D or 2D, wiggle works out-of-the-box
                    positionProp.expression = "wiggle(" + SHAKE_FREQUENCY + ", " + SHAKE_AMPLITUDE + ");";
                    writeLog("Applied shake wiggle(" + SHAKE_FREQUENCY + ", " + SHAKE_AMPLITUDE + ") to layer: " + layer.name);
                }
            } catch (eExpr) {
                writeLog("ERROR applying shake expression to layer: " + layer.name + " - " + eExpr.toString());
            }
        }
        
        writeLog("Preset de Shake aplicado com sucesso na composicao duplicada: " + newComp.name);
    });
})();
