const { Schema, model } = require("mongoose");
module.exports = model(
  "bot",
  new Schema({
    bot_id: String,
    bots: {
      id: String,
      url: String,
      description: String,
      code: String,
      views: String
    }
  })
);