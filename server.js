
const express = require("express");
const app = express();
let db = require("quick.db");
let database = db.get(`database`);

if (!database) database = 0;

app.use(express.static("public"));

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/:code", async (req, res) => {
  if (!database) return res.json({error: "Url not found."})
  
  let find = database.find(x => x.guild.code == req.params.code);
  if (!find) return res.json({error: "Cannot find this code"})
  
  res.redirect(find.redirect);
})

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});


let Discord = require("discord.js");
let client = new Discord.Client({
  disableMentions: "everyone"
});

client.on("ready", () => {
  console.log(`Ready to handle ${database.length || 0} link`)
});

// Bot

let config = process.env

client.login(config.token)

client.on("guildRemove", async guild => {
  let find = db.find(x => x.guild.id === guild.id);
  if (find) return db.delete(`database.guild`)
});