const express = require("express");
const app = express();
let mongoose = require("mongoose");
require("dotenv").config();

let db = require("./database.js");

app.use(express.static("public"));

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/:code", async (req, res) => {
  db.findOne({ code: req.params.code }, async (err, data) => {
    if (err) {
      return res.json({ error: "Unable to find this code on database."})
    }
    
    if (data) {
      
      data.used + 1;
      data.save()
      
      return res.redirect(data.redirect)
      
    } else if (!data) {
      return res.json({error: "Unable to find this code on database."})
    }
  });
});

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

let Discord = require("discord.js");
let client = new Discord.Client({
  disableMentions: "everyone"
});

client.on("ready", () => {
  console.log(`Ready to handle all url`);
});

// Bot

let config = process.env;

client.login(config.token);

client.on("guildRemove", async guild => {
  
  db.findOne({ guild: {id: guild.id } }, async (err, data) => {
    if (err) return;
    
    if (data) {
      data.remove()
    } else {
      return;
    }
  })
  
});

// connect to mongodb
mongoose.connect(config.mongo, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (message.channel.type === "dm") return;
  
  let prefix = config.prefix;
  
  if (message.content.startsWith(prefix)) return;
  const args = message.content
    .slice(prefix.length)
    .trim()
    .split(/ +/g);
  const cmd = args.shift().toLowerCase();
  
  if (cmd === "help") {
    
  };
  
  if (cmd === "set") {
    
  };
  
  
});