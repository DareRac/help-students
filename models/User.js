const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  contact: {
    type: String,
    required: true,
    unique: true,
  },
});

userSchema.plugin(passportLocalMongoose); // ye username aur password ke liye fields bana dega database mei... sab kuch backside mei ho jaayega isse(basically humse hidden rhega humei bas method use krna h)...it will also take care that the usernames are unique...and it will also give some additional methods to use ....

module.exports = mongoose.model("User", userSchema);
