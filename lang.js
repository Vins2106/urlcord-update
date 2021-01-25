const { Schema, model } = require("mongoose");
module.exports = model(
  "lang",
  new Schema({
    guild: String,
    lang: String
  })
);