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
Object.defineProperty(exports, "__esModule", { value: true });
exports.testResultUpdate = exports.getAPITestingParam = void 0;
const mssqldb_1 = require("../db/mssqldb");
const sql = __importStar(require("mssql"));
const getAPITestingParam = (IgnoreFeq) => {
    return new Promise((resolve) => {
        const pool = new sql.ConnectionPool(mssqldb_1.db);
        pool.connect().then((task) => {
            let QueryString = "SELECT * FROM [dbo].[APITestingParam] where [Monitoring] = 1";
            if (!IgnoreFeq) {
                QueryString += "and GETDATE()>DATEADD(minute,Frequency-1,LastUpdate);";
            }
            task.request().query(QueryString, (err, recordset) => {
                if (err) {
                    console.log(err);
                }
                // console.log(JSON.stringify(recordset));
                pool.close();
                resolve(recordset.recordset);
                return JSON.stringify(recordset);
            });
        });
    });
};
exports.getAPITestingParam = getAPITestingParam;
const testResultUpdate = (apistatus, Type) => {
    return new Promise((resolve) => {
        const pool = new sql.ConnectionPool(mssqldb_1.db);
        pool.connect().then((task) => {
            switch (Type) {
                case "DB": {
                    task.request()
                        .input("id", sql.Int, apistatus.ID)
                        .input("apiinfo", sql.NVarChar(50), apistatus.APIInfo)
                        .input("name", sql.NVarChar(256), apistatus.Name)
                        .input("status", sql.Int, apistatus.Status)
                        .input("memo", sql.NVarChar(256), apistatus.Memo)
                        .input("dataverified", sql.Bit, apistatus.DataVerified)
                        .input("duringtime", sql.Float, apistatus.DuringTime)
                        .input("type", sql.NVarChar(50), apistatus.Type)
                        .query(`UPDATE [dbo].[APITestingParam]
                        SET Status=@status, LastUpdate=GETDATE(), DataVerified=@dataverified, Memo=@memo, DuringTime=@duringtime
                        where OBJECTID = @id
                        INSERT INTO [dbo].[APITestingLog] (ID, Type, APIInfo, Name, Status, LastUpdate, DataVerified, Memo, DuringTime)
                        VALUES (@id, @type, @apiinfo, @name, @status, GETDATE(), @dataverified, @memo, @duringtime);
                        `, (err, recordset) => {
                        if (err) {
                            console.log(err);
                        }
                        // console.log(JSON.stringify(recordset));
                        pool.close();
                        resolve(recordset.recordset);
                    });
                    break;
                }
                case "ArcGIS": {
                    pool.close();
                    resolve();
                    break;
                }
                default: {
                    pool.close();
                    resolve();
                    break;
                }
            }
        });
    });
};
exports.testResultUpdate = testResultUpdate;
