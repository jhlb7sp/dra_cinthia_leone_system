const mongoose = require('mongoose');

const CATEGORIAS_RECEITA = [
  'simples',
  'antimicrobiano',
  'controle_especial'
];

const MedicamentoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  mg: {
    type: String,
    required: true,
    trim: true
  },
  categoria: {
    type: String,
    enum: CATEGORIAS_RECEITA,
    required: true
  }
});

module.exports = mongoose.model(
  'Medicamento',
  MedicamentoSchema
);

module.exports.CATEGORIAS_RECEITA = CATEGORIAS_RECEITA;