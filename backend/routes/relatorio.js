const express = require('express');
const router = express.Router();
const Paciente = require('../models/Paciente');
const Faturamento = require('../models/Faturamento');
const Material = require('../models/Material');

// GET - Quantidade de Pacientes Ativos/Inativos
router.get('/pacientes', async (req, res) => {
  try {
    const ativos = await Paciente.countDocuments({ status: 'ativo' });
    const inativos = await Paciente.countDocuments({ status: 'inativo' });
    res.json({ ativos, inativos });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar pacientes' });
  }
});

// GET - Faturamento e Saída total dos últimos 30 dias
router.get('/faturamento', async (req, res) => {
  try {
    const dataInicial = new Date();
    dataInicial.setDate(dataInicial.getDate() - 30);

    const entrada = await Faturamento.aggregate([
      { $match: { tipo: 'entrada', data: { $gte: dataInicial } } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);

    const saida = await Faturamento.aggregate([
      { $match: { tipo: 'saida', data: { $gte: dataInicial } } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);

    res.json({
      entrada: entrada[0]?.total || 0,
      saida: saida[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar faturamento' });
  }
});

// GET - Materiais em Falta
router.get('/materiais', async (req, res) => {
  try {
    const emFalta = await Material.find({ quantidade: { $lte: 0 } });
    res.json(emFalta);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar materiais' });
  }
});

module.exports = router;
