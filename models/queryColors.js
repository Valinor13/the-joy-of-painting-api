const { Client } = require('pg');
require("dotenv").config();

const client = new Client({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DB,
    password: process.env.PW,
    port: process.env.PORT,
});

async function collectData() {
    await client.connect();
    // let result = await client.query(`SELECT * FROM ${process.env.DBTABLE} WHERE ' ' IN ('.implode(',', $colors).')`);
    // console.log(result.rows);
    let q = await client.query(`SELECT * FROM ${process.env.DBTABLE} WHERE guest = null;`);
    console.log(q.rows);
    client.end();
    // return result;
}

(async () => collectData())();
