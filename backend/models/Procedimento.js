// backend/models/Procedimento.js

const mongoose = require('mongoose');

const HistoricoPrecoSchema = new mongoose.Schema(
  {
    padrao: {
      type: Number,
      default: 0
    },

    especial1: {
      type: Number,
      default: 0
    },

    especial2: {
      type: Number,
      default: 0
    },

    alteradoEm: {
      type: Date,
      default: Date.now
    },

    origem: {
      type: String,
      enum: ['manual', 'importacao'],
      default: 'manual'
    }
  },
  {
    _id: false
  }
);


const ProcedimentoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },

  tipo: {
    type: String,
    default: ''
  },

  dente: {
    type: String,
    default: ''
  },

  // Mantido por compatibilidade com telas antigas
  valor: {
    type: Number,
    required: true
  },

  precos: {
    padrao: {
      type: Number,
      default: 0
    },

    especial1: {
      type: Number,
      default: 0
    },

    especial2: {
      type: Number,
      default: 0
    }
  },

  historicoPrecos: {
    type: [HistoricoPrecoSchema],
    default: []
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});


module.exports = mongoose.model(
  'Procedimento',
  ProcedimentoSchema
);