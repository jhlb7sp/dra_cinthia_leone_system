// backend/models/Orcamento.js

const mongoose = require('mongoose');


const itemOrcamentoSchema = new mongoose.Schema(
  {
    procedimentoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Procedimento',
      default: null
    },

    nomeProcedimento: {
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

    quantidade: {
      type: Number,
      default: 1
    },

    // Snapshot dos preços no momento do orçamento
    valorPrincipal: {
      type: Number,
      default: 0
    },

    valorDesconto: {
      type: Number,
      default: 0
    },

    valorFamilia: {
      type: Number,
      default: 0
    },

    // Valor realmente negociado/cobrado
    valorCobrado: {
      type: Number,
      required: true
    },

    valorTotal: {
      type: Number,
      default: 0
    },

    observacao: {
      type: String,
      default: ''
    },
    manutencao: {
      procedimentoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Procedimento',
        default: null
      },

      nomeProcedimento: {
        type: String,
        default: ''
      },

      valorPrincipal: {
        type: Number,
        default: 0
      },

      valorDesconto: {
        type: Number,
        default: 0
      },

      valorFamilia: {
        type: Number,
        default: 0
      },

      valorCobrado: {
        type: Number,
        default: 0
      }
    }

  },
  {
    _id: false
  }
);


const orcamentoSchema = new mongoose.Schema(
  {
    // CPF agora é opcional
    cpf: {
      type: String,
      default: '',
      index: true
    },

    pacienteNome: {
      type: String,
      required: true
    },

    data: {
      type: Date,
      default: Date.now
    },

    itens: {
      type: [itemOrcamentoSchema],
      default: []
    },

    observacaoGeral: {
      type: String,
      default: ''
    },

    desconto: {
      type: Number,
      default: 0
    },

    parcelas: {
      type: Number,
      default: 1
    },

    total: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      default: 'gerado'
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    updatedAt: {
      type: Date,
      default: Date.now
    },

    // ================================
    // CAMPOS ANTIGOS
    // Mantidos por compatibilidade
    // ================================

    paciente: {
      type: String,
      default: ''
    },

    procedimentos: {
      type: [
        new mongoose.Schema(
          {
            procedimento: {
              type: String
            },

            tipo: {
              type: String,
              default: ''
            },

            dente: {
              type: String,
              default: ''
            },

            valor: {
              type: Number,
              default: 0
            }
          },
          {
            _id: false
          }
        )
      ],

      default: []
    },

    totalComDesconto: {
      type: Number,
      default: 0
    }
  },
  {
    collection: 'orcamentos'
  }
);


module.exports = mongoose.model(
  'Orcamento',
  orcamentoSchema
);