//models/Orcamento.js
const mongoose = require('mongoose');

const procedimentoSchema = new mongoose.Schema({
  procedimento: { type: String, required: true },
  tipo: { type: String, default: '' },
  dente: { type: String, default: '' },
  valor: { type: Number, required: true }
}, { _id: false });

const orcamentoSchema = new mongoose.Schema({
  cpf: { type: String, required: true, index: true },
  paciente: { type: String, required: true },
  data: { type: Date, default: Date.now },
  procedimentos: { type: [procedimentoSchema], default: [] },
  desconto: { type: Number, default: 0 },
  parcelas: { type: Number, default: 1 },
  total: { type: Number, required: true },
  totalComDesconto: { type: Number, default: 0 }
}, {
  collection: 'orcamentos'
});

module.exports = mongoose.model('Orcamento', orcamentoSchema);