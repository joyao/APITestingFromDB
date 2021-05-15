import { appendFile } from "fs";
import { render } from "mustache";
import { ApiStatus } from "../models/ApiClass";

const writeLogToFile: (text: string) => void = (text: string): void => {
    appendFile("runTesting.log", text, "UTF8", (err): void => {
        if (err) {
            throw err;
        }
        console.log("Log寫入完成!");
    });
};

const writeApiLog: (apistatus: ApiStatus) => void = (apistatus: ApiStatus): void => {
    const logTemplate: string = `{{{LastUpdate}}} {{{APIInfo}}} {{{Name}}} {{Status}} {{DataVerified}} [{{DuringTime}} Sec] | {{{Memo}}}\r\n`;
    const logtext: string = render(logTemplate, apistatus);
    writeLogToFile(logtext);
};

export { writeApiLog };
