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

// Helper to find keyframe index at a specific time with tolerance
function findKeyAtTime(prop, time, tolerance) {
    if (!prop || prop.numKeys === 0) return 0;
    var tol = tolerance !== undefined ? tolerance : 0.01;
    for (var i = 1; i <= prop.numKeys; i++) {
        if (Math.abs(prop.keyTime(i) - time) <= tol) {
            return i;
        }
    }
    return 0;
}

(function() {
    writeLog("Starting preset: zoom_impact_selected...");
    var comp = checkActiveComp();
    if (!comp) {
        return;
    }
    
    var err = requireSelectedLayers(comp, "zoom-impact");
    if (err) {
        return;
    }
    
    var selectedIndices = getSelectedLayerIndices(comp);
    
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
                    var k1 = findKeyAtTime(scaleProp, tStart);
                    var k2 = findKeyAtTime(scaleProp, tPeak);
                    var k3 = findKeyAtTime(scaleProp, tEnd);
                    
                    if (k1 > 0) setKeyframeEasing(scaleProp, k1, 33);
                    if (k2 > 0) setKeyframeEasing(scaleProp, k2, 75); // Stronger peak easing
                    if (k3 > 0) setKeyframeEasing(scaleProp, k3, 33);
                    
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
                    var kp1 = findKeyAtTime(positionProp, tStart);
                    var kp2 = findKeyAtTime(positionProp, tPeak);
                    var kp3 = findKeyAtTime(positionProp, tEnd);
                    
                    if (kp1 > 0) setKeyframeEasing(positionProp, kp1, 33);
                    if (kp2 > 0) setKeyframeEasing(positionProp, kp2, 75);
                    if (kp3 > 0) setKeyframeEasing(positionProp, kp3, 33);
                    
                    writeLog("Applied Position keyframes to layer: " + layer.name);
                }
            } catch (ePos) {
                writeLog("ERROR applying Position preset: " + ePos.toString());
            }
        }
        
        writeLog("Preset de Zoom Impact aplicado com sucesso na composicao duplicada: " + newComp.name);
    });
})();
