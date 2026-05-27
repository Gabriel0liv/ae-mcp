// Property Tree Utilities for AE-mcp
// ES3 compatible ExtendScript

function getInterpolationName(typeVal) {
    if (typeof KeyframeInterpolationType !== "undefined") {
        if (typeVal === KeyframeInterpolationType.LINEAR) return "Linear";
        if (typeVal === KeyframeInterpolationType.BEZIER) return "Bezier";
        if (typeVal === KeyframeInterpolationType.HOLD) return "Hold";
    }
    return String(typeVal);
}

function getPropertyPath(prop) {
    if (!prop) return "";
    var path = [];
    var current = prop;
    var count = 0;
    while (current && count < 20) {
        path.unshift(current.name);
        try {
            current = current.parentProperty;
        } catch (e) {
            break;
        }
        count++;
    }
    return path.join(" > ");
}

function safeValuePreview(prop, options) {
    options = options || {};
    var maxStringLength = options.maxStringLength || 300;
    if (!prop || prop.propertyType !== PropertyType.PROPERTY) {
        return "";
    }
    try {
        var val;
        if (prop.value !== undefined) {
            val = prop.value;
        } else {
            val = prop.valueAtTime(0, true);
        }
        
        if (val === null || val === undefined) {
            return "";
        }
        
        // TextDocument check
        if (typeof TextDocument !== "undefined" && val instanceof TextDocument) {
            var textDocSummary = {
                text: val.text ? val.text.substring(0, maxStringLength) : "",
                font: val.font || "",
                fontSize: val.fontSize || 0,
                justification: val.justification ? String(val.justification) : ""
            };
            if (val.fillColor && val.fillColor.length !== undefined) {
                var fc = [];
                for (var i = 0; i < val.fillColor.length; i++) {
                    fc.push(Number((val.fillColor[i]).toFixed(3)));
                }
                textDocSummary.fillColor = fc;
            }
            return textDocSummary;
        }
        
        // Shape check
        if (typeof Shape !== "undefined" && val instanceof Shape) {
            var numVertices = (val.vertices && val.vertices.length) ? val.vertices.length : 0;
            return "[shape path: " + numVertices + " vertices]";
        }
        
        // Array check
        if (val.constructor === Array || Object.prototype.toString.call(val) === "[object Array]" || (val && val.length !== undefined && typeof val !== "string")) {
            var limit = 8;
            var arr = [];
            for (var j = 0; j < val.length; j++) {
                if (j >= limit) {
                    arr.push("...");
                    break;
                }
                var item = val[j];
                if (typeof item === "number") {
                    arr.push(Number(item.toFixed(3)));
                } else {
                    arr.push(String(item));
                }
            }
            return "[" + arr.join(", ") + "]";
        }
        
        if (typeof val === "string") {
            if (val.length > maxStringLength) {
                return val.substring(0, maxStringLength) + "...";
            }
            return val;
        }
        
        if (typeof val === "number") {
            return Number(val.toFixed(3));
        }
        
        if (typeof val === "boolean") {
            return val;
        }
        
        return String(val);
    } catch (e) {
        return "[unsupported: " + e.toString() + "]";
    }
}

function safeExpressionInfo(prop, options) {
    options = options || {};
    var maxStringLength = options.maxStringLength || 300;
    var info = {
        canSetExpression: false,
        hasExpression: false,
        expressionEnabled: false,
        expressionError: "",
        expressionPreview: ""
    };
    if (!prop || prop.propertyType !== PropertyType.PROPERTY) {
        return info;
    }
    try {
        if (prop.canSetExpression) {
            info.canSetExpression = true;
            if (prop.expression && prop.expression !== "") {
                info.hasExpression = true;
                info.expressionEnabled = prop.expressionEnabled;
                var expr = prop.expression;
                if (expr.length > maxStringLength) {
                    info.expressionPreview = expr.substring(0, maxStringLength) + "...";
                } else {
                    info.expressionPreview = expr;
                }
                if (prop.expressionError && prop.expressionError !== "") {
                    info.expressionError = prop.expressionError;
                }
            }
        }
    } catch (e) {
        // Safe fail
    }
    return info;
}

