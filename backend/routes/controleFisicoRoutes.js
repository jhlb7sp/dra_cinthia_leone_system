const express = require('express');
const router = express.Router();
const ControleFisico = require('../models/ControleFisico');

// GET
//router.get('/', async (req, res) => {
//  const registros = await ControleFisico.find();
//  res.json(registros);
//});
router.get('/', async (req, res) => {
  const { inicio, fim } = req.query;
  const filtro = {};

  if (inicio && fim) {
    filtro.data = { $gte: inicio, $lte: fim };
  }

  const registros = await ControleFisico.find(filtro);
  res.json(registros);
});

// POST
router.post('/', async (req, res) => {
  const novoRegistro = new ControleFisico(req.body);
  await novoRegistro.save();
  res.status(201).send('Registro Físico adicionado com sucesso.');
});

//DELETAR LINHA
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await ControleFisico.findByIdAndDelete(id);
  res.sendStatus(200);
});

module.exports = router;
