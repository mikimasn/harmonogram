import { createRequire } from "module";
import { WebhookClient } from "discord.js";
import { verifyuser } from "../users.js";
import { db } from "../db.js";
import bodyParser from "body-parser";
const require = createRequire(import.meta.url);
const express = require("express")
const templateapp = express()
/**
 * 
 * @param {templateapp} app 
 * @param {db} dbc
 */
export default function(app,dbc){
    app.get("/content/:id",async (req,res)=>{
        var obj = await verifyuser(req.headers["authorization"],dbc)
        if(obj.auth){
            console.log(`fetching ${req.params.id} by ${obj.id}`);
            var webhook = new WebhookClient({
                url:process.env.WEBHOOK
            });
            webhook.fetchMessage(req.params.id).then(message=>{
                if(message.content&&message.content!="")
                    res.status(200).send({
                        "content":message.content.replace(`<@&${config.role}>`,"__ping__")
                    })
                else
                    res.status(500).send({
                        "message":"Something went wrong. Try again later"
                    })
            })
            .catch(err=>{
                res.status(500).send({
                    "message":"Something went wrong. Try again later"
                })
                console.log(err)
            })
        }
        else
            res.status(401).send({message:"Unauthorized"});
    })
    app.patch("/content/:id",async (req,res)=>{
        var obj = await verifyuser(req.headers["authorization"],dbc)
        if(obj.auth){
            console.log(`fetching ${req.params.id} by ${obj.id}`);
            var webhook = new WebhookClient({
                url:process.env.WEBHOOK
            });
            webhook.fetchMessage(req.params.id).then(message=>{
                if(message.content&&message.content!=""){
                    if(req.body.content){
                        webhook.editMessage(req.params.id,{"content":req.body.content.replace("__ping__",`<@&${config.role}>`)});
                        res.sendStatus(204)
                    }
                    else
                        res.status(400).send({"message":"Wrong body"})
                }
                else
                    res.status(500).send({
                        "message":"Something went wrong. Try again later"
                    })
            })
            .catch(err=>{
                res.status(500).send({
                    "message":"Something went wrong. Try again later"
                })
                console.log(err)
            })
        }
        else
            res.status(401).send({message:"Unauthorized"});
    })
    app.delete("/content/:id",async (req,res)=>{
        var obj = await verifyuser(req.headers["authorization"],dbc)
        if(obj.auth){
            console.log(`fetching ${req.params.id} by ${obj.id}`);
            var webhook = new WebhookClient({
                url:process.env.WEBHOOK
            });
            webhook.fetchMessage(req.params.id).then(message=>{
                if(message.content&&message.content!=""){
                    webhook.deleteMessage(req.params.id)
                    res.sendStatus(204)
                }
                else
                    res.status(500).send({
                        "message":"Something went wrong. Try again later"
                    })
            })
            .catch(err=>{
                res.status(500).send({
                    "message":"Something went wrong. Try again later"
                })
                console.log(err)
            })
        }
        else
            res.status(401).send({message:"Unauthorized"});
    })

}