// Preset: MMV Zoom Impact Selected Layers
#include "../utils/json.jsx"
#include "../utils/safe.jsx"

// --- Preset parameters (Easily adjustable) ---
var PEAK_SCALE_MULTIPLIER = 1.35; // Peak scale multiplier (35% scale increase)
var POSITION_IMPACT_Y = 15;       // Pixels to drop on Y axis during impact
var PEAK_TIME_OFFSET = 0.08;      // Time in seconds to reach peak (approx 2.5 frames at 30fps)
var IMPACT_DURATION = 0.3;        // Total duration of the impact animation in seconds

// Helper function to set temporal easing on a keyframe index
function setKeyframeEasing(prop, keyIdx, influence) {
    try {
        var val = prop.value;
        if (val && val.length !== undefined) {
            // Multi-dimensional property (e.g. Scale, Position)
            var easeArr = [];
            for (var i = 0; i < val.length; i++) {
                easeArr.push(new KeyframeEase(0, influence));
            }
            prop.setTemporalEaseAtKey(keyIdx, easeArr, easeArr);
        } else {
            // One-dimensional property (e.g. Opacity)
            var ease = new KeyframeEase(0, influence);
            prop.setTemporalEaseAtKey(keyIdx, [ease], [ease]);
        }
    } catch (eEase) {
        writeLog("Failed to set easing on key index " + keyIdx + ": " + eEase.toString());
    }
}

(function() {
    writeLog("Starting preset: zoom_impact_selected...");
    var comp = checkActiveComp();
    if (!comp) {
        alert("Nenhuma composicao ativa encontrada.");
        return;
    }
    
    var selectedIndices = getSelectedLayerIndices(comp);
    if (selectedIndices.length === 0) {
        alert("Por favor, selecione pelo menos um layer para aplicar o zoom impact.");
        writeLog("WARNING: No layers selected for preset: zoom_impact_selected");
        return;
    }
    
    wrapUndoGroup("MMV Zoom Impact Selected Layers", function() {
        // Safe duplication of the composition
        var newComp = duplicateCompSafely(comp, "_AI_ZoomImpact");
        
        // Retrieve the corresponding layers in the new composition
        var targetLayers = getLayersByIndices(newComp, selectedIndices);
        
        var tStart = newComp.time;
        var tPeak = tStart + PEAK_TIME_OFFSET;
        var tEnd = tStart + IMPACT_DURATION;
        
        for (var i = 0; i < targetLayers.length; i++) {
            var layer = targetLayers[i];
            
            // 1. Apply keyframed Scale impact
            try {
                var scaleProp = layer.property("ADBE Transform Group").property("ADBE Scale");
                if (scaleProp) {
                    var originalScale = scaleProp.value;
                    var peakScale = [];
                    for (var sIdx = 0; sIdx < originalScale.length; sIdx++) {
                        peakScale.push(originalScale[sIdx] * PEAK_SCALE_MULTIPLIER);
                    }
                    
                    // Write keyframes
                    scaleProp.setValueAtTime(tStart, originalScale);
                    scaleProp.setValueAtTime(tPeak, peakScale);
                    scaleProp.setValueAtTime(tEnd, originalScale);
                    
                    // Ease keyframes
                    var k1 = scaleProp.nearestKeyIndex(tStart);
                    var k2 = scaleProp.nearestKeyIndex(tPeak);
                    var k3 = scaleProp.nearestKeyIndex(tEnd);
                    
                    setKeyframeEasing(scaleProp, k1, 33);
                    setKeyframeEasing(scaleProp, k2, 75); // Stronger peak easing
                    setKeyframeEasing(scaleProp, k3, 33);
                    
                    writeLog("Applied Scale keyframes to layer: " + layer.name);
                }
            } catch (eScale) {
                writeLog("ERROR applying Scale preset: " + eScale.toString());
            }
            
            // 2. Apply keyframed Position impact
            try {
                var positionProp = layer.property("ADBE Transform Group").property("ADBE Position");
                // Do not apply position impact to 3D/2D layers if position property is separate (Separated Dimensions)
                if (positionProp && !positionProp.dimensionsSeparated) {
                    var originalPos = positionProp.value;
                    var peakPos = [];
                    for (var pIdx = 0; pIdx < originalPos.length; pIdx++) {
                        peakPos.push(originalPos[pIdx]);
                    }
                    if (peakPos.length > 1) {
                        peakPos[1] = peakPos[1] + POSITION_IMPACT_Y; // Drop down Y axis
                    }
                    
                    // Write keyframes
                    positionProp.setValueAtTime(tStart, originalPos);
                    positionProp.setValueAtTime(tPeak, peakPos);
                    positionProp.setValueAtTime(tEnd, originalPos);
                    
                    // Ease keyframes
                    var kp1 = positionProp.nearestKeyIndex(tStart);
                    var kp2 = positionProp.nearestKeyIndex(tPeak);
                    var kp3 = positionProp.nearestKeyIndex(tEnd);
                    
                    setKeyframeEasing(positionProp, kp1, 33);
                    setKeyframeEasing(positionProp, kp2, 75);
                    setKeyframeEasing(positionProp, kp3, 33);
                    
                    writeLog("Applied Position keyframes to layer: " + layer.name);
                }
            } catch (ePos) {
                writeLog("ERROR applying Position preset: " + ePos.toString());
            }
        }
        
        alert("Preset de Zoom Impact aplicado com sucesso na composicao duplicada: " + newComp.name);
    });
})();
