const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const faturamentoSchema = new Schema({
  tipo: { type: String, enum: ['entrada', 'saida'], required: true },
  valor: { type: Number, required: true },
  data: { type: Date, required: true },
  pagamento: { type: String, enum: ['ok', 'pendente'], required: true }
});

module.exports = mongoose.models.Faturamento || mongoose.model('Faturamento', faturamentoSchema);
