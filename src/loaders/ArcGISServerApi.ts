import { writeFile } from "fs";
import * as config from "../config/config";
import { ApiResult } from "../models/ApiClass";
import { getConfigToken, CommonApiRequest } from "../services/commonApi";
import { getParam, runApiTesting } from "./commonApi";

const writeApiList2File: (apiList: any) => void = (apiList: any): void => {
    writeFile("ArcGISServerApiList.json", apiList, "utf8", function (err: any): void {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("JSON file has been saved.");
    });
};

const createRequestData: (url: string, layer: any) => Promise<Object> = async (
    url: string,
    layer: any
): Promise<Object> => {
    const infoObj: any = {
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
};

const organizeAPIList: () => Promise<Array<Object>> = async (): Promise<Array<Object>> => {
    const serviceArray: Array<Object> = [];
    const getServiceList: (url: string) => Promise<Array<Object>> = async (url: string): Promise<Array<Object>> => {
        const HeaderTokenConfig: any = await getConfigToken("ARCGISSERVER_TOKEN").then((auth: Object) => {
            return auth;
        });
        const data: any = getParam(
            JSON.stringify({
                f: "pjson",
                token: HeaderTokenConfig.token,
            }),
            "FormData"
        );

        const requestObj: any = await new CommonApiRequest(
            "XML",
            url,
            data.pathParam,
            data.data,
            "POST",
            HeaderTokenConfig
        );
        return requestObj.RunRequest().then(async (res: ApiResult) => {
            if (res.Status === 200) {
                // root -> folder -> service -> layer => sublayers
                const resData: any = JSON.parse(res.Data);
                if (typeof resData.layers !== "undefined") {
                    for (let i: number = 0; i < resData.layers.length; i++) {
                        const layer: any = resData.layers[i];
                        const infoObj: Object = await createRequestData(url, layer);
                        // console.log(infoObj);
                        serviceArray.push(infoObj);
                    }
                }
                if (typeof resData.tasks !== "undefined") {
                    for (let i: number = 0; i < resData.tasks.length; i++) {
                        const layer: any = resData.tasks[i];
                        const infoObj: Object = await createRequestData(url, layer);
                        // console.log(infoObj);
                        serviceArray.push(infoObj);
                    }
                }
                if (typeof resData.folders !== "undefined") {
                    for (let i: number = 0; i < resData.folders.length; i++) {
                        await getServiceList(url + "/" + resData.folders[i]);
                    }
                }
                if (typeof resData.services !== "undefined") {
                    for (let i: number = 0; i < resData.services.length; i++) {
                        const serviceRoute: Array<string> = resData.services[i].name.split("/");
                        await getServiceList(
                            url + "/" + serviceRoute[serviceRoute.length - 1] + "/" + resData.services[i].type
                        );
                    }
                }
            }
            return serviceArray;
        });
    };

    const rootUrl: string = config.MAPSERVICE_URL + "/rest/services";
    return await getServiceList(rootUrl).then((arr) => {
        // for (let i: number = 0; i < arr.length; i++) {
        //     console.log(arr[i]);
        // }
        console.log(arr.length);
        writeApiList2File(JSON.stringify(arr));
        return arr;
    });
};

const runApiTestingFromArcGISServer: () => Promise<Array<Function>> = async (): Promise<Array<Function>> => {
    return await organizeAPIList().then(async (apiList) => {
        return await runApiTesting(apiList, "ArcGIS");
    });
};
export { organizeAPIList, runApiTestingFromArcGISServer };
