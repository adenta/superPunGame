// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var random = require('mongoose-simple-random');

var Schema = mongoose.Schema;
// set up a mongoose model and pass it using module.exports
var mySchema = new Schema({
   name: { type: String, required: true, unique: true },
   first: String,
   last: String,
   phone: String,
   password: String,
   pun: String,
   score: Number
 });
 mySchema.plugin(uniqueValidator);
 mySchema.plugin(random);

module.exports = mongoose.model('User',mySchema);
