const mongoose = require('mongoose');

const playerStatSchema = new mongoose.Schema({
  playerId: String,
  quarter: Number,
  time: String,
  stat: String,
  difference: Number,
  fantasy: Number
});

const roundSchema = new mongoose.Schema({
  round: String,
  stats: [playerStatSchema]
});

const PlayerStat = mongoose.model('PlayerStat', playerStatSchema);
const Round = mongoose.model('Round', roundSchema);

module.exports = { PlayerStat, Round };