// Check Missing Footage Script
#include "utils/json.jsx"
#include "utils/safe.jsx"

(function() {
    writeLog("Starting check_missing_footage...");
    
    var missingItems = [];
    var numItems = app.project.numItems;
    
    for (var i = 1; i <= numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof FootageItem && item.footageMissing) {
            var filePath = "Nenhum caminho de arquivo";
            if (item.file) {
                filePath = item.file.fsName;
            }
            
            missingItems.push({
                id: item.id,
                name: item.name,
                typeName: item.typeName,
                filePath: filePath
            });
        }
    }
    
    try {
        var root = getProjectRootDir();
        var dataFolder = new Folder(root.fsName + "/data");
        if (!dataFolder.exists) {
            dataFolder.create();
        }
        var outFile = new File(dataFolder.fsName + "/missing_footage.json");
        outFile.open("w");
        outFile.write(JSON.stringify(missingItems));
        outFile.close();
        writeLog("Successfully exported missing footage list to: " + outFile.fsName);
    } catch (err) {
        writeLog("ERROR writing missing_footage.json: " + err.toString());
        alert("Erro ao gravar missing_footage.json: " + err.toString());
    }
})();
