const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  categoria: String,
  unidade: String,
  quantidade: { type: Number, default: 0 },
  valor: { type: Number, default: 0 },
  porPaciente: { type: Number, default: 0 }
});

module.exports = mongoose.models.Material || mongoose.model('Material', MaterialSchema);
