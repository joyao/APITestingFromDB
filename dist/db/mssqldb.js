"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const config_1 = require("../config/config");
const db = {
    user: config_1.DB_USER,
    password: config_1.DB_PASSWORD,
    server: config_1.DB_SERVER,
    port: config_1.DB_PORT,
    database: config_1.INIT_DATABASE,
    connectionTimeout: 100000,
    pool: {
        max: 1024,
        min: 1,
        idleTimeoutMillis: 30000,
    },
    options: {
        encrypt: true,
        enableArithAbort: false,
    },
};
exports.db = db;