function safeKeyframeSummary(prop, options) {
    options = options || {};
    var maxKeyframes = options.maxKeyframesPerProperty || 20;
    if (!prop || prop.propertyType !== PropertyType.PROPERTY || prop.numKeys === 0) {
        return null;
    }
    var summary = {
        numKeys: prop.numKeys,
        start: 0,
        end: 0,
        interpolations: [],
        keyframes: null
    };
    try {
        var numKeys = prop.numKeys;
        summary.start = prop.keyTime(1);
        summary.end = prop.keyTime(numKeys);
        
        var interMap = {};
        var interpTypes = [];
        for (var k = 1; k <= numKeys; k++) {
            try {
                var inType = prop.keyInInterpolationType(k);
                var outType = prop.keyOutInterpolationType(k);
                var inName = getInterpolationName(inType);
                var outName = getInterpolationName(outType);
                interMap[inName] = true;
                interMap[outName] = true;
            } catch (eInterp) {}
        }
        for (var name in interMap) {
            if (interMap.hasOwnProperty(name)) {
                interpTypes.push(name);
            }
        }
        summary.interpolations = interpTypes;
        
        if (numKeys <= maxKeyframes) {
            var keysDetail = [];
            for (var idx = 1; idx <= numKeys; idx++) {
                try {
                    var kTime = prop.keyTime(idx);
                    var kVal = prop.keyValue(idx);
                    
                    if (kVal && kVal.length !== undefined && typeof kVal !== "string") {
                        var kValArr = [];
                        for (var vi = 0; vi < kVal.length; vi++) {
                            kValArr.push(kVal[vi]);
                        }
                        kVal = kValArr;
                    }
                    
                    keysDetail.push({
                        index: idx,
                        time: kTime,
                        value: kVal,
                        inInterpolation: getInterpolationName(prop.keyInInterpolationType(idx)),
                        outInterpolation: getInterpolationName(prop.keyOutInterpolationType(idx))
                    });
                } catch (eK) {}
            }
            summary.keyframes = keysDetail;
        }
    } catch (e) {
        // Safe fail
    }
    return summary;
}

function scanPropertyTree(propParent, options, depth, state) {
    var children = [];
    if (!propParent) return children;
    if (depth > options.maxDepth) return children;
    
    try {
        var numProps = propParent.numProperties;
        if (numProps === undefined) return children;
        
        for (var i = 1; i <= numProps; i++) {
            if (state.propertiesScanned >= options.maxPropertiesPerLayer) {
                break;
            }
            var childProp = propParent.property(i);
            if (childProp) {
                var childData = scanProperty(childProp, options, depth, state);
                if (childData) {
                    children.push(childData);
                }
            }
        }
    } catch (e) {
        state.scanErrors.push("Error scanning group '" + propParent.name + "': " + e.toString());
    }
    return children;
}

function scanProperty(prop, options, depth, state) {
    if (!prop) return null;
    state.propertiesScanned++;
    
    var type = "UNKNOWN";
    if (prop.propertyType === PropertyType.PROPERTY) {
        type = "PROPERTY";
    } else if (prop.propertyType === PropertyType.INDEXED_GROUP) {
        type = "INDEXED_GROUP";
    } else if (prop.propertyType === PropertyType.NAMED_GROUP) {
        type = "NAMED_GROUP";
    }
    
    var data = {
        name: prop.name,
        matchName: prop.matchName || "",
        propertyType: type,
        propertyValueType: prop.propertyValueType ? String(prop.propertyValueType) : "None",
        children: []
    };
    
    if (prop.propertyType === PropertyType.PROPERTY) {
        try {
            data.canSetExpression = prop.canSetExpression;
            var exprInfo = safeExpressionInfo(prop, options);
            data.hasExpression = exprInfo.hasExpression;
            data.expressionEnabled = exprInfo.expressionEnabled;
            data.expressionError = exprInfo.expressionError;
            data.expressionPreview = exprInfo.expressionPreview;
            
            if (exprInfo.hasExpression) {
                state.expressionCount++;
                if (exprInfo.expressionError !== "") {
                    state.expressionErrorCount++;
                }
            }
            
            data.numKeys = prop.numKeys || 0;
            if (data.numKeys > 0) {
                state.keyframedPropertyCount++;
            }
            
            data.valuePreview = safeValuePreview(prop, options);
            data.keyframeSummary = safeKeyframeSummary(prop, options);
        } catch (e) {
            state.scanErrors.push("Error reading property values for '" + getPropertyPath(prop) + "': " + e.toString());
        }
    } else {
        data.children = scanPropertyTree(prop, options, depth + 1, state);
    }
    
    return data;
}

