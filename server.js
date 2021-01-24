
const express = require("express");
const app = express();
let mongoose = require("mongoose")
require("dotenv").config();

let db = require("./database.js");

app.use(express.static("public"));

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/:code", async (req, res) => {
  db.findOne({guild: {code: req.params.code}}, async (err, data) => {
    
  })
  
})

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});


let Discord = require("discord.js");
let client = new Discord.Client({
  disableMentions: "everyone"
});

client.on("ready", () => {
  console.log(`Ready to handle all url`)
});

// Bot

let config = process.env

client.login(config.token)

client.on("guildRemove", async guild => {
  
});

// connect to mongodb
mongoose.connect(config.mongo, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});