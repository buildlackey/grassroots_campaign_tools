declare var Logger: any;


function CampaignToolsLogger(debug) {
    this.clientMode = (typeof Logger === "undefined");
    if (typeof debug === "boolean") {
        this.isEnabled = debug;
    } else if (this.clientMode) {
        this.isEnabled = CampaignToolsLogger.isLoggingEnabledFromLocalConfig();
    } else {
        this.isEnabled = false;
    }
}

CampaignToolsLogger.isLoggingEnabledFromLocalConfig = function() {
    try {
        if (typeof require === "function" && typeof process !== "undefined" && process.env && process.env.HOME) {
            var fs = require("fs");
            var path = require("path");
            var configPath = path.join(process.env.HOME, ".campaign", "test-config.json");
            var raw = fs.readFileSync(configPath, "utf8");
            var cfg = JSON.parse(raw);
            return !!cfg.emitLogs;
        }
    } catch (e) {}
    return false;
};

CampaignToolsLogger.prototype.log = function(message, args) {
    if (!this.isEnabled) return;
    if (this.clientMode) {
        console.log(message);
        if (args && args.length) {
            for (var i = 0; i < args.length; i++) {
                console.log(args[i]);
            }
        }
    } else {
        var fullMsg = message;
        if (args && args.length) {
            for (var j = 0; j < args.length; j++) {
                fullMsg += " " + args[j];
            }
        }
        Logger.log(fullMsg);
    }
};

CampaignToolsLogger.prototype.log2 = function(message, args) {
    if (!this.isEnabled) return;
    var callSite = '';
    // Avoid stack parsing for GAS
    if (this.clientMode) {
        console.log(message);
        if (args && args.length) {
            args.forEach(function(arg) {
                console.log(arg);
            });
        }
    } else {
        var fullMsg = message;
        if (args && args.length) {
            args.forEach(function(arg) {
                fullMsg += " " + arg;
            });
        }
        Logger.log(fullMsg);
    }
};

CampaignToolsLogger.prototype.ping = function() {
    return 'success';
};

(window as any).CAMPAIGN = (window as any).CAMPAIGN || {};
(window as any).CAMPAIGN.CampaignToolsLogger = CampaignToolsLogger;
