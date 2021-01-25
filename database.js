const { Schema, model } = require("mongoose");
module.exports = model(
  "url",
  new Schema({
    code: String,
    used: String,
    guild: {id: String, code: String, redirect: String},
    user: {id: String, tag: String, username: String}
  })
);