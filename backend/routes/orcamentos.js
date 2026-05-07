const express = require('express');
const router = express.Router();
const Orcamento = require('../models/Orcamento');

router.get('/orcamentos/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params;
    const orcamentos = await Orcamento.find({ cpf }).sort({ data: -1 });
    res.json(orcamentos);
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    res.status(500).json({ erro: 'Erro ao buscar orçamentos' });
  }
});

router.delete('/orcamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Orcamento.findByIdAndDelete(id);
    res.json({ sucesso: true });
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    res.status(500).json({ erro: 'Erro ao excluir orçamento' });
  }
});

module.exports = router;