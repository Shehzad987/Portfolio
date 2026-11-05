const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    }
  },
  {
    timestamps: true,
    collection: "Messages"
  }
);

module.exports = mongoose.model("Message", messageSchema);