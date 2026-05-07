const express = require('express');
const router = express.Router();
const ControleBiologico = require('../models/ControleBiologico');

// GET
/*router.get('/', async (req, res) => {
  const registros = await ControleBiologico.find();
  res.json(registros);
});*/
router.get('/', async (req, res) => {
  const { inicio, fim } = req.query;
  const filtro = {};

  if (inicio && fim) {
    filtro.data = { $gte: inicio, $lte: fim };
  }

  const registros = await ControleBiologico.find(filtro);
  res.json(registros);
});

//DELETAR LINHA
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await ControleBiologico.findByIdAndDelete(id);
  res.sendStatus(200);
});


// POST
router.post('/', async (req, res) => {
  const novoRegistro = new ControleBiologico(req.body);
  await novoRegistro.save();
  res.status(201).send('Registro Biológico adicionado com sucesso.');
});

module.exports = router;
