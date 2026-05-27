// Helper for render preview prep
#include "json.jsx"
#include "safe.jsx"

(function() {
    var project = app.project;
    var data = {
        projectName: project && project.file ? project.file.name : "Unsaved Project",
        projectPath: project && project.file ? project.file.fsName : "",
        compName: "",
        workAreaStart: 0,
        workAreaDuration: 0,
        frameRate: 24,
        duration: 0
    };
    
    var comp = app.project ? app.project.activeItem : null;
    if (comp && comp instanceof CompItem) {
        data.compName = comp.name;
        data.workAreaStart = comp.workAreaStart;
        data.workAreaDuration = comp.workAreaDuration;
        data.frameRate = comp.frameRate;
        data.duration = comp.duration;
    }
    
    var root = getProjectRootDir();
    var outFile = new File(root.fsName + "/data/render_prep.json");
    try {
        outFile.open("w");
        outFile.encoding = "UTF-8";
        outFile.write(JSON.stringify(data));
        outFile.close();
    } catch(e) {}
})();
