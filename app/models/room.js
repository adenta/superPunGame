// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;
// set up a mongoose model and pass it using module.exports
var mySchema = new Schema({
   judge: String,
   url: String
 });
 mySchema.plugin(uniqueValidator);
module.exports = mongoose.model('Room',mySchema);
