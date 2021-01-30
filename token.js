const { Schema, model } = require("mongoose");
module.exports = model(
  "chatbot",
  new Schema({
    user_id: String,
    token: String
  })
);