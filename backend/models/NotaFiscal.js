const mongoose = require('mongoose');

const notaFiscalSchema = new mongoose.Schema({

  pacienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true
  },

  nomePaciente: {
    type: String,
    required: true
  },

  cpf: {
    type: String,
    required: true
  },

  email: {
    type: String,
    default: ''
  },

  valor: {
    type: Number,
    required: true
  },

  descricao: {
    type: String,
    required: true
  },

  numeroNota: {
    type: String,
    required: true
  },

  dataEmissao: {
    type: Date,
    required: true
  },

  codigoVerificacao: {
    type: String,
    default: ''
  },

  arquivoUrl: {
    type: String,
    default: ''
  },

  status: {
    type: String,
    default: 'emitida'
  },

  criadoEm: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model(
  'NotaFiscal',
  notaFiscalSchema
);