function getLayerPropertyTree(layer, options) {
    options = options || {};
    var defaultOptions = {
        maxPropertiesPerLayer: 500,
        maxDepth: 8,
        maxParametersPerEffect: 80,
        maxKeyframesPerProperty: 20,
        maxStringLength: 300
    };
    for (var opt in defaultOptions) {
        if (options[opt] === undefined) {
            options[opt] = defaultOptions[opt];
        }
    }
    
    var state = {
        propertiesScanned: 0,
        scanErrors: [],
        expressionCount: 0,
        expressionErrorCount: 0,
        keyframedPropertyCount: 0
    };
    
    var propertyTree = [];
    try {
        var numProps = layer.numProperties;
        if (numProps !== undefined) {
            for (var i = 1; i <= numProps; i++) {
                if (state.propertiesScanned >= options.maxPropertiesPerLayer) {
                    break;
                }
                var prop = layer.property(i);
                if (prop) {
                    var data = scanProperty(prop, options, 1, state);
                    if (data) {
                        propertyTree.push(data);
                    }
                }
            }
        }
    } catch (e) {
        state.scanErrors.push("Error scanning layer root properties: " + e.toString());
    }
    
    return {
        propertyTree: propertyTree,
        state: state
    };
}

function getLayerEffectsDeep(layer, options) {
    options = options || {};
    var maxParams = options.maxParametersPerEffect || 80;
    var effectsList = [];
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
                    
                    var effectData = {
                        index: effect.propertyIndex || i,
                        name: effect.name,
                        matchName: effect.matchName || "",
                        enabled: enabledVal,
                        active: activeVal,
                        numProperties: effect.numProperties || 0,
                        parameters: []
                    };
                    
                    var paramCount = 0;
                    for (var p = 1; p <= effect.numProperties; p++) {
                        if (paramCount >= maxParams) {
                            break;
                        }
                        var param = effect.property(p);
                        if (param) {
                            paramCount++;
                            var paramData = {
                                index: param.propertyIndex || p,
                                name: param.name,
                                matchName: param.matchName || "",
                                valuePreview: "",
                                hasExpression: false,
                                expressionError: "",
                                numKeys: 0
                            };
                            try {
                                if (param.propertyType === PropertyType.PROPERTY) {
                                    var valPrev = safeValuePreview(param, options);
                                    if (typeof valPrev === "object" && valPrev !== null) {
                                        paramData.valuePreview = JSON.stringify(valPrev);
                                    } else {
                                        paramData.valuePreview = String(valPrev);
                                    }
                                    
                                    var exprInfo = safeExpressionInfo(param, options);
                                    paramData.hasExpression = exprInfo.hasExpression;
                                    paramData.expressionError = exprInfo.expressionError;
                                    paramData.numKeys = param.numKeys || 0;
                                }
                            } catch (eParam) {
                                paramData.valuePreview = "[error: " + eParam.toString() + "]";
                            }
                            effectData.parameters.push(paramData);
                        }
                    }
                    effectsList.push(effectData);
                }
            }
        }
    } catch (e) {
        // Fail silently
    }
    return effectsList;
}
