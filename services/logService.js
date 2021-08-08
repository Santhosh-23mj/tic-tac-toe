const moment = require('moment');

// On/off switch for logging
const loggingEnabled = true;

// Enforce Logging in multiple levels
const messageTypesToLog = ["debug", "error", "info"];

const logMessageFormatMap = {
    "debug": (message) => {
        console.debug(`[DEBUG] [${moment().format("YYYY-MM-DD HH:mm:ss")}] ${message}`);
    },
    "error": (message) => {
        console.error(`[ERROR] [${moment().format("YYYY-MM-DD HH:mm:ss")}] ${message}`);
    },
    "info": (message) => {
        console.info(`[INFO] [${moment().format("YYYY-MM-DD HH:mm:ss")}] ${message}`);
    }
}

// function to invoke the above log message formatter
function log(message, messageType = "debug") {
    if (loggingEnabled && messageTypesToLog.includes(messageType)) {
        logMessageFormatMap[messageType](message);
    }
}

module.exports.log = log;