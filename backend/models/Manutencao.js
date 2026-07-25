const mongoose = require('mongoose');

const historicoSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    enum: [
      'criacao',
      'edicao',
      'alteracao_data',
      'whatsapp_aberto',
      'contato_confirmado',
      'agendamento',
      'conclusao',
      'cancelamento',
      'arquivamento',
      'proxima_manutencao_criada'
    ]
  },
  dataHora: {
    type: Date,
    default: Date.now
  },
  descricao: {
    type: String,
    required: true
  },
  usuario: {
    type: String,
    default: ''
  }
}, { _id: false });

const manutencaoSchema = new mongoose.Schema({
  pacienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true,
    index: true
  },
  pacienteNome: {
    type: String,
    required: true
  },
  cpf: {
    type: String,
    default: ''
  },
  telefone: {
    type: String,
    default: ''
  },
  tipoManutencao: {
    type: String,
    required: true,
    enum: ['Facetas em resina', 'Ortodontia', 'Limpeza']
  },
  dataUltimoAtendimento: {
    type: String,
    default: ''
  },
  intervaloMeses: {
    type: Number,
    required: true
  },
  dataProximaManutencao: {
    type: String,
    required: true,
    index: true
  },
  dataRealizacao: {
    type: String,
    default: ''
  },
  situacao: {
    type: String,
    enum: ['pendente', 'agendado', 'concluido', 'cancelado', 'arquivado'],
    default: 'pendente',
    index: true
  },
  observacoes: {
    type: String,
    default: ''
  },
  manutencaoAnteriorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manutencao',
    default: null
  },
  proximaManutencaoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manutencao',
    default: null
  },
  historico: {
    type: [historicoSchema],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Manutencao || mongoose.model('Manutencao', manutencaoSchema);
