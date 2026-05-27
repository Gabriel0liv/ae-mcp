// Export Project Summary Script
#include "utils/json.jsx"
#include "utils/safe.jsx"

(function() {
    writeLog("Starting export_project_summary...");
    
    var project = app.project;
    if (!project) {
        writeLog("ERROR: No active project found.");
        return;
    }
    
    var data = {
        projectName: project.file ? project.file.name : "Unsaved Project",
        projectPath: project.file ? project.file.fsName : "",
        totalItems: project.numItems,
        totalComps: 0,
        totalFootage: 0,
        totalFolders: 0,
        totalMissingFootage: 0,
        projectSettings: {
            bitsPerChannel: project.bitsPerChannel ? project.bitsPerChannel : 8,
            workingSpace: project.workingSpace ? project.workingSpace : "None",
            expressionEngine: "ExtendScript",
            gpuAccelType: "Desconhecido"
        },
        comps: [],
        missingFootage: [],
        suggestedMainComps: []
    };
    
    // Check Expression Engine (only available in AE 16.0+)
    try {
        if (project.expressionEngine) {
            data.projectSettings.expressionEngine = project.expressionEngine;
        }
    } catch(err) {}
    
    // Check GPU Acceleration Type if available
    try {
        if (app.gpuAccelType) {
            data.projectSettings.gpuAccelType = app.gpuAccelType.toString();
        }
    } catch(err) {}
    
    // 1. Build precomp usage map to calculate main comp score
    // precompUsedMap[compId] = true if it is used inside another comp
    var precompUsedMap = {};
    
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        if (item instanceof CompItem) {
            data.totalComps++;
            for (var j = 1; j <= item.numLayers; j++) {
                var layer = item.layer(j);
                if (layer.source && layer.source instanceof CompItem) {
                    precompUsedMap[layer.source.id.toString()] = true;
                }
            }
        } else if (item instanceof FootageItem) {
            data.totalFootage++;
            if (item.footageMissing) {
                data.totalMissingFootage++;
                data.missingFootage.push({
                    itemId: item.id,
                    name: item.name,
                    path: item.file ? item.file.fsName : "No path"
                });
            }
        } else if (item instanceof FolderItem) {
            data.totalFolders++;
        }
    }
    
    // Helper to calculate score and reasons for a comp
    function calculateMainCompScore(comp) {
        var score = 0;
        var reasons = [];
        var nameLower = comp.name.toLowerCase();
        
        // 1. Check keywords in name
        var mainKeywords = ["main", "final", "edit", "render", "master", "comp", "cena"];
        var matchedMain = [];
        for (var k = 0; k < mainKeywords.length; k++) {
            if (nameLower.indexOf(mainKeywords[k]) !== -1) {
                matchedMain.push(mainKeywords[k]);
            }
        }
        if (matchedMain.length > 0) {
            score += 50;
            reasons.push("Nome contém palavras-chave principais: " + matchedMain.join(", "));
        }
        
        var precompKeywords = ["precomp", "pre-comp", "asset", "source", "layer"];
        var matchedPre = [];
        for (var p = 0; p < precompKeywords.length; p++) {
            if (nameLower.indexOf(precompKeywords[p]) !== -1) {
                matchedPre.push(precompKeywords[p]);
            }
        }
        if (matchedPre.length > 0) {
            score -= 50;
            reasons.push("Nome contém palavras-chave de sub-composição/asset: " + matchedPre.join(", "));
        }
        
        // 2. Check if used as a precomp
        var compIdStr = comp.id.toString();
        if (!precompUsedMap[compIdStr]) {
            score += 100;
            reasons.push("Não é utilizada como sub-composição (precomp) em nenhuma outra composição.");
        } else {
            reasons.push("É utilizada como sub-composição em outra parte do projeto.");
        }
        
        // 3. Add layers weight
        var layersWeight = comp.numLayers * 2;
        score += layersWeight;
        reasons.push("Pontuação por quantidade de camadas: +" + layersWeight + " (Camadas: " + comp.numLayers + ")");
        
        // 4. Add duration weight
        var durationWeight = Math.round(comp.duration * 0.1 * 10) / 10;
        score += durationWeight;
        reasons.push("Pontuação por duração: +" + durationWeight + " (Duração: " + Math.round(comp.duration) + "s)");
        
        return {
            score: score,
            reasons: reasons
        };
    }
    
    // 2. Gather comp data
    for (var i = 1; i <= project.numItems; i++) {
        var item = project.item(i);
        if (item instanceof CompItem) {
            var comp = item;
            
            var has3DLayers = false;
            var hasCamera = false;
            var hasLights = false;
            var estEffects = 0;
            var estExpressions = 0;
            
            for (var j = 1; j <= comp.numLayers; j++) {
                var layer = comp.layer(j);
                if (layer.threeDLayer) has3DLayers = true;
                if (layer instanceof CameraLayer) hasCamera = true;
                if (layer instanceof LightLayer) hasLights = true;
                
                // Estimate effects
                try {
                    if (layer.effect && layer.effect.numProperties > 0) {
                        estEffects += layer.effect.numProperties;
                    }
                } catch(e) {}
                
                // Estimate expressions
                try {
                    if (layer.transform) {
                        for (var tp = 1; tp <= layer.transform.numProperties; tp++) {
                            if (layer.transform.property(tp).expressionEnabled) {
                                estExpressions++;
                            }
                        }
                    }
                } catch(e) {}
            }
            
            var markers = 0;
            try {
                if (comp.markerProperty) {
                    markers = comp.markerProperty.numKeys;
                }
            } catch(e) {}
            
            var scoreData = calculateMainCompScore(comp);
            
            var compData = {
                compId: comp.id,
                name: comp.name,
                width: comp.width,
                height: comp.height,
                frameRate: comp.frameRate,
                duration: comp.duration,
                numLayers: comp.numLayers,
                workAreaStart: comp.workAreaStart,
                workAreaDuration: comp.workAreaDuration,
                has3DLayers: has3DLayers,
                hasCamera: hasCamera,
                hasLights: hasLights,
                estimatedEffectsCount: estEffects,
                estimatedExpressionsCount: estExpressions,
                markerCount: markers,
                probableMainCompScore: scoreData.score,
                reasons: scoreData.reasons
            };
            
            data.comps.push(compData);
        }
    }
    
    // 3. Determine suggested main comps (sort by score descending)
    var sortedComps = [];
    for (var c = 0; c < data.comps.length; c++) {
        sortedComps.push(data.comps[c]);
    }
    
    sortedComps.sort(function(a, b) {
        return b.probableMainCompScore - a.probableMainCompScore;
    });
    
    var limit = Math.min(sortedComps.length, 3);
    for (var s = 0; s < limit; s++) {
        data.suggestedMainComps.push({
            id: sortedComps[s].compId,
            name: sortedComps[s].name,
            score: sortedComps[s].probableMainCompScore,
            reason: sortedComps[s].reasons
        });
    }
    
    // Write JSON file
    try {
        var root = getProjectRootDir();
        var dataFolder = new Folder(root.fsName + "/data");
        if (!dataFolder.exists) {
            dataFolder.create();
        }
        var outFile = new File(dataFolder.fsName + "/project_summary.json");
        outFile.open("w");
        outFile.write(JSON.stringify(data));
        outFile.close();
        writeLog("Successfully exported project summary to: " + outFile.fsName);
    } catch(err) {
        writeLog("ERROR writing project_summary.json: " + err.toString());
        alert("Erro ao gravar project_summary.json: " + err.toString());
    }
})();
