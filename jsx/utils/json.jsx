// ExtendScript JSON encoder utility
// Since ExtendScript (ES3) does not have a native JSON object, we implement a lightweight stringifier.

var JSON_AE = {
    stringify: function(obj) {
        var type = typeof obj;
        if (obj === null) return "null";
        if (type === "undefined") return "null";
        if (type === "number") return isFinite(obj) ? String(obj) : "null";
        if (type === "boolean") return String(obj);
        if (type === "string") {
            return '"' + obj
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t') + '"';
        }
        
        if (type === "object") {
            // Check if it is an array
            if (obj.constructor === Array || Object.prototype.toString.call(obj) === "[object Array]") {
                var arrItems = [];
                for (var i = 0; i < obj.length; i++) {
                    arrItems.push(JSON_AE.stringify(obj[i]));
                }
                return "[" + arrItems.join(",") + "]";
            }
            
            // Check if it is a Date
            if (typeof obj.getTime === "function") {
                return '"' + obj.toUTCString() + '"';
            }
            
            // Ordinary object
            var objItems = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    var val = obj[key];
                    if (typeof val !== "function" && typeof val !== "undefined") {
                        objItems.push('"' + key.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '":' + JSON_AE.stringify(val));
                    }
                }
            }
            return "{" + objItems.join(",") + "}";
        }
        
        return "null";
    }
};

// Also expose as global JSON if not already present
if (typeof JSON === "undefined") {
    JSON = JSON_AE;
}
