//backend/routes/procedimentos.js
const express = require('express');
const router = express.Router();
const Procedimento = require('../models/Procedimento');

// Cadastrar procedimentos
router.post('/adicionar', async (req, res) => {
  const { nome, tipo, dente, valor } = req.body;

  if (!nome || valor === undefined || valor === null || valor === '') {
    return res.status(400).json({ error: 'Preencha nome e valor' });
  }

  // 🔧 converte "160,00" ou "160.00" em número válido
  const valorNum = Number(
    String(valor)
      .replace(/\./g, '')   // remove separador de milhar se vier
      .replace(',', '.')    // troca vírgula por ponto
  );

  try {
    const novoProcedimento = new Procedimento({
      nome,
      tipo: tipo || '',
      dente: dente || '',
      valor: isNaN(valorNum) ? 0 : valorNum
    });

    await novoProcedimento.save();
    res.status(201).json({ message: 'Procedimento cadastrado com sucesso!' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar procedimento' });
  }
});


// Listar todos os Procedimento
router.get('/listar', async (req, res) => {
  try {
    const procedimentos = await Procedimento.find();
    res.json(procedimentos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar procedimento' });
  }
});

// Excluir Procedimento
router.delete('/excluir/:id', async (req, res) => {
  try {
    await Procedimento.findByIdAndDelete(req.params.id);
    res.json({ message: 'Procedimento excluído com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir Procedimento' });
  }
});

// Buscar medicamentos pelo nome (autocomplete)

router.get('/buscar', async (req, res) => {
  try {
    const nome = (req.query.nome || '').trim();
    if (!nome) return res.json([]); // sem query, não busca nada

    const procedimentos = await Procedimento.find({
      nome: { $regex: nome, $options: 'i' }
    }).limit(20);

    res.json(procedimentos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar procedimento' });
  }
});


module.exports = router;
