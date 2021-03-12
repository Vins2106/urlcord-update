const { Schema, model } = require("mongoose");
module.exports = model(
  "url",
  new Schema({
    guild_id: String,
    code: String,
    used: Number,
    description: String,
    guild: {data: String, name: String, id: String, icon: String, code: String, redirect: String},
    user: {id: String, tag: String, username: String}
  })
);