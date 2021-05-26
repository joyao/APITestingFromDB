"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gpServerPostRequest = exports.GenerateToken = void 0;
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
const ApiClass_1 = require("../models/ApiClass");
const fs_1 = require("fs");
const config_1 = require("../config/config");
const Request_1 = require("../models/Request");
const PROXY = config_1.MAPSERVICE_PROXY;
const API_HOST = PROXY + "?" + config_1.MAPSERVICE_URL;
const USER_NAME = config_1.MAPSERVICE_USER_NAME;
const PASSWORD = config_1.MAPSERVICE_PASSWORD;
let TOKEN = "";
const httpsAgent = new https_1.default.Agent({
    rejectUnauthorized: false,
});
const readTokenfromFile = () => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    const tokenstring = () => fs_1.readFileSync("./token.json", { encoding: "utf8" });
    try {
        token = JSON.parse(tokenstring());
    }
    catch (_a) {
        token = {
            token: "",
            expires: 0,
            ssl: true,
        };
    }
    return Promise.resolve(token);
});
const writeToken2File = (tokenInfo) => {
    fs_1.writeFile("token.json", tokenInfo, "utf8", function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("JSON file has been saved.");
    });
};
const GenerateToken = () => __awaiter(void 0, void 0, void 0, function* () {
    const options = {
        url: config_1.MAPSERVICE_URL + "/sharing/rest/generateToken",
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data: "username=" +
            USER_NAME +
            "&password=" +
            PASSWORD +
            "&client=referer&referer=" +
            config_1.MAPSERVICE_URL +
            "&expiration=60&f=pjson",
        httpsAgent: httpsAgent,
    };
    const getTokenFromAPI = () => __awaiter(void 0, void 0, void 0, function* () {
        const token = yield axios_1.default(options)
            .then(function (response) {
            console.log(response.data);
            TOKEN = response.data.token;
            writeToken2File(JSON.stringify(response.data));
            return response.data.token;
        })
            .catch(function (error) {
            // console.log(error.toJSON());
            // result = new ApiResult(error.response.status, "{}");
            // return result;
            return "";
        });
        return token;
    });
    return yield readTokenfromFile().then((res) => __awaiter(void 0, void 0, void 0, function* () {
        let lastTokenInfo = res;
        // let result: ApiResult = new ApiResult(-1, "{}");
        try {
            if (Date.now() >= lastTokenInfo.expires || res.token === "" || res.token === undefined) {
                return yield getTokenFromAPI().then((res) => {
                    return res;
                });
            }
            else {
                lastTokenInfo = res;
                TOKEN = res.token;
                return res.token;
            }
        }
        catch (error) {
            TOKEN = "";
            writeToken2File("");
            return "";
        }
    }));
});
exports.GenerateToken = GenerateToken;
const submitJob = (reqOption) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield new Request_1.APIRequest(reqOption).post();
    return result;
});
const getJobResultStatus = (submitJobResult, reqOption) => __awaiter(void 0, void 0, void 0, function* () {
    const newUrlArray = reqOption.url.split("/");
    newUrlArray.pop();
    const newUrl = decodeURI(newUrlArray.join("/") + "/jobs/" + JSON.parse(submitJobResult.Data).jobId);
    const JobOptions = new Request_1.ReqOption("JSON", newUrl, "", { f: "json" }, reqOption.Authorization);
    let JobResult = yield new Request_1.APIRequest(JobOptions).get();
    let count = 1;
    const interval = (JobOptions) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                let tempJobResult = yield new Request_1.APIRequest(JobOptions).get();
                resolve(tempJobResult);
            }), 1000);
        });
    });
    for (let i = 0; i < 30; i += 1) {
        let r = yield interval(JobOptions).then((jbr) => {
            // if (count !== 0 && JSON.parse(JobResult.Data).jobStatus === "esriJobSucceeded") {
            //     return JobResult;
            // }
            return jbr;
        });
        JobResult = r;
        if (i !== 0 && JSON.parse(r.Data).jobStatus === "esriJobSucceeded") {
            break;
        }
        count += 1;
        // console.log(JobResult);
    }
    return JobResult;
});
const getJobResultUrl = (JobStatueResult, reqOption) => __awaiter(void 0, void 0, void 0, function* () {
    const newUrlArray = reqOption.url.split("/");
    newUrlArray.pop();
    const newUrl = decodeURI(newUrlArray.join("/") + "/jobs/" + JSON.parse(JobStatueResult.Data).jobId + "/results/Output_File");
    const data = {
        f: "json",
        returnType: "data",
    };
    const JobUrlOptions = new Request_1.ReqOption("JSON", newUrl, "", data, reqOption.Authorization);
    let JobUrlResult;
    if (JSON.parse(JobStatueResult.Data).jobStatus === "esriJobSucceeded") {
        JobUrlResult = yield new Request_1.APIRequest(JobUrlOptions).get();
    }
    else {
        JobUrlResult = new ApiClass_1.ApiResult(-1, "{}");
    }
    return JobUrlResult;
});
const gpServerPostRequest = (reqOption) => __awaiter(void 0, void 0, void 0, function* () {
    const submitJobResult = yield submitJob(reqOption);
    const JobResultStatus = submitJobResult.Status === 200 ? yield getJobResultStatus(submitJobResult, reqOption) : submitJobResult;
    const JobResultUrl = JobResultStatus.Status === 200 ? yield getJobResultUrl(JobResultStatus, reqOption) : JobResultStatus;
    return JobResultUrl;
});
exports.gpServerPostRequest = gpServerPostRequest;
