// Export Composition Diagnostics Script
#include "utils/json.jsx"
#include "utils/safe.jsx"

(function() {
    writeLog("Starting export_diagnostics...");
    
    var comp = checkActiveComp();
    if (!comp) {
        writeLog("ERROR: No active composition found for diagnostics.");
        return;
    }
    
    var data = {
        diagnosticScope: comp.name,
        summary: {
            errors: 0,
            warnings: 0,
            info: 0
        },
        diagnostics: []
    };
    
    // Recursive property scanner for expression errors, keyframe proximity, and easing
    function scanProperties(propParent, layer) {
        if (!propParent) return;
        try {
            for (var i = 1; i <= propParent.numProperties; i++) {
                var prop = propParent.property(i);
                if (prop instanceof Property) {
                    // Check expression error
                    if (prop.expressionEnabled && prop.expressionError !== "") {
                        data.diagnostics.push({
                            severity: "error",
                            confidence: "high",
                            code: "EXPRESSION_ERROR",
                            message: "Erro na expressão da propriedade '" + prop.name + "' no layer '" + layer.name + "': " + prop.expressionError,
                            layerIndex: layer.index,
                            layerName: layer.name,
                            propertyPath: propParent.name + " > " + prop.name,
                            suggestedFix: "Corrija a sintaxe da expressão ou nomes de layers referenciados, ou clique no '=' para desativar a expressão."
                        });
                        data.summary.errors++;
                    }
                    
                    // Check keyframes proximity and lack of easing
                    if (prop.numKeys > 1) {
                        var tooClose = false;
                        var noEasing = true;
                        for (var k = 1; k < prop.numKeys; k++) {
                            var t1 = prop.keyTime(k);
                            var t2 = prop.keyTime(k + 1);
                            var diff = t2 - t1;
                            if (diff <= (1.0 / comp.frameRate) + 0.001) {
                                tooClose = true;
                            }
                            if (prop.keyOutInterpolationType(k) !== KeyframeInterpolationType.LINEAR ||
                                prop.keyInInterpolationType(k + 1) !== KeyframeInterpolationType.LINEAR) {
                                noEasing = false;
                            }
                        }
                        
                        if (tooClose) {
                            data.diagnostics.push({
                                severity: "info",
                                confidence: "medium",
                                code: "KEYFRAMES_TOO_CLOSE",
                                message: "Keyframes muito próximos detectados na propriedade '" + prop.name + "' do layer '" + layer.name + "'.",
                                layerIndex: layer.index,
                                layerName: layer.name,
                                propertyPath: propParent.name + " > " + prop.name,
                                suggestedFix: "Ajuste o espaçamento dos keyframes na timeline para evitar animações imperceptíveis ou trancos indesejados."
                            });
                            data.summary.info++;
                        }
                        if (noEasing && (prop.name === "Position" || prop.name === "Scale" || prop.name === "Rotation" || prop.name === "Posição" || prop.name === "Escala" || prop.name === "Rotação")) {
                            data.diagnostics.push({
                                severity: "info",
                                confidence: "medium",
                                code: "KEYFRAMES_NO_EASING",
                                message: "Keyframes sem atenuação (interpolação linear) detectados na propriedade '" + prop.name + "' do layer '" + layer.name + "'.",
                                layerIndex: layer.index,
                                layerName: layer.name,
                                propertyPath: propParent.name + " > " + prop.name,
                                suggestedFix: "Selecione os keyframes, pressione F9 (Easy Ease) e edite as curvas no gráfico de velocidade para obter acelerações suaves."
                            });
                            data.summary.info++;
                        }
                    }
                } else if (prop instanceof PropertyGroup) {
                    scanProperties(prop, layer);
                }
            }
        } catch(err) {
            // Safe fallback
        }
    }
    
    // Scan each layer
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        
        // 1. Layer disabled
        if (!layer.enabled) {
            data.diagnostics.push({
                severity: "warning",
                confidence: "high",
                code: "LAYER_DISABLED",
                message: "O layer '" + layer.name + "' está desativado (visibilidade desligada).",
                layerIndex: layer.index,
                layerName: layer.name,
                propertyPath: "Layer > Enabled",
                suggestedFix: "Ative a visualização do layer clicando na caixa de olho na timeline."
            });
            data.summary.warnings++;
        }
        
        // 2. Opacity is statically zero
        try {
            if (layer.transform && layer.transform.opacity) {
                var opacityProp = layer.transform.opacity;
                if (opacityProp.value === 0 && opacityProp.numKeys === 0 && !opacityProp.expressionEnabled) {
                    data.diagnostics.push({
                        severity: "warning",
                        confidence: "high",
                        code: "LAYER_OPACITY_ZERO",
                        message: "O layer '" + layer.name + "' possui opacidade definida estaticamente como 0%.",
                        layerIndex: layer.index,
                        layerName: layer.name,
                        propertyPath: "Transform > Opacity",
                        suggestedFix: "Aumente o valor de opacidade ou delete o layer se ele não estiver sendo usado."
                    });
                    data.summary.warnings++;
                }
            }
        } catch(err) {}
        
        // 3. Locked status
        if (layer.locked) {
            data.diagnostics.push({
                severity: "info",
                confidence: "high",
                code: "LAYER_LOCKED",
                message: "O layer '" + layer.name + "' está bloqueado.",
                layerIndex: layer.index,
                layerName: layer.name,
                propertyPath: "Layer > Locked",
                suggestedFix: "Desbloqueie o layer clicando no cadeado na timeline se precisar fazer alterações."
            });
            data.summary.info++;
        }
        
        // 4. Shy status
        if (layer.shy) {
            data.diagnostics.push({
                severity: "info",
                confidence: "high",
                code: "LAYER_SHY",
                message: "O layer '" + layer.name + "' está oculto via chave Shy.",
                layerIndex: layer.index,
                layerName: layer.name,
                propertyPath: "Layer > Shy",
                suggestedFix: "Desmarque a opção de shy no topo da timeline para visualizar este layer."
            });
            data.summary.info++;
        }
        
        // 5. Solo status
        if (layer.solo) {
            data.diagnostics.push({
                severity: "info",
                confidence: "high",
                code: "LAYER_SOLO",
                message: "O layer '" + layer.name + "' está com chave Solo ativa.",
                layerIndex: layer.index,
                layerName: layer.name,
                propertyPath: "Layer > Solo",
                suggestedFix: "Desative a chave Solo se quiser visualizar os demais layers da composição."
            });
            data.summary.info++;
        }
        
        // 6. Timing out of work area
        var inWorkArea = (layer.inPoint <= comp.workAreaStart + comp.workAreaDuration) && (layer.outPoint >= comp.workAreaStart);
        if (!inWorkArea) {
            data.diagnostics.push({
                severity: "warning",
                confidence: "high",
                code: "LAYER_OUT_OF_WORKAREA",
                message: "O tempo de tela do layer '" + layer.name + "' está totalmente fora da Work Area da composição.",
                layerIndex: layer.index,
                layerName: layer.name,
                propertyPath: "Layer > Timing",
                suggestedFix: "Ajuste os pontos de entrada/saída ou arraste o layer para coincidir com a área de trabalho."
            });
            data.summary.warnings++;
        }
        
        // 7. Layer is too short (less than 3 frames at 30fps)
        if (layer.outPoint - layer.inPoint < 0.1) {
            data.diagnostics.push({
                severity: "warning",
                confidence: "medium",
                code: "LAYER_TOO_SHORT",
                message: "O layer '" + layer.name + "' possui duração extremamente curta (menos de 0.1 segundos).",
                layerIndex: layer.index,
                layerName: layer.name,
                propertyPath: "Layer > Duration",
                suggestedFix: "Aumente a duração da camada arrastando suas bordas laterais na timeline."
            });
            data.summary.warnings++;
        }
        
        // 8. Extreme scale
        try {
            if (layer.transform && layer.transform.scale) {
                var scaleProp = layer.transform.scale;
                var scaleVal = scaleProp.value;
                if (scaleVal[0] > 500 || scaleVal[1] > 500 || scaleVal[0] < 1 || scaleVal[1] < 1) {
                    data.diagnostics.push({
                        severity: "warning",
                        confidence: "medium",
                        code: "LAYER_EXTREME_SCALE",
                        message: "O layer '" + layer.name + "' possui escala extrema (" + scaleVal[0] + "%).",
                        layerIndex: layer.index,
                        layerName: layer.name,
                        propertyPath: "Transform > Scale",
                        suggestedFix: "Valores de escala excessivos podem pixelar imagens. Considere pré-compor."
                    });
                    data.summary.warnings++;
                }
            }
        } catch(err) {}
        
        // 9. Extreme rotation
        try {
            if (layer.transform && layer.transform.rotation) {
                var rotProp = layer.transform.rotation;
                if (Math.abs(rotProp.value) > 3600) {
                    data.diagnostics.push({
                        severity: "warning",
                        confidence: "medium",
                        code: "LAYER_EXTREME_ROTATION",
                        message: "O layer '" + layer.name + "' possui rotação excessiva (" + rotProp.value + " graus).",
                        layerIndex: layer.index,
                        layerName: layer.name,
                        propertyPath: "Transform > Rotation",
                        suggestedFix: "Verifique se a rotação é intencional ou simplifique os keyframes."
                    });
                    data.summary.warnings++;
                }
            }
        } catch(err) {}
        
        // 10. Motion blur disabled on moving layer
        try {
            if (layer.canMotionBlur && !layer.motionBlur) {
                var isMoving = false;
                if (layer.transform) {
                    if (layer.transform.position.numKeys > 0 || layer.transform.position.expressionEnabled) isMoving = true;
                    if (layer.transform.scale && (layer.transform.scale.numKeys > 0 || layer.transform.scale.expressionEnabled)) isMoving = true;
                }
                if (isMoving) {
                    data.diagnostics.push({
                        severity: "warning",
                        confidence: "medium",
                        code: "LAYER_MOTION_BLUR_DISABLED",
                        message: "O layer '" + layer.name + "' está se movendo mas o Motion Blur está desligado.",
                        layerIndex: layer.index,
                        layerName: layer.name,
                        propertyPath: "Layer > Motion Blur",
                        suggestedFix: "Ative o interruptor individual de Motion Blur para suavizar movimentos rápidos."
                    });
                    data.summary.warnings++;
                }
            }
        } catch(err) {}
        
        // 11. 3D layer without camera
        if (layer.threeDLayer && !comp.activeCamera) {
            var cameraExists = false;
            for (var j = 1; j <= comp.numLayers; j++) {
                if (comp.layer(j) instanceof CameraLayer) {
                    cameraExists = true;
                    break;
                }
            }
            if (!cameraExists) {
                data.diagnostics.push({
                    severity: "warning",
                    confidence: "high",
                    code: "THREE_D_LAYER_NO_ACTIVE_CAMERA",
                    message: "O layer '" + layer.name + "' está configurado como 3D, mas a composição não possui câmera ativa.",
                    layerIndex: layer.index,
                    layerName: layer.name,
                    propertyPath: "Layer > 3D Spatial",
                    suggestedFix: "Crie uma nova câmera (Layer > New > Camera) para habilitar perspectivas reais."
                });
                data.summary.warnings++;
            }
        }
        
        // 12. Missing footage
        if (layer.source && layer.source instanceof FootageItem && layer.source.footageMissing) {
            data.diagnostics.push({
                severity: "error",
                confidence: "high",
                code: "MISSING_FOOTAGE",
                message: "O arquivo de origem '" + layer.name + "' está offline (ausente).",
                layerIndex: layer.index,
                layerName: layer.name,
                propertyPath: "Layer > Source Path",
                suggestedFix: "Dê um clique duplo sobre a mídia no painel Project para reconectar o arquivo do HD."
            });
            data.summary.errors++;
        }
        
        // 13. Disabled effects
        try {
            if (layer.effect && layer.effect.numProperties > 0) {
                for (var e = 1; e <= layer.effect.numProperties; e++) {
                    var fx = layer.effect.property(e);
                    if (!fx.active) {
                        data.diagnostics.push({
                            severity: "warning",
                            confidence: "high",
                            code: "EFFECTS_DISABLED",
                            message: "O efeito '" + fx.name + "' do layer '" + layer.name + "' está desativado.",
                            layerIndex: layer.index,
                            layerName: layer.name,
                            propertyPath: "Effects > " + fx.name,
                            suggestedFix: "Ative a caixa 'fx' ao lado do efeito no painel de controle se quiser que ele renderize."
                        });
                        data.summary.warnings++;
                    }
                }
            }
        } catch(err) {}
        
        // Scan properties recursively for expression errors and keyframe warnings
        scanProperties(layer, layer);
    }
    
    // 14. Comp motion blur check
    var hasAnyLayerWithBlur = false;
    for (var i = 1; i <= comp.numLayers; i++) {
        if (comp.layer(i).motionBlur) {
            hasAnyLayerWithBlur = true;
            break;
        }
    }
    if (hasAnyLayerWithBlur && !comp.motionBlur) {
        data.diagnostics.push({
            severity: "warning",
            confidence: "high",
            code: "COMP_MOTION_BLUR_DISABLED",
            message: "A composição possui layers com Motion Blur ativo, mas a chave global está desligada.",
            layerIndex: 0,
            layerName: "Composition Global",
            propertyPath: "Composition > Motion Blur",
            suggestedFix: "Clique no ícone de obturador (múltiplos círculos) no topo da timeline para ativar o desfoque global."
        });
        data.summary.warnings++;
    }
    
    // 15. Selected layers missing
    if (comp.selectedLayers.length === 0) {
        data.diagnostics.push({
            severity: "info",
            confidence: "high",
            code: "SELECTED_LAYERS_MISSING",
            message: "Não há nenhum layer selecionado na composição ativa.",
            layerIndex: 0,
            layerName: "Composition Selection",
            propertyPath: "Composition > Selection",
            suggestedFix: "Selecione um ou mais layers na timeline antes de rodar comandos de efeitos ou presets rápidos."
        });
        data.summary.info++;
    }
    
    // Write diagnostics.json
    try {
        var root = getProjectRootDir();
        var dataFolder = new Folder(root.fsName + "/data");
        if (!dataFolder.exists) {
            dataFolder.create();
        }
        var outFile = new File(dataFolder.fsName + "/diagnostics.json");
        outFile.open("w");
        outFile.write(JSON.stringify(data));
        outFile.close();
        writeLog("Successfully exported diagnostics for composition '" + comp.name + "' to: " + outFile.fsName);
    } catch(err) {
        writeLog("ERROR writing diagnostics.json: " + err.toString());
        alert("Erro ao gravar diagnostics.json: " + err.toString());
    }
})();
