import { DB_USER, DB_PASSWORD, DB_PORT, DB_SERVER, INIT_DATABASE } from "../config/config";

const db: any = {
    user: DB_USER,
    password: DB_PASSWORD,
    server: DB_SERVER,
    port: DB_PORT,
    database: INIT_DATABASE,
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

export { db };
