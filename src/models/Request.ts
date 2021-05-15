import axios, { AxiosRequestConfig } from "axios";
import https from "https";
import { ApiResult } from "../models/ApiClass";

const httpsAgent: object = new https.Agent({
    rejectUnauthorized: false,
});
const defaultContentType: string = "application/json; charset=UTF-8";

interface IOption {
    contentType: string;
    url: string;
    pathParam: string;
    data: Object;
    Authorization: Object;
}

interface IRequest {
    get: () => Promise<ApiResult>;
    post: () => Promise<ApiResult>;
}

interface IRunRequest {
    run: () => Promise<ApiResult>;
}

class ReqOption implements IOption {
    contentType: string;
    url: string;
    pathParam: string;
    data: Object;
    Authorization: Object;
    constructor(contentType: string, url: string, pathParam: string, data: Object = {}, Authorization: Object) {
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

class RunRequestAndGetResponseStatus implements IRunRequest {
    AxiosRequestConfig: AxiosRequestConfig;
    constructor(options: AxiosRequestConfig) {
        this.AxiosRequestConfig = options;
    }
    async run(): Promise<ApiResult> {
        this.AxiosRequestConfig.httpsAgent = httpsAgent;
        let result: ApiResult = new ApiResult(-1, "{}");
        return await axios(this.AxiosRequestConfig)
            .then(function (response: any): ApiResult {
                // console.log(response.data);
                result = new ApiResult(response.status, JSON.stringify(response.data));
                return result;
            })
            .catch(function (error: any): ApiResult {
                try {
                    // console.log(error.toJSON());
                    result = new ApiResult(error.response.status, "{}");
                } catch {
                    result = new ApiResult(-1, "{}");
                }
                return result;
            });
    }
}

class APIRequest implements IRequest {
    reqOptions: IOption;
    constructor(options: IOption) {
        this.reqOptions = options;
        const url: string = options.url + (options.pathParam === "" ? "" : "/" + options.pathParam);
        if (/\s/.test(options.url)) {
            this.reqOptions.url = url;
        } else {
            this.reqOptions.url = encodeURI(url);
        }
    }
    async get(): Promise<ApiResult> {
        const URLSearchParams: string = await this.compostURLSearchParams(this.reqOptions.data);
        const AuthKey: string = Object.keys(this.reqOptions.Authorization)[0];
        const axiosOptions: any = {
            url: encodeURI(this.reqOptions.url + "?" + URLSearchParams),
            method: "GET",
            headers: {
                "Content-Type": this.reqOptions.contentType,
            },
        };
        axiosOptions.headers[AuthKey] = Object.values(this.reqOptions.Authorization);
        const axiosRun: IRunRequest = new RunRequestAndGetResponseStatus(axiosOptions);
        const result: ApiResult = await axiosRun.run();
        return result;
    }
    async post(): Promise<ApiResult> {
        const AuthKey: string = Object.keys(this.reqOptions.Authorization)[0];
        const axiosOptions: any = {
            url: this.reqOptions.url,
            method: "POST",
            headers: {
                "Content-Type": this.reqOptions.contentType,
            },
            data: this.reqOptions.data,
        };
        axiosOptions.headers[AuthKey] = Object.values(this.reqOptions.Authorization);
        // tslint:disable-next-line: no-use-before-declare
        const axiosRun: IRunRequest = new RunRequestAndGetResponseStatus(axiosOptions);
        const result: ApiResult = await axiosRun.run();
        return result;
    }
    private async compostURLSearchParams(data: Object): Promise<string> {
        return decodeURI(new URLSearchParams(data as any).toString())
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
    }
}

class GoRequest {
    reqOption: IOption;
    method: string;

    constructor(reqOption: IOption, method: string) {
        this.reqOption = reqOption;
        this.method = method;
    }
    async RunRequest(): Promise<ApiResult> {
        switch (this.method) {
            case "GET":
                return new APIRequest(this.reqOption).get();
            case "POST":
                return new APIRequest(this.reqOption).post();
            default:
                return new APIRequest(this.reqOption).get();
        }
    }
}

export { ReqOption, GoRequest, APIRequest };
