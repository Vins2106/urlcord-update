const express = require("express");
const app = express();
let mongoose = require("mongoose");
require("dotenv").config();
const color = "#05eeff"

let db = require("./database.js");

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index.ejs", {
    req: req,
    res: res,
    db: db,
    client: client
  })
});

app.get("/invite", async (req, res) => {
  res.redirect("https://discord.com/oauth2/authorize?client_id=802918584497733632&permissions=8&scope=bot")
});

app.get("/:code", async (req, res) => {
  db.findOne({ code: req.params.code }, async (err, data) => {
    if (err) {
      return res.json({ error: "Unable to find this code on database."})
    }
    
    if (data) {
      
      data.used =  1;
      data.save()
      
      return res.redirect(data.guild.redirect)
      
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
  
  let prefix = "url"
  
  if (!message.content.startsWith(prefix)) return;
  
  const args = message.content
    .slice(prefix.length)
    .trim()
    .split(/ +/g);
  const cmd = args.shift().toLowerCase();
  
  if (cmd === "help") {
    const embed = new Discord.MessageEmbed()
    .setAuthor('Make your own invite url', client.user.displayAvatarURL())
    .setColor(color)
    .addField(`${prefix}help`, 'Show this command, and commands list')
    .addField(`${prefix}set`, 'Set this server invite url channel')
    .addField(`${prefix}edit`, 'Edit this server custom invite code')
    .addField(`${prefix}unsetup`, 'Unsetup this server custom invite url or delete')
    .addField(`${prefix}setup`, 'Setup the own invite url')
    .addField(`${prefix}link`, 'Get this server own invite link')
    .addField(`${prefix}tutorial`, 'Get the tutorial embed')
    .addField(`${prefix}info`, 'Get this server url info')
    .setFooter(`©️ URLCORD.CF - 2021`)
    
    message.channel.send(embed);
  };
  
  if (cmd === "set") {
    if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("Error: You need Administrator permission");
    
    let channel = message.mentions.channels.first();
    if (!channel) return message.channel.send(error(`Error: You must mentions channel first.`));
    
    if (!message.guild.me.hasPermission("CREATE_INSTANT_INVITE")) return message.channel.send("Error: Im need Create Invite permission");
    
    db.findOne({guild_id: message.guild.id}, async (err, data) => {
      
      if (data) {
        return message.channel.send(`Error: This server do not setup, use **${prefix}setup** first.`)
      } else {
    const link = await channel.createInvite({maxAge: 0, maxUses: 0});
    
    message.channel.send(`Succes: This server invite url channel has been set to ${channel}`);
        data.guild.redirect = `https://discord.gg/${link.code}`
        data.save()
        
      }
      
    });
  
  };
  
  if (cmd === "edit") {
    if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send('Error: You need Administrator permission')
    
    db.findOne({guild_id: message.guild.id}, async (err, data) => {
      if (data) {
        let newCode = args[0];
        if (!newCode) return message.channel.send(`Error: Please provide new code`)
        
        db.findOne({code: newCode}, async (err, datas) => {
          
          if (datas) {
            return message.channel.send(`Error: This code (**${newCode}**) already have guild, try another code`)
          } else {
            
            data.code = newCode;
            data.guild.code = newCode;
            data.save();
            
            return message.channel.send(`Succes: Succesfully set server invite to https://urlcord.cf/${newCode}`)
            
          }
          
        });
        
      } else {
        return message.channel.send(`Error: This server do not setup custom invite link`)
      }
    });
    
  }
  
  if (cmd === "setup") {
    if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("Error: You need Administrator permission");
    
    const channel = message.mentions.channels.first() || message.channel;
    
    db.findOne({guild_id: message.guild.id}, async (err, data) => {
      
      if (data) {
        return message.channel.send(`Error: This server already setup.`)
      } else {
        
        let code = "server" + makeid(2);
        db.findOne({code: code}, async (err, data) => {
          
          if (data) {
        const link = await channel.createInvite({maxAge: 0, maxUses: 0});
        let codeS = "server" + makeid(2);
            
        let newData = new db({
          guild_id: message.guild.id,
          code: codeS,
          used: 0,
          guild: {id: message.guild.id, code: code, redirect: `https://discord.gg/${link.code}`},
          user: {id: message.author.id, tag: message.author.tag, username: message.author.username}
        });
        
        newData.save();
        
        message.channel.send(`Succes: Succesfully setup, the default url is https://urlcord.cf/${code} you can edit with **${prefix}edit <new_code>**`);            
          } else {
        const link = await channel.createInvite({maxAge: 0, maxUses: 0});
        
        let newData = new db({
          guild_id: message.guild.id,
          code: code,
          used: 0,
          guild: {id: message.guild.id, code: code, redirect: `https://discord.gg/${link.code}`},
          user: {id: message.author.id, tag: message.author.tag, username: message.author.username}
        });
        
        newData.save();
        
        message.channel.send(`Succes: Succesfully setup, the default url is https://urlcord.cf/${code} you can edit with **${prefix}edit <new_code>**`);            
          }
          
        }); 
        
      }
      
    });
    
    
  };
  
  if (cmd === "unsetup") {
    if (!message.member.hasPermission("ADMINISTRATOR")) return message.channnel.send("Error: You need Administrator permission");
    
    db.findOne({guild_id: message.guild.id}, async (err, data) => {
      
      if (data) {
        
        
        data.remove();
        
        return message.channel.send(`Succes: Succesfully unsetup`)
        
      } else {
        
        return message.channel.send(`Error: This server do not setup`)
        
      }
      
    });
  }
  
  if (cmd === "link") {
    
    db.findOne({guild_id: message.guild.id}, async (err, data) => {
      
      if (data) {
        return message.channel.send(`here: https://urlcord.cf/${data.guild.code}\nsetup by: ${data.user.tag} [${data.user.id}]`)
      } else {
        return message.channel.send(`Error: This server do not setup`)
      }
      
    })
    
  }
  
  if (cmd === "tutorial") {
    const embed = new Discord.MessageEmbed()
    .setAuthor('How to tutorial', client.user.displayAvatarURL())
    .setColor(color)
    .addField("Step 1", `add me to your server with [this link](https://urlcord.cf/invite)`)
    .addField("Step 2", `give me create invite permission`)
    .addField("Step 3", `type **${prefix}setup <channel>** and you will got default invite url`)
    .addField("Step 4", `and you can edit with **${prefix}edit <new_code>**`)
    .addField("Step 5", `enjoy you custom invite url :D`)
    .setFooter(`add me on https://urlcord.cf`)
    
    message.channel.send(embed)
  }
  
  if (cmd === "info") {
    db.findOne({guild_id: message.guild.id}, async (err, data) => {

      if (data) {
    const embed = new Discord.MessageEmbed()
    .setAuthor(`${message.guild.name} Invite link information`, message.guild.iconURL())
    .setDescription(`This server invite link is https://urlcord.cf/${data.guild.code}`)
    .addField(`JS Structures`, `\`\`\`js
    {
    guild_id: ${data.guild.id},
    code: ${data.code},
    used: ${data.used},
    guild: {id: ${data.guild.id}, code: ${data.guild.code}, redirect: ${data.guild.redirect}}},
    user: {id: ${data.user.id}, tag: ${data.user.tag}, username: ${data.user.username}}
    }
    \`\`\``)
    .addField(`Normat Stuctures`, `\`\`\`
    guild_id: ${data.guild.id}
    code: ${data.code}
    used: ${data.used}x
    guild.id: ${data.guild.id}
    guild.code: ${data.guild.code}
    guild.redirect: ${data.guild.redirect}
    user.id: ${data.user.id}
    user.tag: ${data.user.tag}
    user.username: ${data.user.username}
    \`\`\``)
    .setColor(color)
    
    return message.channel.send(embed)
      } else {
        return message.channel.send(`Error: This server do not setup`)
      }
      
    })
  }
});

function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

async function error(message) {
  const embed = new Discord.MessageEmbed()
  .setColor("RED")
  .setDescription(message)
  
  return `${message}`;
}

async function succes(message) {
  const embed = new Discord.MessageEmbed()
  .setColor("GREEN")
  .setDescription(message)
  
  return `${message}`;
}

async function perms(permission) {
  return error(`Error: Im need **${permission}** permission`)
}