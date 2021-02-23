const express = require("express");
const app = express();
let mongoose = require("mongoose");
require("dotenv").config();
const color = "#05eeff"
const passport =  require('passport');
const session = require("express-session");
const  Strategy = require("passport-discord").Strategy;
let bodyParser = require("body-parser");
const qdb = require("quick.db")
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// Discord Login
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});
var scopes = ['identify', /* 'connections', (it is currently broken) */ 'guilds', 'guilds.join'];
var prompt = 'consent'

passport.use(new Strategy({
    clientID: "802918584497733632",
    clientSecret: process.env.secret,
    callbackURL: 'https://urlcord.cf/callback',
    scope: scopes,
    prompt: prompt
}, function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
        return done(null, profile);
    });
}));

app.use(session({
    secret: 'ohmygodthisbestdiscordbot',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.get('/login', passport.authenticate('discord', { scope: scopes, prompt: prompt }), function(req, res) {});
app.get('/callback',
    passport.authenticate('discord', { failureRedirect: '/' }), function(req, res) { res.redirect('/') } // auth success
);


// database mongodb;
let db = require("./database.js");
let tkn = require("./token.js");
let botDB = require("./botdb.js");

// web system
app.use(express.static("public"));

app.get("/dashboard", checkAuth, async (req, res) => {
  let guildsData = req.user.guilds;
   
  res.render("dashboard.ejs", {
    req: req,
    res: res,
    db: db,
    guild: guildsData,
    client: client
  })
});

app.get("/dashboard/:guild_id", checkAuth, async (req, res) => {
  if (!client.guilds.cache.get(req.params.guild_id) || !client.guilds.cache.get(req.params.guild_id).members.cache.get(req.user.id).hasPermission("ADMINISTRATOR")) return res.redirect("/dashboard")
  
  db.findOne({guild_id: req.params.guild_id}, async (err, data) => {
    
    if (data) {
      res.render("guild.ejs", {
        req: req, 
        res: res,
        client: client,
        db: db,
        data: data
      })
    } else {
      res.redirect("/dashboard")
    }
    
  })
});

app.post("/dashboard/:guild_id", urlencodedParser, async (req, res) => {
  
  db.findOne({guild_id: req.params.guild_id}, async (err, data) => {
    
    if (data) {
      var newCode = req.body.code;
      if (!newCode) newCode = data.code;
      
      var newInvite = req.body.invite;
      if (!newInvite.startsWith("https://discord.gg/")) newInvite = data.guild.redirect;
      
      var newDesc = req.body.desc;
      
      
      data.code = newCode;
      data.description = newDesc;
      data.guild.code = newCode;
      data.save()
      
      console.log(`Data has been changes for ${data.guild.name} [${data.guild.id}]`)
      

      
      res.redirect(`/dashboard/${req.params.guild_id}`)
      
    } else {
      res.redirect("/dashboard")
    }
    
  })
  
});



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

  app.get("/chatbot", async (req, res) => {
    let token = req.query.token;
    if (!token) return res.status(404).send({error: "You need provide token! ?token=<Your_token>"});
    
    let msg = req.query.msg;
    if (!msg) msg = "hello";
    const fetch = require("node-fetch");
    
    tkn.findOne({token: token}, async (err, data) => {
      
      if (data) {
    const text = await fetch(`
http://api.brainshop.ai/get?bid=153852&key=dfJVP7Jdd8TVZPdE&uid=${data.user_id}}&msg=${encodeURIComponent(msg)}`)
      .then(res => res.json())
      .then(data => {
        res.status(200).send({message: {content: msg, reply: data.cnt}})
      });        
      } else {
        res.status(400).send({error: "We have some problem, please provide valid token, try to generate token or regenerate token"})
      }
      
    });
  });

app.get("/:code", async (req, res) => {
  db.findOne({ code: req.params.code }, async (err, data) => {
    if (data) {
      
      if (!data.guild.name) return res.send({error: "This guild is not up to date, try to resetup"})
      
      let desc = data.description;
      
      return res.render("link.ejs", {
        req: req,
        res: res,
        data: data,
        db: db, 
        client: client,
        desc: desc
      })
      
    } else if (!data) {
      return res.json({error: "Unable to find this code on database."})
    }
  });
});

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

let Discord = require("discord.js");

// Mobile Status
const Constants = require('discord.js/src/util/Constants.js');
Constants.DefaultOptions.ws.properties.$browser = "Discord Android"
let client = new Discord.Client({
  disableMentions: "everyone"
});

client.on("ready", () => {
  console.log(`Ready to handle all url`);
});

// Bot

let config = process.env;

client.login(config.token);

client.on("guildDelete", async guild => {
  
  db.findOne({guild_id: guild.id}, async (err, data) => {
    if (data) {
      data.remove()
      console.log(`Leave from ${guild.name} and delete all data`)
    } else {
      console.log(`Leave from ${guild.name}`)
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
  
  if (message.content.toLowerCase() === `<@${client.user.id}>` || message.content.toLowerCase() === `<@!${client.user.id}>`) {
    message.channel.send(`Hello **${message.author.username}**! You need my prefix? my prefix is **${prefix}**`)
  }  
  
  if (!message.content.toLowerCase().startsWith(prefix)) return;
  
  const args = message.content
    .slice(prefix.length)
    .trim()
    .split(/ +/g);
  const cmd = args.shift().toLowerCase();


    let ms = require("parse-ms")
    let pad_zero = num => (num < 10 ? '0' : '') + num;  
    let lastDaily = await qdb.get(`test.${message.author.id}`);
    let cooldown = 5000;
    try {
        
        if (lastDaily !== null && cooldown - (Date.now() - lastDaily) > 0) {
            let timeObj = ms(cooldown - (Date.now() - lastDaily));

       
                let mins = pad_zero(timeObj.minutes).padStart(2, "0"),
                secs = pad_zero(timeObj.seconds).padStart(2, "0");

            let finalTime = `**${mins}:${secs}**`;
            return message.channel.send(myembed(`Sorry, you cannot use command before ${finalTime}.`));
        } else {


  
  if (cmd === "invite" || cmd === "i") {
    qdb.set(`test.${message.author.id}`, Date.now())
     
    const embed = new Discord.MessageEmbed()
    .setAuthor(client.user.username + "", client.user.displayAvatarURL())
    .setColor(color)
    .setDescription(`you can use [this link](https://urlcord.cf/invite) to invite me`)
    
    message.channel.send(embed)
  }
  
  if (cmd === "help" || cmd === "h" || cmd === "commands") {
    qdb.set(`test.${message.author.id}`, Date.now())
    
    const embed = new Discord.MessageEmbed()
    .setAuthor('Make your own invite url', client.user.displayAvatarURL())
    .setColor(color)
    .addField(`${prefix}help`, 'Show this command, and commands list')
    .addField(`${prefix}set [channel]`, 'Set this server invite url channel')
    .addField(`${prefix}edit [new_code]`, 'Edit this server custom invite code')
    .addField(`${prefix}unsetup`, 'Unsetup this server custom invite url or delete')
    .addField(`${prefix}setup <channel>`, 'Setup the own invite url')
    .addField(`${prefix}link`, 'Get this server own invite link')
    .addField(`${prefix}tutorial`, 'Get the tutorial embed')
    .addField(`${prefix}information`, 'Get this server url info')
    .addField(`${prefix}description`, 'Set server description')
    .addField(`${prefix}chatbot`, 'Get chat bot api')
    .addField(`${prefix}stats`, 'Get bot stats')
    .addField(`${prefix}ping`, 'Get bot ping')
    .addField(`${prefix}invite`, 'Invite my bot')
    .setFooter(`©️ URLCORD.CF - 2021 | [] required, <> optional | react with 🔎 to search commands`)
    
    let m = await message.channel.send(embed);
    
    m.react("🔎")
    
    const filter = (reaction, user) => user.id !== client.user.id && user.id === message.author.id;
    var collector = m.createReactionCollector(filter)
    collector.on("collect", async (reaction, user) => {
      
      switch (reaction.emoji.name) {
        case "🔎":
          
  const filter2 = x => {

    return (x.author.id === message.author.id);

};
          
          m.delete();
          const msg = await message.channel.send(myembed("**Search commands**\ntype something to search commands"))
          
          
          let query = await message.channel.awaitMessages(filter2, {max: 1, time: 60000});
          if (!query.size) return msg.edit("Canceled");
          
          let search = query.first().content;
          
          let cmd = [
            {
              name: "help",
              description: "Get all commands"
            },
            {
              name: "set",
              description: "Set this server invite url"
            },
            {
              name: "edit",
              description: "Edit this server custom invite code"
            },
            {
              name: "setup",
              description: "Setup the own invite url"
            },
            {
              name: "unsetup",
              description: "Unsetup this server custom invite url or delete"
            },
            {
              name: "link",
              description: "Get this server own invite link"
            },
            {
              name: "tutorial",
              description: "Get the tutorial embed"
            },
            {
              name: "information",
              description: "Get this server url info"
            },
            {
              name: "description",
              description: "Set server description"
            },
            {
              name: "ping",
              description: "Get client ws ping"
            },
            {
              name: "stats",
              description: "Get bot stats"
            },
            {
              name: "chatbot",
              description: "Get chatbot api"
            },
            {
              name: "invite",
              description: "Invite me"
            }
          ]
          
          

          try {
          if (cmd.find(x => x.name == search.toLowerCase())) {
            let x = cmd.find(x => x.name == search.toLowerCase());
            
            message.channel.send(myembed(`Name: **${x.name}**\nDescription: **${x.description}**`))
          } else {
            return message.channel.send(myembed(`Im unable to find that command`))
          }            
          } catch (e) {
            return message.channel.send(`Oh no: ${e}`)
          }
          
          
          break;
      }
      
    })
  };
  
  if (cmd === "ping") {
    qdb.set(`test.${message.author.id}`, Date.now())
    
    let m = await message.channel.send(myembed(`Pinging...`))
    
    m.edit(myembed(`:ping_pong: Pong!! **${client.ws.ping}**ms`))
  }
  
  if (cmd === "set" || cmd === "channel") {
    qdb.set(`test.${message.author.id}`, Date.now())
    
    if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send(myembed("Error: You need Administrator permission"));
    
    let channel = message.mentions.channels.first();
    if (!channel) return message.channel.send(myembed(`Error: You must mentions channel first.`));
    
    if (!message.guild.me.hasPermission("CREATE_INSTANT_INVITE")) return message.channel.send(myembed("Error: Im need Create Invite permission"));
    
    db.findOne({guild_id: message.guild.id}, async (err, data) => {
      
      if (data) {
    const link = await channel.createInvite({maxAge: 0, maxUses: 0});
    
    message.channel.send(myembed(`Succes: This server invite url channel has been set to ${channel}`));
        data.guild.redirect = `https://discord.gg/${link.code}`
        data.save()
      } else {        
        return message.channel.send(myembed(`Error: This server do not setup, use **${prefix}setup** first.`)   )     
      }
      
    });
  
  };
  
  if (cmd === "description" || cmd === "desc") {
    qdb.set(`test.${message.author.id}`, Date.now())
    
    if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send(myembed('Error: You need Administrator permission'))
    
    db.findOne({guild_id: message.guild.id}, async (err, data) => {
      if (data) {
        let newCode = args.join(" ");
        if (!newCode) return message.channel.send(myembed(`Error: Please provide new description`))
        
        data.description = newCode;
        data.save()
        
        message.channel.send(myembed(`Succes: Succesfully set server description`))
        
      } else {
        return message.channel.send(myembed(`Error: This server do not setup custom invite link`))
      }
    });
    
  }
  
  if (cmd === "edit" || cmd === "code") {
    qdb.set(`test.${message.author.id}`, Date.now())
    
    if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send(myembed('Error: You need Administrator permission'))
    
    db.findOne({guild_id: message.guild.id}, async (err, data) => {
      if (data) {
        let newCode = args[0];
        if (!newCode) return message.channel.send(myembed(`Error: Please provide new code`))
        
        db.findOne({code: newCode}, async (err, datas) => {
          
          if (datas) {
            return message.channel.send(myembed(`Error: This code (**${newCode}**) already have guild, try another code`))
          } else {
            
            data.code = newCode;
            data.guild.code = newCode;
            data.save();
            
            return message.channel.send(myembed(`Succes: Succesfully set server invite to https://urlcord.cf/${newCode}`))
            
          }
          
        });
        
      } else {
        return message.channel.send(myembed(`Error: This server do not setup custom invite link`))
      }
    });
    
  }
  
  if (cmd === "setup" || cmd === "on" || cmd === "enable") {
    qdb.set(`test.${message.author.id}`, Date.now())
    
    if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send(myembed("Error: You need Administrator permission"));
    
    const channel = message.mentions.channels.first() || message.channel;
    
    db.findOne({guild_id: message.guild.id}, async (err, data) => {
      
      if (data) {
        return message.channel.send(myembed(`Error: This server already setup.`))
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
          description: "A nice server, join now!",
          guild: {data: message.guild, name: message.guild.name, id: message.guild.id, code: code, redirect: `https://discord.gg/${link.code}`},
          user: {id: message.author.id, tag: message.author.tag, username: message.author.username}
        });
        
        newData.save();
        
        message.channel.send(myembed(`Succes: Succesfully setup, the default url is https://urlcord.cf/${code} you can edit with **${prefix}edit <new_code>**`));            
          } else {
        const link = await channel.createInvite({maxAge: 0, maxUses: 0});
        
        let newData = new db({
          guild_id: message.guild.id,
          code: code,
          used: 0,
          description: "A nice server, join now!",
          guild: {data: message.guild, name: message.guild.name, id: message.guild.id, code: code, redirect: `https://discord.gg/${link.code}`},
          user: {id: message.author.id, tag: message.author.tag, username: message.author.username}
        });
        
        newData.save();
        
        message.channel.send(myembed(`Succes: Succesfully setup, the default url is https://urlcord.cf/${code} you can edit with **${prefix}edit <new_code>**`))        
          }
          
        }); 
        
      }
      
    });
    
    
  };
  
  if (cmd === "unsetup" || cmd === "off" || cmd === "disable") {
    qdb.set(`test.${message.author.id}`, Date.now())
    
    if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send(myembed("Error: You need Administrator permission"));
    
    db.findOne({guild_id: message.guild.id}, async (err, data) => {
      
      if (data) {
        
        
        data.remove();
        
        return message.channel.send(myembed(`Succes: Succesfully unsetup`))
        
      } else {
        
        return message.channel.send(myembed(`Error: This server do not setup`))
        
      }
      
    });
  }
  
  if (cmd === "link" || cmd.toLowerCase() === message.guild.name.toLowerCase()) {
    qdb.set(`test.${message.author.id}`, Date.now())
    
    db.findOne({guild_id: message.guild.id}, async (err, data) => {
      
      if (data) {
        return message.channel.send(myembed(`here: https://urlcord.cf/${data.guild.code}\nsetup by: ${data.user.tag} [${data.user.id}]`))
      } else {
        return message.channel.send(myembed(`Error: This server do not setup`))
      }
      
    })
    
  }
  
  if (cmd === "tutorial" || cmd === "howto") {
    qdb.set(`test.${message.author.id}`, Date.now())
    
    let lang = false;
    
    const en = new Discord.MessageEmbed()
    .setAuthor('How to tutorial', client.user.displayAvatarURL())
    .setColor(color)
    .addField("Step 1", `add me to your server with [this link](https://urlcord.cf/invite)`)
    .addField("Step 2", `give me create invite permission`)
    .addField("Step 3", `type **${prefix}setup <channel>** and you will got default invite url`)
    .addField("Step 4", `and you can edit with **${prefix}edit <new_code>**`)
    .addField("Step 5", `enjoy you custom invite url :D`)
    .setFooter(`add me on https://urlcord.cf | react for switching languages`)
    
    const id = new Discord.MessageEmbed()
    .setAuthor('How to tutorial', client.user.displayAvatarURL())
    .setColor(color)
    .addField("Langkah 1", `tambahkan saya mengunakan [link ini](https://urlcord.cf/invite)`)
    .addField("Langkah 2", `beri saya izin create invite`)
    .addField("Langkah 3", `ketik **${prefix}setup <channel>** dan kamu akan mendapatkan default url`)
    .addField("Langkah 4", `dan kamu bisa edit mengunakan **${prefix}edit <new_code>** command`)
    .addField("Langkah 5", `selamat menikmati custom discord vanity urlnya :D`)
    .setFooter(`tambahkan saya di https://urlcord.cf | React untuk berpindah bahasa`)    
    
    let m = await message.channel.send(en);
    
    m.react("🔄")
    
    const filter = (reaction, user) => user.id !== client.user.id && user.id === message.author.id;
    var collector = m.createReactionCollector(filter)
    collector.on("collect", async (reaction, user) => {
      
      switch (reaction.emoji.name) {
        case "🔄":
          
          if (!lang) {
          reaction.users.remove(user)
            
          m.edit(id)
          
            lang = true;
            
          } else if (lang) {
            
            reaction.users.remove(user)
            
            await m.edit(en)

            lang = false;
            
          }      
          
          
          break;
      }
      
    })    
    
  }
  
  if (cmd === "info" || cmd === "information" || cmd === "own") {
    qdb.set(`test.${message.author.id}`, Date.now())
    
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
    description: ${data.description},
    guild: {id: ${data.guild.id}, code: ${data.guild.code}, redirect: ${data.guild.redirect}}},
    user: {id: ${data.user.id}, tag: ${data.user.tag}, username: ${data.user.username}}
    }
    \`\`\``)
    .addField(`Normal Stuctures`, `\`\`\`
    guild_id: ${data.guild.id}
    code: ${data.code}
    used: ${data.used}x
    descrition: ${data.description}
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
        return message.channel.send(myembed(`Error: This server do not setup`))
      }
      
    })
  }
  
  if (cmd === "chatbot" || cmd === "cb") {
    qdb.set(`test.${message.author.id}`, Date.now())
    
    message.channel.send(`I send something to your dm`).then(x => x.delete({timeout: 5000}))
    
    tkn.findOne({user_id: message.author.id}, async (err, data) => {
      
      if (data) {
        if (args[0] === "regenerate") {
          let newToken = makeid(18);
          data.token = newToken;
          data.save()
          
          return message.member.send(myembed(`Succesfully regenerate:\n||${newToken}||\nhttps://urlcord.cf/chatbot?token=${newToken}&msg=hello`))
        }
        
        return message.member.send(myembed(`**You already have token!**\n||${data.token}||\n__Dont make people know this token, just you.__\nhttps://urlcord.cf/chatbot?token=${data.token}&msg=hello`))
      } else {
        let token = makeid(18);
        let newDb = new tkn({
          user_id: message.author.id,
          token: token
        });
        newDb.save();
        
        return message.member.send(myembed(`**Welcome to URLCORD.CF chat bot !!**\n**You can make your discord bot can chatting**\ntoken: ||${token}||\n__Dont make people know this token, just you.__\nhttps://urlcord.cf/chatbot?token=${token}&msg=hello`))
      }
      
    });
  }
  
  if (cmd === "stats") {
    qdb.set(`test.${message.author.id}`, Date.now())
    
    let users = 0;
    
    client.guilds.cache.map(x => {
      users = users + x.memberCount;
    });
    
    message.channel.send(myembed(`Server: **${client.guilds.cache.size}**\nUsers: **${users}**\nChannel: **${client.channels.cache.size}**`))
  }
  
  

        }

    } catch (error) {
        console.log(error);
        return message.channel.send(`Oopsie, unknown error I guess: ${error}`);
    }            
          
});

// global function
function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login")
}

function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function myembed(message) {
  let funcembed = new Discord.MessageEmbed()
  .setColor(color)
  .setDescription(`${message}`)
  .setFooter(`Optional Message`)
  
  return funcembed;
}  