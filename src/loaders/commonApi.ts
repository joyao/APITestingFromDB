import * as config from "../config/config";
import { getAPITestingParam, testResultUpdate } from "../services/dbOperator";
import { CommonApiRequest, checkResponse, GPServerRequest, getConfigToken } from "../services/commonApi";
import { ApiResult, ApiStatus } from "../models/ApiClass";
import { writeApiLog } from "../logs/writeLog";

const getAPITestingData: (IgnoreFeq: boolean) => Promise<Array<any>> = async (
    IgnoreFeq: boolean
): Promise<Array<any>> => {
    let data: Array<any> = await getAPITestingParam(IgnoreFeq);
    return data;
};

const transValue2String: (value: any) => string = (value: any): string => {
    if (value) {
        return value.toString();
    } else {
        return "";
    }
};

const getParam: (DataString: any, ParamMethod: string) => Object = (DataString: any, ParamMethod: string): Object => {
    let pathParamOutput: string = "";
    let dataOutput: Object = {};
    switch (ParamMethod) {
        case "QueryString": {
            const JsonData: Object = JSON.parse(
                transValue2String(DataString) === "" ? "{}" : transValue2String(DataString)
            );
            pathParamOutput = "";
            dataOutput = JsonData;
            break;
        }
        case "FormData": {
            const JsonData: Object = JSON.parse(
                transValue2String(DataString) === "" ? "{}" : transValue2String(DataString)
            );
            const xmldata: string = decodeURI(new URLSearchParams(JsonData as any).toString());
            pathParamOutput = "";
            dataOutput = xmldata;
            break;
        }
        case "RequestPayload": {
            const JsonData: Object = JSON.parse(
                transValue2String(DataString) === "" ? "{}" : transValue2String(DataString)
            );
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

const runApiTesting: (apiList: Array<any>, Type: string) => Promise<Array<Function>> = async (
    apiList: Array<any>,
    Type: string
): Promise<Array<Function>> => {
    let funArr: Array<Function> = [];
    for (let value of apiList) {
        const ID: string = transValue2String(value.OBJECTID);
        const APIType: string = transValue2String(value.Type);
        const APIInfo: string = transValue2String(value.APIInfo);
        const ContentType: string = transValue2String(value.ContentType);
        const RequestMethod: string = transValue2String(value.RequestMethod);
        let URL: string = transValue2String(value.URL);
        const JsonDataString: Object =
            transValue2String(value.JsonData) === "" ? "{}" : transValue2String(value.JsonData);
        const ParamMethod: string = transValue2String(value.ParamMethod);
        const ExpectResponse: string = transValue2String(value.ExpectResponse);
        const HeaderTokenConfig: Object = await getConfigToken(transValue2String(value.HeaderTokenConfig)).then(
            (auth: Object) => {
                return auth;
            }
        );

        const func: () => Promise<ApiStatus> = async (): Promise<ApiStatus> => {
            const start_time: number = new Date().getTime();
            const inputData: any = getParam(JsonDataString, ParamMethod);
            let requestObj: any;
            let requestURL: string = URL;
            if (transValue2String(value.HeaderTokenConfig) === "ARCGISSERVER_TOKEN") {
                requestURL = config.MAPSERVICE_PROXY + "?" + URL;
            }
            if (APIType === "ArcGISServer_GP") {
                requestObj = await new GPServerRequest(
                    ContentType,
                    requestURL,
                    inputData.pathParam,
                    inputData.data,
                    RequestMethod,
                    HeaderTokenConfig
                );
            } else {
                requestObj = await new CommonApiRequest(
                    ContentType,
                    requestURL,
                    inputData.pathParam,
                    inputData.data,
                    RequestMethod,
                    HeaderTokenConfig
                );
            }
            const requestResult: ApiStatus = requestObj.RunRequest().then((res: ApiResult) => {
                return checkResponse(res, ExpectResponse).then((checkResult: any) => {
                    let ApiStatusData: ApiStatus = new ApiStatus(
                        ID,
                        APIInfo,
                        URL,
                        res.Status,
                        new Date(Date.now()).toLocaleString(),
                        checkResult.message,
                        checkResult.dataverified,
                        (new Date().getTime() - start_time) / 1000,
                        APIType
                    );
                    if (!Type.includes("SkipSave")) {
                        testResultUpdate(ApiStatusData, Type);
                    }
                    writeApiLog(ApiStatusData);
                    return ApiStatusData;
                });
            });
            return requestResult;
        };
        funArr.push(func);
    }
    return funArr;
};

const runApiTestingFromDB: () => Promise<Array<Function>> = async (): Promise<Array<Function>> => {
    const IgnoreFeq: boolean = false;
    return await getAPITestingData(IgnoreFeq).then(async (apiList) => {
        return await runApiTesting(apiList, "DB");
    });
};

const runApiTestingFromDB_forDev: () => Promise<Array<Function>> = async (): Promise<Array<Function>> => {
    const IgnoreFeq: boolean = true;
    return await getAPITestingData(IgnoreFeq).then(async (apiList) => {
        return await runApiTesting(apiList, "DB-SkipSave");
    });
};

export { getAPITestingData, runApiTestingFromDB, runApiTestingFromDB_forDev, runApiTesting, getParam };
