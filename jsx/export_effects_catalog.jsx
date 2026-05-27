// Export Effects Catalog Script
#include "utils/json.jsx"
#include "utils/safe.jsx"

(function() {
    writeLog("Starting export_effects_catalog...");
    
    var catalog = {
        appVersion: app.version,
        appBuildName: app.buildName ? app.buildName : "Unknown",
        appBuildNumber: app.buildNumber ? app.buildNumber : 0,
        appIsoLanguage: app.isoLanguage ? app.isoLanguage : "Unknown",
        effects: []
    };
    
    try {
        if (app.effects && app.effects.length !== undefined) {
            for (var i = 0; i < app.effects.length; i++) {
                var fx = app.effects[i];
                if (fx) {
                    catalog.effects.push({
                        displayName: fx.displayName ? fx.displayName : "",
                        category: fx.category ? fx.category : "Unknown",
                        matchName: fx.matchName ? fx.matchName : "",
                        version: fx.version ? fx.version : ""
                    });
                }
            }
        } else {
            writeLog("WARNING: app.effects collection is not accessible or empty.");
        }
    } catch (eFx) {
        writeLog("ERROR reading app.effects collection: " + eFx.toString());
    }
    
    try {
        var root = getProjectRootDir();
        var dataFolder = new Folder(root.fsName + "/data");
        if (!dataFolder.exists) {
            dataFolder.create();
        }
        var outFile = new File(dataFolder.fsName + "/effects_catalog.json");
        outFile.open("w");
        outFile.write(JSON.stringify(catalog));
        outFile.close();
        writeLog("Successfully exported " + catalog.effects.length + " effects to: " + outFile.fsName);
    } catch (err) {
        writeLog("ERROR writing effects_catalog.json: " + err.toString());
        alert("Erro ao gravar effects_catalog.json: " + err.toString());
    }
})();
