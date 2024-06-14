const pg = require("pg");

const pgConfig = {
  host: "localhost",
  port: 5432,
  database: "stor_app",
  user: "postgres",
  password: "13579012468",
};

const pool = new pg.Pool(pgConfig);

module.exports = pool;
