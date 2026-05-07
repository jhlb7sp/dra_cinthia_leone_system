const express = require('express');
const router = express.Router();
const Medicamento = require('../models/Medicamento');

// Cadastrar medicamento
router.post('/adicionar', async (req, res) => {
  const { nome, mg } = req.body;

  if (!nome || !mg) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }

  try {
    const novoMedicamento = new Medicamento({ nome, mg });
    await novoMedicamento.save();
    res.status(201).json({ message: 'Medicamento cadastrado com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar medicamento' });
  }
});

// Listar todos os medicamentos
router.get('/listar', async (req, res) => {
  try {
    const medicamentos = await Medicamento.find();
    res.json(medicamentos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar medicamentos' });
  }
});

// Excluir medicamento
router.delete('/excluir/:id', async (req, res) => {
  try {
    await Medicamento.findByIdAndDelete(req.params.id);
    res.json({ message: 'Medicamento excluído com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir medicamento' });
  }
});

// Buscar medicamentos pelo nome (autocomplete)

router.get('/', async (req, res) => {
  try {
    const nome = req.query.nome;
    const medicamentos = await Medicamento.find({ nome: { $regex: nome, $options: 'i' } });
    res.json(medicamentos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar medicamentos' });
  }
});

module.exports = router;
