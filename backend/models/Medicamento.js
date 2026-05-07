const mongoose = require('mongoose');

const MedicamentoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  mg: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Medicamento', MedicamentoSchema);