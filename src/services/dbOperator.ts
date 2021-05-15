import { db } from "../db/mssqldb";
import * as sql from "mssql";
import { ApiStatus } from "../models/ApiClass";

const getAPITestingParam: (IgnoreFeq: boolean) => Promise<Array<any>> = (IgnoreFeq: boolean): Promise<Array<any>> => {
    return new Promise((resolve) => {
        const pool: any = new sql.ConnectionPool(db);
        pool.connect().then((task: any) => {
            let QueryString: string = "SELECT * FROM [dbo].[APITestingParam] where [Monitoring] = 1";
            if (!IgnoreFeq) {
                QueryString += "and GETDATE()>DATEADD(minute,Frequency-1,LastUpdate);";
            }
            task.request().query(QueryString, (err: any, recordset: any) => {
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

const testResultUpdate: (apistatus: ApiStatus, Type: string) => Promise<void> = (
    apistatus: ApiStatus,
    Type: string
): Promise<void> => {
    return new Promise((resolve) => {
        const pool: any = new sql.ConnectionPool(db);
        pool.connect().then((task: any) => {
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
                        .query(
                            `UPDATE [dbo].[APITestingParam]
                        SET Status=@status, LastUpdate=GETDATE(), DataVerified=@dataverified, Memo=@memo, DuringTime=@duringtime
                        where OBJECTID = @id
                        INSERT INTO [dbo].[APITestingLog] (ID, Type, APIInfo, Name, Status, LastUpdate, DataVerified, Memo, DuringTime)
                        VALUES (@id, @type, @apiinfo, @name, @status, GETDATE(), @dataverified, @memo, @duringtime);
                        `,
                            (err: any, recordset: any) => {
                                if (err) {
                                    console.log(err);
                                }
                                // console.log(JSON.stringify(recordset));
                                pool.close();
                                resolve(recordset.recordset);
                            }
                        );
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

export { getAPITestingParam, testResultUpdate };
