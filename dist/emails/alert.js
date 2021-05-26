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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendErrorMail = void 0;
const config_1 = require("../config/config");
const nodemailer_1 = require("nodemailer");
const mustache_1 = require("mustache");
const transporter = nodemailer_1.createTransport({
    host: config_1.MAIL_SERVER_HOST,
    port: config_1.MAIL_SERVER_PORT,
    tls: { secureProtocol: "TLSv1_method", rejectUnauthorized: false },
});
const tableTemplate = `<html>
<head><style>
    table, td, th { border: 1px solid black; }
    th, td { padding: 5px 10px 5px 10px }
</style></head>
<body><h3>執行API測試發生錯誤，錯誤訊息如下，請盡快確認與修復。</h3>
    <table><tr><th>API</th><th>狀態</th><th>執行時間</th><th>通過資料驗證</th><th>備註</th></tr>
        {{{tablecontent}}}
    </table>
</body></html>`;
const messageTemplate = `<tr><td>{{Name}}</td><td>{{Status}}</td><td>{{LastUpdate}}</td><td>{{DataVerified}}</td><td>{{Memo}}</td></tr>`;
const createErrorMailContent = (errordata) => {
    return new Promise((resolve) => {
        let message = "";
        errordata.forEach((item) => {
            if (item.Status !== 200 || item.DataVerified === false) {
                const html = mustache_1.render(messageTemplate, item);
                message += html;
            }
        });
        let content = mustache_1.render(tableTemplate, {
            tablecontent: message,
        });
        let mailOptions = {
            from: config_1.MAIL_FROM,
            to: config_1.MAIL_TO,
            subject: "花蓮API自動化測試錯誤回報",
            html: content,
        };
        if (message !== "") {
            resolve(mailOptions);
        }
        else {
            return false;
        }
    });
};
const sendMail = (options) => {
    transporter.sendMail(options, (error, info) => {
        if (error) {
            console.log(error);
        }
        else {
            console.log("Email sent: " + info.response);
        }
    });
};
const sendErrorMail = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // 只有早上7點到晚上7點會寄信，避免擾民
    let d = new Date();
    let h = d.getHours();
    if (h > 6 && h < 20) {
        let mailOptions = yield createErrorMailContent(data);
        sendMail(mailOptions);
    }
});
exports.sendErrorMail = sendErrorMail;
