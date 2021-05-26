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
exports.runApiTestingFromArcGISServer = exports.organizeAPIList = void 0;
const fs_1 = require("fs");
const config = __importStar(require("../config/config"));
const commonApi_1 = require("../services/commonApi");
const commonApi_2 = require("./commonApi");
const writeApiList2File = (apiList) => {
    fs_1.writeFile("ArcGISServerApiList.json", apiList, "utf8", function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("JSON file has been saved.");
    });
};
const createRequestData = (url, layer) => __awaiter(void 0, void 0, void 0, function* () {
    const infoObj = {
        OBJECTID: "",
        URL: url,
        Type: "ArcGISServer",
        LayerType: url.split("/")[url.split("/").length - 1],
        APIInfo: "",
        ContentType: "XML",
        RequestMethod: "POST",
        JsonData: JSON.stringify({}),
        ParamMethod: "FormData",
        ExpectResponse: "",
        HeaderTokenConfig: "ARCGISSERVER_TOKEN",
    };
    switch (infoObj.LayerType) {
        case "GPServer": {
            infoObj.URL = url + "/" + layer.toString();
            infoObj.Type = "ArcGISServer_GP";
            infoObj.APIInfo = layer.toString();
            infoObj.JsonData = JSON.stringify({ "1": "1" });
            break;
        }
        default: {
            infoObj.URL = url + "/" + layer.id.toString();
            infoObj.Type = "ArcGISServer";
            infoObj.APIInfo = layer.name;
            infoObj.JsonData = JSON.stringify({ "1": "1" });
            break;
        }
    }
    return infoObj;
});
const organizeAPIList = () => __awaiter(void 0, void 0, void 0, function* () {
    const serviceArray = [];
    const getServiceList = (url) => __awaiter(void 0, void 0, void 0, function* () {
        const HeaderTokenConfig = yield commonApi_1.getConfigToken("ARCGISSERVER_TOKEN").then((auth) => {
            return auth;
        });
        const data = commonApi_2.getParam(JSON.stringify({
            f: "pjson",
            token: HeaderTokenConfig.token,
        }), "FormData");
        const requestObj = yield new commonApi_1.CommonApiRequest("XML", url, data.pathParam, data.data, "POST", HeaderTokenConfig);
        return requestObj.RunRequest().then((res) => __awaiter(void 0, void 0, void 0, function* () {
            if (res.Status === 200) {
                // root -> folder -> service -> layer => sublayers
                const resData = JSON.parse(res.Data);
                if (typeof resData.layers !== "undefined") {
                    for (let i = 0; i < resData.layers.length; i++) {
                        const layer = resData.layers[i];
                        const infoObj = yield createRequestData(url, layer);
                        // console.log(infoObj);
                        serviceArray.push(infoObj);
                    }
                }
                if (typeof resData.tasks !== "undefined") {
                    for (let i = 0; i < resData.tasks.length; i++) {
                        const layer = resData.tasks[i];
                        const infoObj = yield createRequestData(url, layer);
                        // console.log(infoObj);
                        serviceArray.push(infoObj);
                    }
                }
                if (typeof resData.folders !== "undefined") {
                    for (let i = 0; i < resData.folders.length; i++) {
                        yield getServiceList(url + "/" + resData.folders[i]);
                    }
                }
                if (typeof resData.services !== "undefined") {
                    for (let i = 0; i < resData.services.length; i++) {
                        const serviceRoute = resData.services[i].name.split("/");
                        yield getServiceList(url + "/" + serviceRoute[serviceRoute.length - 1] + "/" + resData.services[i].type);
                    }
                }
            }
            return serviceArray;
        }));
    });
    const rootUrl = config.MAPSERVICE_URL + "/rest/services";
    return yield getServiceList(rootUrl).then((arr) => {
        // for (let i: number = 0; i < arr.length; i++) {
        //     console.log(arr[i]);
        // }
        console.log(arr.length);
        writeApiList2File(JSON.stringify(arr));
        return arr;
    });
});
exports.organizeAPIList = organizeAPIList;
const runApiTestingFromArcGISServer = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield organizeAPIList().then((apiList) => __awaiter(void 0, void 0, void 0, function* () {
        return yield commonApi_2.runApiTesting(apiList, "ArcGIS");
    }));
});
exports.runApiTestingFromArcGISServer = runApiTestingFromArcGISServer;
