const mongoose = require('mongoose');

const ControleBiologicoSchema = new mongoose.Schema({
  data: String,
  lote: String,
  resultado: String,
  dataLeitura: String,
  responsavel: String,
  observacoes: String
});

module.exports = mongoose.model('ControleBiologico', ControleBiologicoSchema);
