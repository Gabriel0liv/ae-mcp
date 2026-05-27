// Export Timeline Frames Script
#include "utils/json.jsx"
#include "utils/safe.jsx"

(function() {
    writeLog("Starting export_timeline_frames...");
    
    var project = app.project;
    if (!project) {
        writeLog("ERROR: No active project found.");
        return;
    }
    
    var root = getProjectRootDir();
    var dataFolder = new Folder(root.fsName + "/data");
    
    // Default request details
    var request = {
        outputFolder: dataFolder.fsName + "/visual_snapshots/frames",
        timestamp: ""
    };
    
    // Read request file
    try {
        var reqFile = new File(dataFolder.fsName + "/timeline_request.json");
        if (reqFile.exists) {
            reqFile.open("r");
            var text = reqFile.read();
            reqFile.close();
            var parsed = JSON.parse(text);
            if (parsed) {
                if (parsed.outputFolder !== undefined) request.outputFolder = parsed.outputFolder.toString();
                if (parsed.timestamp !== undefined) request.timestamp = parsed.timestamp.toString();
            }
        }
    } catch(e) {
        writeLog("WARNING: Failed to parse timeline_request.json, using defaults.");
    }
    
    var outputDir = new Folder(request.outputFolder);
    if (!outputDir.exists) {
        outputDir.create();
    }
    
    function writeError(code, message, suggestedFix) {
        var errPayload = {
            status: "error",
            code: code,
            message: message,
            suggestedFix: suggestedFix
        };
        var errFile = new File(outputDir.fsName + "/frames_context.json");
        try {
            errFile.open("w");
            errFile.encoding = "UTF-8";
            errFile.write(JSON.stringify(errPayload));
            errFile.close();
            writeLog("ERROR written to frames_context.json: " + message);
        } catch(e) {
            writeLog("CRITICAL: Failed to write error frames_context.json: " + e.toString());
        }
    }
    
    // Check active comp
    var comp = checkActiveComp();
    if (!comp) {
        writeError("NO_ACTIVE_COMP", "No active composition selected.", "Open or select a composition before exporting timeline frames.");
        return;
    }
    
    var originalCompTime = comp.time;
    var compTimeRestored = false;
    var restoreError = "";
    
    var requested = [];
    
    // 1. Work area start
    var startT = comp.workAreaStart;
    requested.push({ label: "start_frame.png", time: startT, reason: "work_area_start" });
    
    // 2. Work area middle
    var midT = comp.workAreaStart + (comp.workAreaDuration / 2);
    requested.push({ label: "mid_frame.png", time: midT, reason: "work_area_mid" });
    
    // 3. Work area end (using last valid frame: workAreaStart + workAreaDuration - frameDuration)
    var endT = comp.workAreaStart + comp.workAreaDuration - comp.frameDuration;
    if (endT > comp.duration) endT = comp.duration;
    if (endT < 0) endT = 0;
    requested.push({ label: "end_frame.png", time: endT, reason: "work_area_end" });
    
    // 4. Current time
    requested.push({ label: "current_frame.png", time: comp.time, reason: "current_time" });
    
    // 5. Composition markers (up to 10)
    try {
        if (comp.markerProperty && comp.markerProperty.numKeys > 0) {
            var limitMarkers = Math.min(comp.markerProperty.numKeys, 10);
            for (var m = 1; m <= limitMarkers; m++) {
                var markerT = comp.markerProperty.keyTime(m);
                var comment = comp.markerProperty.keyValue(m).comment || "";
                var idxStr = ("00" + m).slice(-3);
                requested.push({
                    label: "marker_" + idxStr + ".png",
                    time: markerT,
                    reason: "marker",
                    comment: comment
                });
            }
        }
    } catch (e) {
        writeLog("WARNING: Marker access error: " + e.toString());
    }
    
    // Deduplicate by frame number
    var deduped = [];
    var frameSet = {};
    
    for (var k = 0; k < requested.length; k++) {
        var req = requested[k];
        var timeVal = req.time;
        if (timeVal < 0) timeVal = 0;
        if (timeVal > comp.duration) timeVal = comp.duration;
        
        var frameNum = Math.round(timeVal * comp.frameRate);
        var exactTime = frameNum / comp.frameRate;
        
        var frameNumStr = frameNum.toString();
        if (!frameSet[frameNumStr]) {
            frameSet[frameNumStr] = true;
            deduped.push({
                frameNumber: frameNum,
                time: exactTime,
                label: req.label,
                reason: req.reason,
                comment: req.comment || ""
            });
        } else {
            writeLog("Skipping duplicate frame at index " + frameNumStr + " (label: " + req.label + ")");
        }
    }
    
    var successfulFrames = [];
    var missingFrames = [];
    
    // Frame generation wrapped in try/catch/finally
    try {
        for (var d = 0; d < deduped.length; d++) {
            var item = deduped[d];
            var pngFile = new File(outputDir.fsName + "/" + item.label);
            
            try {
                comp.time = item.time;
                comp.saveFrameToPng(item.time, pngFile);
                
                var exportOk = false;
                var retries = 10;
                while (retries > 0) {
                    var verifyFile = new File(pngFile.fsName);
                    if (verifyFile.exists && verifyFile.length > 0) {
                        exportOk = true;
                        break;
                    }
                    $.sleep(200);
                    retries--;
                }
                
                if (exportOk) {
                    successfulFrames.push({
                        frameNumber: item.frameNumber,
                        time: item.time,
                        label: item.label,
                        reason: item.reason,
                        fileName: item.label,
                        success: true
                    });
                    writeLog("Successfully saved frame: " + item.label);
                } else {
                    throw new Error("File was not created on disk or is empty after polling.");
                }
            } catch(frameErr) {
                missingFrames.push({
                    frameNumber: item.frameNumber,
                    time: item.time,
                    label: item.label,
                    reason: item.reason,
                    fileName: item.label,
                    success: false,
                    error: frameErr.toString()
                });
                writeLog("Failed to export timeline frame " + item.label + ": " + frameErr.toString());
            }
        }
    } catch(generalErr) {
        writeLog("CRITICAL error in frame export loop: " + generalErr.toString());
    } finally {
        // Guaranteed restoration of composition playhead time
        try {
            comp.time = originalCompTime;
            compTimeRestored = true;
            writeLog("Restored composition playhead time to: " + originalCompTime);
        } catch(restErr) {
            restoreError = restErr.toString();
            writeLog("ERROR restoring composition playhead time: " + restoreError);
        }
    }
    
    // Write frames_context.json
    var date = new Date();
    var dateStr = date.toISOString ? date.toISOString() : date.toString();
    
    var contextData = {
        createdAt: dateStr,
        projectName: project.file ? project.file.name : "Unsaved Project",
        compName: comp.name,
        outputFolder: outputDir.fsName,
        successfulFrames: successfulFrames,
        missingFrames: missingFrames,
        visualContextType: "timeline_frames",
        originalCompTime: originalCompTime,
        restoredCompTime: comp.time,
        compTimeRestored: compTimeRestored
    };
    
    if (restoreError !== "") {
        contextData.restoreError = restoreError;
    }
    
    try {
        var contextFile = new File(outputDir.fsName + "/frames_context.json");
        contextFile.open("w");
        contextFile.encoding = "UTF-8";
        contextFile.write(JSON.stringify(contextData));
        contextFile.close();
        writeLog("Successfully wrote frames_context.json to: " + contextFile.fsName);
    } catch(err) {
        writeLog("ERROR writing frames_context.json: " + err.toString());
    }
})();
