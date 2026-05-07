const mongoose = require('mongoose');

const ControleFisicoSchema = new mongoose.Schema({
  data: String,
  horario: String,
  operador: String,
  temperatura: Number,
  pressao: Number,
  tempo: Number,
  fitaIndicadora: String
});

module.exports = mongoose.model('ControleFisico', ControleFisicoSchema);
