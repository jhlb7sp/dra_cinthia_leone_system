const mongoose = require('mongoose');

const AnamneseSchema = new mongoose.Schema({
    cpf: String,
    queixa_principal: String,
    alergia: String,
    alergia_qual: String,
    gravida: String,
    gravida_meses: String,
    cirurgia: String,
    cirurgia_qual: String,
    tratamento: String,
    tratamento_qual: String,
    medicamento: String,
    medicamento_qual: String,
    fuma: String,
    enfermidades: [String],
    enfermidade_outros: String,
    observacoesGerais: String
});

module.exports = mongoose.model('Anamnese', AnamneseSchema);
