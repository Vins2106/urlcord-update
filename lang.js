const { Schema, model } = require("mongoose");
module.exports = model(
  "lang",
  new Schema({
    lang: String
  })
);