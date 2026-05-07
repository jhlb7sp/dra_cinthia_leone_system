const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');

const NotaFiscal = require('../models/NotaFiscal');


// ===============================
// MULTER
// ===============================

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    cb(null, 'uploads/notas');

  },

  filename: (req, file, cb) => {

    const nomeArquivo =
      Date.now() + '-' + file.originalname;

    cb(null, nomeArquivo);

  }

});

const upload = multer({
  storage
});


// ===============================
// SALVAR NOTA
// ===============================

router.post(
  '/',
  upload.single('arquivo'),
  async (req, res) => {

    try {

      const {
        pacienteId,
        nomePaciente,
        cpf,
        email,
        valor,
        descricao,
        numeroNota,
        dataEmissao,
        codigoVerificacao
      } = req.body;

      const novaNota = new NotaFiscal({

        pacienteId,

        nomePaciente,

        cpf,

        email,

        valor,

        descricao,

        numeroNota,

        dataEmissao,

        codigoVerificacao,

        arquivoUrl: req.file
          ? `/uploads/notas/${req.file.filename}`
          : ''

      });

      await novaNota.save();

      res.status(201).json({
        success: true,
        nota: novaNota
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: 'Erro ao salvar nota'
      });

    }

  }
);


// ===============================
// LISTAR NOTAS PACIENTE
// ===============================

router.get(
  '/paciente/:pacienteId',
  async (req, res) => {

    try {

      const notas = await NotaFiscal.find({

        pacienteId: req.params.pacienteId

      }).sort({
        dataEmissao: -1
      });

      res.json(notas);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message: 'Erro ao buscar notas'
      });

    }

  }
);


// ===============================
// BUSCAR NOTA
// ===============================

router.get('/:id', async (req, res) => {

  try {

    const nota = await NotaFiscal.findById(
      req.params.id
    );

    if (!nota) {

      return res.status(404).json({
        message: 'Nota não encontrada'
      });

    }

    res.json(nota);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Erro ao buscar nota'
    });

  }

});

module.exports = router;