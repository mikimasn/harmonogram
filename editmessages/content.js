import { Express } from "express";
import { WebhookClient } from "discord.js";
import { verifyuser } from "../users.js";
import { db } from "../db.js";
/**
 * 
 * @param {Express} app 
 * @param {db} dbc
 */
export default function(app,dbc){
    app.get("/content/:id",(req,res)=>{
        var obj = await verifyuser(req.headers["authorization"],dbc)
        if(obj.auth){
            console.log(`fetching ${req.params.id} by ${obj.id}`);
            var webhook = new WebhookClient({
                url:process.env.WEBHOOK
            });
            webhook.fetchMessage(req.params.id),then(message=>{
                if(message.content)
                    res.status(200).send({
                        "content":message.content
                    })
                else
                    req.status(500).send({
                        "message":"Something went wrong. Try again later"
                    })
            })
        }
    })
}