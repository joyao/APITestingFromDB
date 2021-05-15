import { MAIL_FROM, MAIL_TO, MAIL_SERVER_HOST, MAIL_SERVER_PORT } from "../config/config";
import { createTransport } from "nodemailer";
import { render } from "mustache";
import { ApiStatus } from "../models/ApiClass";

const transporter: any = createTransport({
    host: MAIL_SERVER_HOST,
    port: MAIL_SERVER_PORT,
    tls: { secureProtocol: "TLSv1_method", rejectUnauthorized: false },
});

const tableTemplate: string = `<html>
<head><style>
    table, td, th { border: 1px solid black; }
    th, td { padding: 5px 10px 5px 10px }
</style></head>
<body><h3>執行API測試發生錯誤，錯誤訊息如下，請盡快確認與修復。</h3>
    <table><tr><th>API</th><th>狀態</th><th>執行時間</th><th>通過資料驗證</th><th>備註</th></tr>
        {{{tablecontent}}}
    </table>
</body></html>`;

const messageTemplate: string = `<tr><td>{{Name}}</td><td>{{Status}}</td><td>{{LastUpdate}}</td><td>{{DataVerified}}</td><td>{{Memo}}</td></tr>`;

const createErrorMailContent: (errordata: Array<ApiStatus>) => object = (
    errordata: Array<ApiStatus>
): Promise<object> => {
    return new Promise((resolve) => {
        let message: string = "";
        errordata.forEach((item) => {
            if (item.Status !== 200 || item.DataVerified === false) {
                const html: string = render(messageTemplate, item);
                message += html;
            }
        });

        let content: string = render(tableTemplate, {
            tablecontent: message,
        });

        let mailOptions: object = {
            from: MAIL_FROM,
            to: MAIL_TO,
            subject: "花蓮API自動化測試錯誤回報",
            html: content,
        };
        if (message !== "") {
            resolve(mailOptions);
        } else {
            return false;
        }
    });
};

const sendMail: (options: object) => void = (options: object): void => {
    transporter.sendMail(options, (error: any, info: any): void => {
        if (error) {
            console.log(error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
};

const sendErrorMail: (data: Array<ApiStatus>) => void = async (data: Array<ApiStatus>): Promise<void> => {
    // 只有早上7點到晚上7點會寄信，避免擾民
    let d: Date = new Date();
    let h: number = d.getHours();
    if (h > 6 && h < 20) {
        let mailOptions: object = await createErrorMailContent(data);
        sendMail(mailOptions);
    }
};

export { sendErrorMail };
