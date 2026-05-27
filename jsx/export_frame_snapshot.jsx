// Export Active Frame Snapshot Script
#include "utils/json.jsx"
#include "utils/safe.jsx"

(function() {
    writeLog("Starting export_frame_snapshot...");
    
    var project = app.project;
    if (!project) {
        writeLog("ERROR: No active project found.");
        return;
    }
    
    var root = getProjectRootDir();
    var dataFolder = new Folder(root.fsName + "/data");
    
    // Default request details
    var request = {
        outputFolder: dataFolder.fsName + "/visual_snapshots",
        timestamp: ""
    };
    
    // Read request file
    try {
        var reqFile = new File(dataFolder.fsName + "/snapshot_request.json");
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
        writeLog("WARNING: Failed to parse snapshot_request.json, using defaults.");
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
        var errFile = new File(outputDir.fsName + "/snapshot_context.json");
        try {
            errFile.open("w");
            errFile.encoding = "UTF-8";
            errFile.write(JSON.stringify(errPayload));
            errFile.close();
            writeLog("ERROR written to snapshot_context.json: " + message);
        } catch(e) {
            writeLog("CRITICAL: Failed to write error snapshot_context.json: " + e.toString());
        }
    }
    
    // Check active comp
    var comp = checkActiveComp();
    if (!comp) {
        writeError("NO_ACTIVE_COMP", "No active composition selected.", "Open or select a composition before exporting a frame snapshot.");
        return;
    }
    
    var pngName = "current_frame.png";
    var pngFile = new File(outputDir.fsName + "/" + pngName);
    
    // Perform PNG export
    var snapshotSuccess = false;
    var snapshotError = "";
    try {
        comp.saveFrameToPng(comp.time, pngFile);
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
            snapshotSuccess = true;
            writeLog("Successfully saved frame to PNG: " + pngFile.fsName);
        } else {
            snapshotError = "PNG file was not created or has 0 bytes after polling.";
            writeLog("ERROR: " + snapshotError);
        }
    } catch(err) {
        snapshotError = err.toString();
        writeLog("ERROR exporting frame snapshot: " + snapshotError);
    }
    
    if (!snapshotSuccess) {
        writeError("PNG_EXPORT_FAILED", "Failed to save frame to PNG: " + snapshotError, "Check system permissions and that composition has valid renderable content.");
        return;
    }
    
    // Prepare successful context
    var date = new Date();
    var dateStr = date.toISOString ? date.toISOString() : date.toString();
    
    var contextData = {
        status: "success",
        createdAt: dateStr,
        projectName: project.file ? project.file.name : "Unsaved Project",
        projectPath: project.file ? project.file.fsName : "",
        compName: comp.name,
        compId: comp.id,
        currentTime: comp.time,
        frameRate: comp.frameRate,
        width: comp.width,
        height: comp.height,
        duration: comp.duration,
        workAreaStart: comp.workAreaStart,
        workAreaDuration: comp.workAreaDuration,
        outputPath: pngFile.fsName,
        visualContextType: "current_frame",
        note: "Static frame exported for AI visual review"
    };
    
    // Write success context.json
    try {
        var contextFile = new File(outputDir.fsName + "/snapshot_context.json");
        contextFile.open("w");
        contextFile.encoding = "UTF-8";
        contextFile.write(JSON.stringify(contextData));
        contextFile.close();
        writeLog("Successfully exported snapshot context metadata to: " + contextFile.fsName);
    } catch(err) {
        writeLog("ERROR writing snapshot_context.json: " + err.toString());
    }
})();
