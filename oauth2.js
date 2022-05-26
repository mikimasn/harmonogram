import { requestjson } from "./functions.js";
import { createRequire } from "module";
import { response } from "express";
const require = createRequire(import.meta.url);
const config = require("./config.json");
export class oauth2{
    #config
    /**
     * 
     * @param {String} token 
     * @param {String} rtoken 
     */
    constructor(token,rtoken){
        this.#config = require("./config.json")
        this.token = token;
        this.rtoken = rtoken;
    }
async getuser(){
        let headers = {
            "Authorization":"Bearer "+this.token
        }
        var request = await requestjson("https://discord.com/api/users/@me","GET",{},headers)
        var response = await request;
        return request;
}
async getguildmember(guildid){
        let headers = {
            "Authorization":"Bearer "+this.token
        }
        try{
        var request = await requestjson(`https://discord.com/api/users/@me/guilds/${guildid}/member`,"GET",{},headers)
        var reponse = await request
        return request;
        }
        catch(err){
            return undefined
        }
}
async renew(){
        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        let body={
            'client_id': process.env.ID,
        'client_secret': process.env.SECRET,
        'grant_type': 'refresh_token',
        'refresh_token': this.rtoken
        }
        var request = await requestjson("https://discord.com/api/oauth2/token","POST",new URLSearchParams(body),headers)
        var response = await request;
        this.token=response.access_token;
        this.rtoken=response.refresh_token;
        return response
}
}