import { createRequire } from "module";
import { db } from "./db.js";
import { obtainoauth2 } from "./functions.js";
import { user, verifyuser } from "./users.js";
import bodyParser from "body-parser";
import { MessageEmbed, WebhookClient } from "discord.js";
import fetch from "node-fetch";
import { rateLimit } from "express-rate-limit";
import { longtermconfig, revokelongtermtoken } from "./long_term.js";

const require = createRequire(import.meta.url);

const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: true, // Disable the `X-RateLimit-*` headers
})
const express = require("express");
const config = require("./config.json");
const dbc  = new db();
require('dotenv').config();
var app = express();
if(process.env.DATABASE_URL)
    await longtermconfig(dbc);
console.log("Żyje")
app.use(limiter);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var port = process.env.PORT||config.port;
app.use("/",(req,res,next)=>{
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto']!="https") {
        return res.redirect("https://" + req.headers.host + req.url);
     }
    res.set('Access-Control-Allow-Origin', '*');
    if(req.method=="OPTIONS"){
        res.set("Access-Control-Allow-Headers","authorization");
        res.sendStatus(204);
    }
    else
        next()
})
app.get("/",(req,res)=>{
    res.status(200).send({code:0,message:"Working properly"})
    dbc.dbc.all("Select * from sessions",(err,rows)=>{
        console.log(rows);
    })
})
app.use("/verify",(req,res)=>{
    if(req.method=="GET"){
    if(req.headers["authorization"]){
        dbc.verify(req.headers["authorization"]).then(json=>{
            res.status(json.auth?200:401).send(json)
        })
    }
    else{
        res.status(401).send({auth:false})
    }}
    else
        res.sendStatus(204);
})
app.get("/login",(req,res)=>{
    obtainoauth2(req.query.code,config.ouath_url,effect=>{
        if(!effect)
            res.status(400).send({code:-1,message:"Error while processing your request"});
        else{
            dbc.register(effect["access_token"],effect["refresh_token"]).then(effectt=>{
                if(effectt === undefined)
                    res.status(400).send({code:-1,message:"Error while processing your request"});
                else
                    res.status(200).send({code:0,token:effectt})
            })
            
        }
    })
})
app.delete("/logout",(req,res)=>{
    if(req.headers["authorization"]!==undefined){
        dbc.logout(req.headers["authorization"]);
        res.sendStatus(204)
    }
    else
        res.status(400).send({message:"You aren't loginned"})
})
app.post("/send",(req,res)=>{
    console.log(req.body)
    if(req.body.content!==undefined){
        var webhook = new WebhookClient({
            url:process.env.WEBHOOK
        });
        console.log(req.headers["authorization"]);
        verifyuser(req.headers["authorization"],dbc).then(async auth=>{
            console.log(auth)
            if(auth.auth)
            {
                var us = new user(auth.id,dbc.dbc);
                var uso = await us.getuser();
                webhook.send({
                    content:req.body.content.replace("__ping__",`<@&${config.role}>`),
                    username:uso["nick_guild"],
                    allowedMentions:{
                        parse:[],
                        roles:[config.role]
                    },
                    avatarURL:`https://cdn.discordapp.com/avatars/${uso.id}/${uso["image_url"]}.png`
                }).then(ok=>{
                    console.log(ok)
                    res.sendStatus(204);
                })
                .catch(err=>{
                    console.error(err);
                    res.sendStatus(500);
                })
            }
            else
                res.status(401).send({message:"Unauthorized"});
            
        })
    }
    else
        res.status(400).send({message:"Wrong body"});
});
app.post("/sendembed",(req,res)=>{
    if(req.body.title&&req.body.color&&req.body.desc){
        var fields = req.body.fields||[];
        if(req.body.fields){
            fields = fields.replaceAll("\\","");
            if(fields[0]=="\"")
                fields=fields.substr(1);
            if(fields[fields.length-1]=="\"")
                fields=fields.substr(0,fields.length-1);
            fields = fields.split("},")
        }
        if(fields.length>25)
            return res.send(400).send({message:"You can send only 25 fields"})
        for(var i=0;i<fields.length;i++){
            if(i+1!=fields.length)
                fields[i]+="}";
            console.log(fields[i]);
            fields[i]=JSON.parse(fields[i])
        }
        console.log(fields+" "+typeof(fields));
        var embed = new MessageEmbed()
        .setTitle(req.body.title)
        .setColor(req.body.color)
        .setDescription(req.body.desc)
        .setFields(fields);
        verifyuser(req.headers["authorization"],dbc).then(async auth=>{
            if(auth.auth){
                var webhook = new WebhookClient({
                    url:process.env.WEBHOOK
                });
                var us = new user(auth.id,dbc.dbc);
                var uso = await us.getuser();
                webhook.send({
                    embeds:[embed],
                    username:uso["nick_guild"],
                    allowedMentions:{
                        parse:[],
                        roles:[config.role]
                    },
                    avatarURL:`https://cdn.discordapp.com/avatars/${uso.id}/${uso["image_url"]}.png`
                }).then(ok=>{
                    console.log(ok)
                    res.sendStatus(204);
                })
                .catch(err=>{
                    console.error(err);
                    res.sendStatus(500);
                })
            }
            else
                res.status(401).send({message:"Unauthorized"});
        })
    }
    else
        res.status(400).send({message:"Wrong body"});
})
app.get("/killswitch/:token",(req,res)=>{
    var oczekiwane = process.env.KILLTOKEN||"test";
    if(req.params.token==oczekiwane){
        fetch("https://api.heroku.com/apps/gpharmonogramapi",{
            method:"PATCH",
            body:JSON.stringify({
                "maintenance":true
            }),
            headers:{
                "Authorization":`Bearer ${process.env.HEROKU}`,
                "Accept":"application/vnd.heroku+json; version=3",
                "Content-Type":"application/json"
            }
        }).then(resp=>{
            console.log(resp.status);
            if(resp.status==200)
                res.status(200).send("Wyłączyłem");
            else
                res.status(500).send("Tak średnio bym powiedział. Spróbuj jeszcze raz");
        })
        .catch(err=>{
            console.log(err);
            res.status(500).send("Tak średnio bym powiedział. Spróbuj jeszcze raz");
        })
    }
    else
        res.status(403).send({"message":"Wrong token"})
});
app.get("/longterm/timeout/:token",async (req,res)=>{
    await dbc.logout(req.params.token);
    res.status(200).send("Tymczasowo odwołano");
});
app.get("/longterm/revoke/:token",async (req,res)=>{
    await revokelongtermtoken(req.params.token,dbc);
    res.status(200).send("Odwołano");
});
app.use("/",(req,res)=>{

    res.status(404).send({code:0,message:"404 Not found"});
})
var server_host = '0.0.0.0';
app.listen(port,()=>{
    console.log(`Listening on port ${port}`);
})
