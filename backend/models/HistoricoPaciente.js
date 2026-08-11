const mongoose = require('mongoose');

const procedimentoHistoricoSchema =
  new mongoose.Schema(
    {
      procedimentoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Procedimento',
        required: true
      },

      nomeProcedimento: {
        type: String,
        required: true,
        trim: true
      }
    },
    {
      _id: false
    }
  );


const HistoricoPacienteSchema =
  new mongoose.Schema({

    cpf: {
      type: String,
      required: true,
      trim: true
    },

    data: {
      type: Date,
      required: true
    },

    procedimentos: {
      type: [procedimentoHistoricoSchema],
      required: true,

      validate: {
        validator: function (lista) {
          return Array.isArray(lista) &&
                 lista.length > 0;
        },

        message:
          'Informe pelo menos um procedimento'
      }
    },

    observacao: {
      type: String,
      required: true,
      trim: true
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


module.exports =
  mongoose.model(
    'HistoricoPaciente',
    HistoricoPacienteSchema
  );