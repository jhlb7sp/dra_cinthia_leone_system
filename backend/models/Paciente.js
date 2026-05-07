
const mongoose = require('mongoose');

const pacienteSchema = new mongoose.Schema({
  nome: String,
  cpf: String,
  dataNascimento: String,
  telefone: String,
  email: String,
  status: String,
  endereco: {
    cep: String,
    rua: String,
    bairro: String,
    cidade: String,
    estado: String,
    numero: String,
    complemento: String,
  }
});

module.exports = mongoose.models.Paciente || mongoose.model('Paciente', pacienteSchema);
