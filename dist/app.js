"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const alert_1 = require("./emails/alert");
const ArcGISServerApi_1 = require("./loaders/ArcGISServerApi");
const commonApi = __importStar(require("./loaders/commonApi"));
let args = process.argv.slice(2);
console.log(args);
switch (args[0]) {
    case "ArcGIS": {
        ArcGISServerApi_1.runApiTestingFromArcGISServer();
        break;
    }
    case "ArcGISList": {
        ArcGISServerApi_1.organizeAPIList();
        break;
    }
    case "DBforTest": {
        commonApi.runApiTestingFromDB_forDev().then((ApiArray) => {
            Promise.all(ApiArray.map((p) => p.apply(this))).then((arr) => {
                alert_1.sendErrorMail(arr);
            });
        });
        break;
    }
    default: {
        commonApi.runApiTestingFromDB().then((ApiArray) => {
            Promise.all(ApiArray.map((p) => p.apply(this))).then((arr) => {
                alert_1.sendErrorMail(arr);
            });
        });
        break;
    }
}
