//BACKEND/db.js
const sql = require('mssql');
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const DIALECT = process.env.DB_DIALECT;
const HOST = process.env.DB_HOST;
const INSTANCE = process.env.DB_INSTANCE;
const DATABASE = process.env.DN_NAME;
const USERNAME = process.env.DB_USERNAME;
const PASSWORD = process.env.DB_PASSWORD;

const config = {
    user: USERNAME,
    password: PASSWORD,
    server: HOST + '\\' + INSTANCE,
    database: DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const sequelize = new Sequelize(DATABASE, USERNAME, PASSWORD, {
    host: HOST,
    dialect: DIALECT,
    dialectOptions: {
        options: {
            instanceName: INSTANCE,
            encrypt: false,
            trustServerCertificate: true
        }
    },
    logging: false
});

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        return pool;
    })
    .catch(err => {
        console.error('❌ Database connection error:', err);
    });

module.exports = {
    sql,
    poolPromise,
    sequelize
};
