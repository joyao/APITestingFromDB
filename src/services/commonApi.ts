import * as config from "../config/config";
import { ApiResult } from "../models/ApiClass";
import { GoRequest, ReqOption } from "../models/Request";
import { GenerateToken, gpServerPostRequest } from "./gpServerApi";

const getConfigToken: (configString: string) => Promise<Object> = async (configString: string): Promise<Object> => {
    switch (configString) {
        case "PRIVATEAPI_TOKEN": {
            return config.PRIVATEAPI_TOKEN;
        }
        case "PUBLICAPI_TOKEN": {
            return config.PUBLICAPI_TOKEN;
        }
        case "ARCGISSERVER_TOKEN": {
            return await GenerateToken().then((TOKEN) => {
                return { token: TOKEN };
            });
        }
        default: {
            return {};
        }
    }
};

class CommonApiRequest extends GoRequest {
    constructor(contentType: string, url: string, pathParam: string, data: Object, method: string, token: Object) {
        const reqOption: ReqOption = new ReqOption(contentType, url, pathParam, data, token);
        super(reqOption, method);
    }
}

class GPServerRequest extends GoRequest {
    constructor(contentType: string, url: string, pathParam: string, data: Object, method: string, token: Object) {
        const reqOption: ReqOption = new ReqOption(contentType, url, pathParam, data, token);
        super(reqOption, method);
    }
    // override GoRequest's method
    async RunRequest(): Promise<ApiResult> {
        return await gpServerPostRequest(this.reqOption).then((res: ApiResult) => {
            return res;
        });
    }
}

const keyify: (obj: Object, prefix?: string) => Array<string> = (obj: any, prefix?: string): Array<string> =>
    Object.keys(obj).reduce((res: any, el: any) => {
        prefix = typeof prefix === "string" ? prefix : "";
        const reg: RegExp = /^\d+$/;
        let elnum: string;
        if (el.match(reg)) {
            elnum = "[" + el + "]";
        } else {
            elnum = el;
        }
        if (typeof obj[el] === "object" && obj[el] !== null) {
            if (Array.isArray(obj[el])) {
                return [...res, ...keyify(obj[el], prefix + elnum)];
            } else {
                return [...res, ...keyify(obj[el], prefix + elnum + ".")];
            }
        }
        return [...res, prefix + elnum];
    }, []);

const checkResponse: (res: ApiResult, expect: string) => Promise<Object> = async (
    res: ApiResult,
    expect: string
): Promise<Object> => {
    const expectData: any = JSON.parse(expect === "" ? "{}" : expect);
    const expectDataKeys: Array<string> = Object.keys(expectData);
    let resdata: any;
    let message: string = "";
    let dataverified: boolean = true;
    if (expectDataKeys.length === 0 && res.Status === 200) {
        dataverified = true;
    } else if (expectDataKeys.length !== 0 && res.Status === 200) {
        try {
            resdata = JSON.parse(res.Data);
            if (resdata.length === 0) {
                message += "noData; ";
                dataverified = false;
            } else {
                let expectDataNode: Array<string> = keyify(expectData, "");
                for (let nodeString of expectDataNode) {
                    const nodes: Array<string> = nodeString.split(".");
                    const leaf: string = nodes[nodes.length - 1];
                    try {
                        const expectDataString: string =
                            "expectData" + (nodeString[0] === "[" ? nodeString : "." + nodeString);
                        const responseDataString: string =
                            "resdata" + (nodeString[0] === "[" ? nodeString : "." + nodeString);
                        // tslint:disable-next-line: no-eval
                        const expectDataValue: string = eval(expectDataString).toString();
                        // tslint:disable-next-line: no-eval
                        const responseDataValue: string = eval(responseDataString).toString();
                        if (expectDataValue === "...") {
                            if (responseDataValue === "") {
                                dataverified = false;
                                message += leaf + "Empty; ";
                            }
                        } else if (responseDataValue !== expectDataValue) {
                            dataverified = false;
                            message += leaf + "Error; ";
                        }
                    } catch {
                        dataverified = false;
                        message += "no" + leaf + "; ";
                    }
                }
            }
        } catch {
            resdata = [];
            dataverified = false;
            message += "dataError; ";
        }
    } else {
        dataverified = false;
    }
    const checkResult: Object = {
        message: message,
        dataverified: dataverified,
    };
    return checkResult;
};

export { getConfigToken, CommonApiRequest, GPServerRequest, checkResponse };
