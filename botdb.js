const { Schema, model } = require("mongoose");
module.exports = model(
  "bot",
  new Schema({
    bot_id: String,
    views: String,
    description: String,
    url: {
      code: String,
      format: String,
    },
    enable: String
  })
);