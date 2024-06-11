const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const timelineSchema = new Schema({
  round: String,
  playerId: String,
  quarter: Number,
  time: String,
  stat: String,
  difference: Number,
  fantasy: Number
});

const Timeline = mongoose.model('Timeline', timelineSchema);

module.exports = Timeline;
