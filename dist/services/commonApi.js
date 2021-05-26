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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkResponse = exports.GPServerRequest = exports.CommonApiRequest = exports.getConfigToken = void 0;
const config = __importStar(require("../config/config"));
const Request_1 = require("../models/Request");
const gpServerApi_1 = require("./gpServerApi");
const getConfigToken = (configString) => __awaiter(void 0, void 0, void 0, function* () {
    switch (configString) {
        case "PRIVATEAPI_TOKEN": {
            return config.PRIVATEAPI_TOKEN;
        }
        case "PUBLICAPI_TOKEN": {
            return config.PUBLICAPI_TOKEN;
        }
        case "ARCGISSERVER_TOKEN": {
            return yield gpServerApi_1.GenerateToken().then((TOKEN) => {
                return { token: TOKEN };
            });
        }
        default: {
            return {};
        }
    }
});
exports.getConfigToken = getConfigToken;
class CommonApiRequest extends Request_1.GoRequest {
    constructor(contentType, url, pathParam, data, method, token) {
        const reqOption = new Request_1.ReqOption(contentType, url, pathParam, data, token);
        super(reqOption, method);
    }
}
exports.CommonApiRequest = CommonApiRequest;
class GPServerRequest extends Request_1.GoRequest {
    constructor(contentType, url, pathParam, data, method, token) {
        const reqOption = new Request_1.ReqOption(contentType, url, pathParam, data, token);
        super(reqOption, method);
    }
    // override GoRequest's method
    RunRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield gpServerApi_1.gpServerPostRequest(this.reqOption).then((res) => {
                return res;
            });
        });
    }
}
exports.GPServerRequest = GPServerRequest;
const keyify = (obj, prefix) => Object.keys(obj).reduce((res, el) => {
    prefix = typeof prefix === "string" ? prefix : "";
    const reg = /^\d+$/;
    let elnum;
    if (el.match(reg)) {
        elnum = "[" + el + "]";
    }
    else {
        elnum = el;
    }
    if (typeof obj[el] === "object" && obj[el] !== null) {
        if (Array.isArray(obj[el])) {
            return [...res, ...keyify(obj[el], prefix + elnum)];
        }
        else {
            return [...res, ...keyify(obj[el], prefix + elnum + ".")];
        }
    }
    return [...res, prefix + elnum];
}, []);
const checkResponse = (res, expect) => __awaiter(void 0, void 0, void 0, function* () {
    const expectData = JSON.parse(expect === "" ? "{}" : expect);
    const expectDataKeys = Object.keys(expectData);
    let resdata;
    let message = "";
    let dataverified = true;
    if (expectDataKeys.length === 0 && res.Status === 200) {
        dataverified = true;
    }
    else if (expectDataKeys.length !== 0 && res.Status === 200) {
        try {
            resdata = JSON.parse(res.Data);
            if (resdata.length === 0) {
                message += "noData; ";
                dataverified = false;
            }
            else {
                let expectDataNode = keyify(expectData, "");
                for (let nodeString of expectDataNode) {
                    const nodes = nodeString.split(".");
                    const leaf = nodes[nodes.length - 1];
                    try {
                        const expectDataString = "expectData" + (nodeString[0] === "[" ? nodeString : "." + nodeString);
                        const responseDataString = "resdata" + (nodeString[0] === "[" ? nodeString : "." + nodeString);
                        // tslint:disable-next-line: no-eval
                        const expectDataValue = eval(expectDataString).toString();
                        // tslint:disable-next-line: no-eval
                        const responseDataValue = eval(responseDataString).toString();
                        if (expectDataValue === "...") {
                            if (responseDataValue === "") {
                                dataverified = false;
                                message += leaf + "Empty; ";
                            }
                        }
                        else if (responseDataValue !== expectDataValue) {
                            dataverified = false;
                            message += leaf + "Error; ";
                        }
                    }
                    catch (_a) {
                        dataverified = false;
                        message += "no" + leaf + "; ";
                    }
                }
            }
        }
        catch (_b) {
            resdata = [];
            dataverified = false;
            message += "dataError; ";
        }
    }
    else {
        dataverified = false;
    }
    const checkResult = {
        message: message,
        dataverified: dataverified,
    };
    return checkResult;
});
exports.checkResponse = checkResponse;
