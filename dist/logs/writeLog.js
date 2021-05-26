"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeApiLog = void 0;
const fs_1 = require("fs");
const mustache_1 = require("mustache");
const writeLogToFile = (text) => {
    fs_1.appendFile("runTesting.log", text, "UTF8", (err) => {
        if (err) {
            throw err;
        }
        console.log("Log寫入完成!");
    });
};
const writeApiLog = (apistatus) => {
    const logTemplate = `{{{LastUpdate}}} {{{APIInfo}}} {{{Name}}} {{Status}} {{DataVerified}} [{{DuringTime}} Sec] | {{{Memo}}}\r\n`;
    const logtext = mustache_1.render(logTemplate, apistatus);
    writeLogToFile(logtext);
};
exports.writeApiLog = writeApiLog;
