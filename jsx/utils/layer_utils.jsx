// ExtendScript Layer Utilities

// Helper to determine the approximate layer type
function getLayerType(layer) {
    if (layer instanceof TextLayer) return "Text";
    if (layer instanceof CameraLayer) return "Camera";
    if (layer instanceof LightLayer) return "Light";
    
    // Check for ShapeLayer (available in newer AE versions, otherwise fallback)
    if (typeof ShapeLayer !== "undefined" && layer instanceof ShapeLayer) return "Shape";
    
    if (layer instanceof AVLayer) {
        if (layer.nullLayer) return "Null";
        if (layer.adjustmentLayer) return "Adjustment";
        if (layer.source === null) {
            // Check shape group if ShapeLayer wasn't matched above
            if (layer.property("ADBE Root Vectors Group") !== null) {
                return "Shape";
            }
            return "Solid (No Source)";
        }
        if (layer.source instanceof CompItem) return "Precomp";
        return "Footage/Solid";
    }
    
    return "Unknown";
}

// Helper to get lists of effect names on a layer
function getLayerEffects(layer) {
    var list = [];
    try {
        var effectGroup = layer.property("ADBE Effect Group");
        if (effectGroup !== null) {
            for (var i = 1; i <= effectGroup.numProperties; i++) {
                list.push(effectGroup.property(i).name);
            }
        }
    } catch (e) {
        // Fail silently
    }
    return list;
}

// Helper to get lists of mask names on a layer
function getLayerMasks(layer) {
    var list = [];
    try {
        var maskGroup = layer.property("ADBE Mask Group");
        if (maskGroup !== null) {
            for (var i = 1; i <= maskGroup.numProperties; i++) {
                list.push(maskGroup.property(i).name);
            }
        }
    } catch (e) {
        // Fail silently
    }
    return list;
}

// Check if a specific property has an active expression
function isPropertyExprEnabled(prop) {
    try {
        return prop && prop.expressionEnabled;
    } catch (e) {
        return false;
    }
}

// Check if any major transform properties have expressions
function hasTransformExpression(layer) {
    try {
        var transform = layer.property("ADBE Transform Group");
        if (!transform) return false;
        for (var i = 1; i <= transform.numProperties; i++) {
            var prop = transform.property(i);
            if (isPropertyExprEnabled(prop)) return true;
        }
    } catch (e) {
        // Fail silently
    }
    return false;
}

// Serialize keyframes and value for a single property
function serializeProperty(prop) {
    if (!prop) return null;
    
    var data = {
        name: prop.name,
        hasExpression: false,
        expression: "",
        isKeyframed: prop.numKeys > 0,
        value: null
    };
    
    try {
        data.hasExpression = prop.expressionEnabled;
        data.expression = prop.expressionEnabled ? prop.expression : "";
    } catch (e) {
        // Property might not support expressions
    }
    
    try {
        if (prop.value !== undefined) {
            data.value = prop.value;
        } else {
            // For complex properties, read value at current time
            data.value = prop.valueAtTime(0, true);
        }
        
        // If the value is a 3D/2D array, convert it to a standard JS array
        if (data.value && data.value.length !== undefined) {
            var valArr = [];
            for (var i = 0; i < data.value.length; i++) {
                valArr.push(data.value[i]);
            }
            data.value = valArr;
        }
    } catch (e) {
        data.value = "Unreadable";
    }
    
    if (prop.numKeys > 0) {
        data.keyframes = [];
        for (var k = 1; k <= prop.numKeys; k++) {
            try {
                var kTime = prop.keyTime(k);
                var kVal = prop.keyValue(k);
                
                if (kVal && kVal.length !== undefined) {
                    var kValArr = [];
                    for (var valIdx = 0; valIdx < kVal.length; valIdx++) {
                        kValArr.push(kVal[valIdx]);
                    }
                    kVal = kValArr;
                }
                
                var interpIn = "Unknown";
                var interpOut = "Unknown";
                
                // Keyframes can have interpolation types
                try {
                    interpIn = String(prop.keyInInterpolationType(k));
                    interpOut = String(prop.keyOutInterpolationType(k));
                } catch (eInterp) {}
                
                data.keyframes.push({
                    time: kTime,
                    value: kVal,
                    inInterpolation: interpIn,
                    outInterpolation: interpOut
                });
            } catch (eKey) {
                // Ignore corrupt keyframe reading
            }
        }
    }
    
    return data;
}

// Get standard transform data for a layer
function getLayerTransforms(layer) {
    var transforms = {};
    try {
        var transformGroup = layer.property("ADBE Transform Group");
        if (transformGroup !== null) {
            var props = ["ADBE Anchor Point", "ADBE Position", "ADBE Scale", "ADBE Rotation", "ADBE Opacity"];
            for (var i = 0; i < props.length; i++) {
                var prop = transformGroup.property(props[i]);
                if (prop) {
                    transforms[prop.name] = serializeProperty(prop);
                }
            }
        }
    } catch (e) {
        // Fail silently
    }
    return transforms;
}
