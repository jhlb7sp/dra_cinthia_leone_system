//models/Procedimentos.js
const mongoose = require('mongoose');

const ProcedimentoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  tipo: { type: String, default: '' },   // opcional
  dente: { type: String, default: '' },  // opcional
  valor: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Procedimento', ProcedimentoSchema);
