import { sendErrorMail } from "./emails/alert";
import { organizeAPIList, runApiTestingFromArcGISServer } from "./loaders/ArcGISServerApi";
import * as commonApi from "./loaders/commonApi";

let args: Array<String> = process.argv.slice(2);
console.log(args);

switch (args[0]) {
    case "ArcGIS": {
        runApiTestingFromArcGISServer();
        break;
    }
    case "ArcGISList": {
        organizeAPIList();
        break;
    }
    case "DBforTest": {
        commonApi.runApiTestingFromDB_forDev().then((ApiArray) => {
            Promise.all(ApiArray.map((p) => p.apply(this))).then((arr) => {
                sendErrorMail(arr);
            });
        });
        break;
    }
    default: {
        commonApi.runApiTestingFromDB().then((ApiArray) => {
            Promise.all(ApiArray.map((p) => p.apply(this))).then((arr) => {
                sendErrorMail(arr);
            });
        });
        break;
    }
}
