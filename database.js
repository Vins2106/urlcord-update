const { Schema, model } = require("mongoose");
module.exports = model(
  "url",
  new Schema({
    guild: {code: String, redirect: String},
    user: {id: String, tag: String, username: String}
  })
);