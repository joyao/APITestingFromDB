import axios from "axios";
import https from "https";
import { ApiResult } from "../models/ApiClass";
import { writeFile, readFileSync } from "fs";
import { MAPSERVICE_USER_NAME, MAPSERVICE_PASSWORD, MAPSERVICE_PROXY, MAPSERVICE_URL } from "../config/config";
import { APIRequest, ReqOption } from "../models/Request";

const PROXY: string = MAPSERVICE_PROXY;
const API_HOST: string = PROXY + "?" + MAPSERVICE_URL;
const USER_NAME: string = MAPSERVICE_USER_NAME;
const PASSWORD: string = MAPSERVICE_PASSWORD;
let TOKEN: string = "";
const httpsAgent: object = new https.Agent({
    rejectUnauthorized: false,
});

const readTokenfromFile: () => Promise<any> = async (): Promise<any> => {
    let token: any;
    const tokenstring: any = () => readFileSync("./token.json", { encoding: "utf8" });
    try {
        token = JSON.parse(tokenstring());
    } catch {
        token = {
            token: "",
            expires: 0,
            ssl: true,
        };
    }
    return Promise.resolve(token);
};

const writeToken2File: (tokenInfo: any) => void = (tokenInfo: any): void => {
    writeFile("token.json", tokenInfo, "utf8", function (err: any): void {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("JSON file has been saved.");
    });
};

const GenerateToken: () => Promise<any> = async () => {
    const options: object = {
        url: MAPSERVICE_URL + "/sharing/rest/generateToken",
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data:
            "username=" +
            USER_NAME +
            "&password=" +
            PASSWORD +
            "&client=referer&referer=" +
            MAPSERVICE_URL +
            "&expiration=60&f=pjson",
        httpsAgent: httpsAgent,
    };
    const getTokenFromAPI: () => Promise<string> = async (): Promise<string> => {
        const token: string = await axios(options)
            .then(function (response: any): string {
                console.log(response.data);
                TOKEN = response.data.token;
                writeToken2File(JSON.stringify(response.data));
                return response.data.token;
            })
            .catch(function (error: any): string {
                // console.log(error.toJSON());
                // result = new ApiResult(error.response.status, "{}");
                // return result;
                return "";
            });
        return token;
    };
    return await readTokenfromFile().then(async (res) => {
        let lastTokenInfo: any = res;

        // let result: ApiResult = new ApiResult(-1, "{}");
        try {
            if (Date.now() >= lastTokenInfo.expires || res.token === "" || res.token === undefined) {
                return await getTokenFromAPI().then((res) => {
                    return res;
                });
            } else {
                lastTokenInfo = res;
                TOKEN = res.token;
                return res.token;
            }
        } catch (error) {
            TOKEN = "";
            writeToken2File("");
            return "";
        }
    });
};

const submitJob: (reqOption: ReqOption) => Promise<any> = async (reqOption: ReqOption): Promise<any> => {
    const result: ApiResult = await new APIRequest(reqOption).post();
    return result;
};

const getJobResultStatus: (submitJobResult: any, reqOption: ReqOption) => Promise<any> = async (
    submitJobResult: any,
    reqOption: ReqOption
): Promise<any> => {
    const newUrlArray: Array<string> = reqOption.url.split("/");
    newUrlArray.pop();
    const newUrl: string = decodeURI(newUrlArray.join("/") + "/jobs/" + JSON.parse(submitJobResult.Data).jobId);
    const JobOptions: ReqOption = new ReqOption("JSON", newUrl, "", { f: "json" }, reqOption.Authorization);
    let JobResult: ApiResult = await new APIRequest(JobOptions).get();
    let count: number = 1;
    const interval: (JobOptions: any) => Promise<ApiResult> = async (JobOptions: any): Promise<ApiResult> => {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                let tempJobResult: ApiResult = await new APIRequest(JobOptions).get();
                resolve(tempJobResult);
            }, 1000);
        });
    };

    for (let i: number = 0; i < 30; i += 1) {
        let r: ApiResult = await interval(JobOptions).then((jbr) => {
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
};

const getJobResultUrl: (JobStatueResult: any, reqOption: ReqOption) => Promise<any> = async (
    JobStatueResult: any,
    reqOption: ReqOption
): Promise<any> => {
    const newUrlArray: Array<string> = reqOption.url.split("/");
    newUrlArray.pop();
    const newUrl: string = decodeURI(
        newUrlArray.join("/") + "/jobs/" + JSON.parse(JobStatueResult.Data).jobId + "/results/Output_File"
    );
    const data: Object = {
        f: "json",
        returnType: "data",
    };
    const JobUrlOptions: ReqOption = new ReqOption("JSON", newUrl, "", data, reqOption.Authorization);
    let JobUrlResult: ApiResult;
    if (JSON.parse(JobStatueResult.Data).jobStatus === "esriJobSucceeded") {
        JobUrlResult = await new APIRequest(JobUrlOptions).get();
    } else {
        JobUrlResult = new ApiResult(-1, "{}");
    }
    return JobUrlResult;
};

const gpServerPostRequest: (reqOption: ReqOption) => Promise<ApiResult> = async (reqOption: ReqOption) => {
    const submitJobResult: ApiResult = await submitJob(reqOption);
    const JobResultStatus: ApiResult =
        submitJobResult.Status === 200 ? await getJobResultStatus(submitJobResult, reqOption) : submitJobResult;
    const JobResultUrl: ApiResult =
        JobResultStatus.Status === 200 ? await getJobResultUrl(JobResultStatus, reqOption) : JobResultStatus;
    return JobResultUrl;
};
export { GenerateToken, gpServerPostRequest };
