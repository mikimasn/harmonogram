import { createRequire } from "module";
import { db } from "./db.js";
import { oauth2 } from "./oauth2.js";
const require = createRequire(import.meta.url);
const { Pool, Client } = require('pg');
if(process.env.DATABASE_URL){


    var pool = new Client({
        connectionString:process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
          }
    })
    pool.connect();
}
else
    var pool=new Pool()
require('dotenv').config();
/**
 * 
 * @param {db} dbc 
 */
export async function longtermconfig(dbc){

var result = await pool.query("Select * from sessions")
console.log(process.env.DATABASE_URL);
console.log(result.rows);
result.rows.forEach(async ele=>{
    var time = new Date().getTime()/1000;
    if(ele.expire> time&&ele.notbefore<time){
        

        try{

        var oauth = new oauth2(undefined,ele.refresh_token);
        var response = await oauth.renew();
        console.log(response);
        await pool.query("Update sessions set refresh_token=$1 where refresh_token=$2",[oauth.rtoken,ele.refresh_token]);

        await dbc.register(oauth.token,oauth.rtoken,ele.token);
        }
        catch(error){
            console.error(error);
        }
    }   

})
}
/**
 * 
 * @param {db} dbc 
 * 
 */
export async function revokelongtermtoken(token,dbc){
    await pool.query("Delete from sessions where token=$1",[token]);
    dbc.logout(token);
}