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
exports.APIRequest = exports.GoRequest = exports.ReqOption = void 0;
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
const ApiClass_1 = require("../models/ApiClass");
const httpsAgent = new https_1.default.Agent({
    rejectUnauthorized: false,
});
const defaultContentType = "application/json; charset=UTF-8";
class ReqOption {
    constructor(contentType, url, pathParam, data = {}, Authorization) {
        switch (contentType) {
            case "JSON":
                this.contentType = "application/json; charset=UTF-8";
                break;
            case "XML":
                this.contentType = "application/x-www-form-urlencoded";
                break;
            case "JSON-odata":
                this.contentType = "application/json; odata.metadata=minimal";
                break;
            case "IMAGE-jpeg":
                this.contentType = "image/jpeg";
                break;
            default:
                this.contentType = defaultContentType;
                break;
        }
        this.url = url;
        this.pathParam = pathParam;
        this.data = data;
        this.Authorization = Authorization;
    }
}
exports.ReqOption = ReqOption;
class RunRequestAndGetResponseStatus {
    constructor(options) {
        this.AxiosRequestConfig = options;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            this.AxiosRequestConfig.httpsAgent = httpsAgent;
            let result = new ApiClass_1.ApiResult(-1, "{}");
            return yield axios_1.default(this.AxiosRequestConfig)
                .then(function (response) {
                // console.log(response.data);
                result = new ApiClass_1.ApiResult(response.status, JSON.stringify(response.data));
                return result;
            })
                .catch(function (error) {
                try {
                    // console.log(error.toJSON());
                    result = new ApiClass_1.ApiResult(error.response.status, "{}");
                }
                catch (_a) {
                    result = new ApiClass_1.ApiResult(-1, "{}");
                }
                return result;
            });
        });
    }
}
class APIRequest {
    constructor(options) {
        this.reqOptions = options;
        const url = options.url + (options.pathParam === "" ? "" : "/" + options.pathParam);
        if (/\s/.test(options.url)) {
            this.reqOptions.url = url;
        }
        else {
            this.reqOptions.url = encodeURI(url);
        }
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            const URLSearchParams = yield this.compostURLSearchParams(this.reqOptions.data);
            const AuthKey = Object.keys(this.reqOptions.Authorization)[0];
            const axiosOptions = {
                url: encodeURI(this.reqOptions.url + "?" + URLSearchParams),
                method: "GET",
                headers: {
                    "Content-Type": this.reqOptions.contentType,
                },
            };
            axiosOptions.headers[AuthKey] = Object.values(this.reqOptions.Authorization);
            const axiosRun = new RunRequestAndGetResponseStatus(axiosOptions);
            const result = yield axiosRun.run();
            return result;
        });
    }
    post() {
        return __awaiter(this, void 0, void 0, function* () {
            const AuthKey = Object.keys(this.reqOptions.Authorization)[0];
            const axiosOptions = {
                url: this.reqOptions.url,
                method: "POST",
                headers: {
                    "Content-Type": this.reqOptions.contentType,
                },
                data: this.reqOptions.data,
            };
            axiosOptions.headers[AuthKey] = Object.values(this.reqOptions.Authorization);
            // tslint:disable-next-line: no-use-before-declare
            const axiosRun = new RunRequestAndGetResponseStatus(axiosOptions);
            const result = yield axiosRun.run();
            return result;
        });
    }
    compostURLSearchParams(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return decodeURI(new URLSearchParams(data).toString())
                .replace(/%40/gi, "@")
                .replace(/%3A/gi, ":")
                .replace(/%24/gi, "$")
                .replace(/%2C/gi, ",")
                .replace(/%3B/gi, ";")
                .replace(/%2B/gi, "+")
                .replace(/%3D/gi, "=")
                .replace(/%3F/gi, "?")
                .replace(/%2F/gi, "/")
                .replace(/%2b/gi, " ");
        });
    }
}
exports.APIRequest = APIRequest;
class GoRequest {
    constructor(reqOption, method) {
        this.reqOption = reqOption;
        this.method = method;
    }
    RunRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            switch (this.method) {
                case "GET":
                    return new APIRequest(this.reqOption).get();
                case "POST":
                    return new APIRequest(this.reqOption).post();
                default:
                    return new APIRequest(this.reqOption).get();
            }
        });
    }
}
exports.GoRequest = GoRequest;
