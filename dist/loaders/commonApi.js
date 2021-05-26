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
exports.getParam = exports.runApiTesting = exports.runApiTestingFromDB_forDev = exports.runApiTestingFromDB = exports.getAPITestingData = void 0;
const config = __importStar(require("../config/config"));
const dbOperator_1 = require("../services/dbOperator");
const commonApi_1 = require("../services/commonApi");
const ApiClass_1 = require("../models/ApiClass");
const writeLog_1 = require("../logs/writeLog");
const getAPITestingData = (IgnoreFeq) => __awaiter(void 0, void 0, void 0, function* () {
    let data = yield dbOperator_1.getAPITestingParam(IgnoreFeq);
    return data;
});
exports.getAPITestingData = getAPITestingData;
const transValue2String = (value) => {
    if (value) {
        return value.toString();
    }
    else {
        return "";
    }
};
const getParam = (DataString, ParamMethod) => {
    let pathParamOutput = "";
    let dataOutput = {};
    switch (ParamMethod) {
        case "QueryString": {
            const JsonData = JSON.parse(transValue2String(DataString) === "" ? "{}" : transValue2String(DataString));
            pathParamOutput = "";
            dataOutput = JsonData;
            break;
        }
        case "FormData": {
            const JsonData = JSON.parse(transValue2String(DataString) === "" ? "{}" : transValue2String(DataString));
            const xmldata = decodeURI(new URLSearchParams(JsonData).toString());
            pathParamOutput = "";
            dataOutput = xmldata;
            break;
        }
        case "RequestPayload": {
            const JsonData = JSON.parse(transValue2String(DataString) === "" ? "{}" : transValue2String(DataString));
            pathParamOutput = "";
            dataOutput = JsonData;
            break;
        }
        case "RouteParameter": {
            pathParamOutput = DataString;
            dataOutput = {};
            break;
        }
        default: {
            break;
        }
    }
    return { pathParam: pathParamOutput, data: dataOutput };
};
exports.getParam = getParam;
const runApiTesting = (apiList, Type) => __awaiter(void 0, void 0, void 0, function* () {
    let funArr = [];
    for (let value of apiList) {
        const ID = transValue2String(value.OBJECTID);
        const APIType = transValue2String(value.Type);
        const APIInfo = transValue2String(value.APIInfo);
        const ContentType = transValue2String(value.ContentType);
        const RequestMethod = transValue2String(value.RequestMethod);
        let URL = transValue2String(value.URL);
        const JsonDataString = transValue2String(value.JsonData) === "" ? "{}" : transValue2String(value.JsonData);
        const ParamMethod = transValue2String(value.ParamMethod);
        const ExpectResponse = transValue2String(value.ExpectResponse);
        const HeaderTokenConfig = yield commonApi_1.getConfigToken(transValue2String(value.HeaderTokenConfig)).then((auth) => {
            return auth;
        });
        const func = () => __awaiter(void 0, void 0, void 0, function* () {
            const start_time = new Date().getTime();
            const inputData = getParam(JsonDataString, ParamMethod);
            let requestObj;
            let requestURL = URL;
            if (transValue2String(value.HeaderTokenConfig) === "ARCGISSERVER_TOKEN") {
                requestURL = config.MAPSERVICE_PROXY + "?" + URL;
            }
            if (APIType === "ArcGISServer_GP") {
                requestObj = yield new commonApi_1.GPServerRequest(ContentType, requestURL, inputData.pathParam, inputData.data, RequestMethod, HeaderTokenConfig);
            }
            else {
                requestObj = yield new commonApi_1.CommonApiRequest(ContentType, requestURL, inputData.pathParam, inputData.data, RequestMethod, HeaderTokenConfig);
            }
            const requestResult = requestObj.RunRequest().then((res) => {
                return commonApi_1.checkResponse(res, ExpectResponse).then((checkResult) => {
                    let ApiStatusData = new ApiClass_1.ApiStatus(ID, APIInfo, URL, res.Status, new Date(Date.now()).toLocaleString(), checkResult.message, checkResult.dataverified, (new Date().getTime() - start_time) / 1000, APIType);
                    if (!Type.includes("SkipSave")) {
                        dbOperator_1.testResultUpdate(ApiStatusData, Type);
                    }
                    writeLog_1.writeApiLog(ApiStatusData);
                    return ApiStatusData;
                });
            });
            return requestResult;
        });
        funArr.push(func);
    }
    return funArr;
});
exports.runApiTesting = runApiTesting;
const runApiTestingFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const IgnoreFeq = false;
    return yield getAPITestingData(IgnoreFeq).then((apiList) => __awaiter(void 0, void 0, void 0, function* () {
        return yield runApiTesting(apiList, "DB");
    }));
});
exports.runApiTestingFromDB = runApiTestingFromDB;
const runApiTestingFromDB_forDev = () => __awaiter(void 0, void 0, void 0, function* () {
    const IgnoreFeq = true;
    return yield getAPITestingData(IgnoreFeq).then((apiList) => __awaiter(void 0, void 0, void 0, function* () {
        return yield runApiTesting(apiList, "DB-SkipSave");
    }));
});
exports.runApiTestingFromDB_forDev = runApiTestingFromDB_forDev;
