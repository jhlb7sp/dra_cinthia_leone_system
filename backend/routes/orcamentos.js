const express = require('express');
const router = express.Router();
const Orcamento = require('../models/Orcamento');

// ======================================================
// SALVAR ORÇAMENTO
// ======================================================

router.post('/orcamentos', async (req, res) => {
  try {

    const {
      pacienteNome,
      cpf,
      itens,
      observacaoGeral,
      desconto,
      parcelas,
      total,
      status
    } = req.body;


    if (!pacienteNome || !pacienteNome.trim()) {
      return res.status(400).json({
        erro: 'Informe o nome do paciente'
      });
    }


    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({
        erro: 'Adicione pelo menos um procedimento'
      });
    }


    const novoOrcamento = new Orcamento({

      pacienteNome: pacienteNome.trim(),

      // CPF OPCIONAL
      cpf: cpf || '',

      itens,

      observacaoGeral:
        observacaoGeral || '',

      desconto:
        Number(desconto) || 0,

      parcelas:
        Math.max(1, Number(parcelas) || 1),

      total:
        Number(total) || 0,

      status:
        status || 'gerado',

      data:
        new Date(),

      updatedAt:
        new Date()
    });


    await novoOrcamento.save();


    res.status(201).json({
      sucesso: true,
      message: 'Orçamento salvo com sucesso!',
      orcamento: novoOrcamento
    });


  } catch (error) {

    console.error(
      '======================================'
    );

    console.error(
      'ERRO AO SALVAR ORÇAMENTO'
    );

    console.error(error);

    console.error(
      'PAYLOAD RECEBIDO:'
    );

    console.log(
      JSON.stringify(req.body, null, 2)
    );

    console.error(
      '======================================'
    );


    res.status(500).json({
      erro: 'Erro ao salvar orçamento',

      // Por enquanto deixa isso para conseguirmos
      // identificar facilmente o problema.
      detalhes: error.message
    });
  }
});

// ======================================================
// BUSCAR ORÇAMENTO POR ID
// ======================================================

router.get('/orcamentos/detalhe/:id', async (req, res) => {
  try {

    const { id } = req.params;

    const orcamento =
      await Orcamento.findById(id);

    if (!orcamento) {
      return res.status(404).json({
        erro: 'Orçamento não encontrado'
      });
    }

    res.json(orcamento);

  } catch (error) {

    console.error(
      'Erro ao buscar orçamento por ID:',
      error
    );

    res.status(500).json({
      erro: 'Erro ao buscar orçamento'
    });
  }
});

// ======================================================
// BUSCAR ORÇAMENTOS POR CPF
// ======================================================

router.get('/orcamentos/:cpf', async (req, res) => {
  try {

    const { cpf } = req.params;

    const orcamentos =
      await Orcamento
        .find({ cpf })
        .sort({ data: -1 });

    res.json(orcamentos);

  } catch (error) {

    console.error(
      'Erro ao buscar orçamentos:',
      error
    );

    res.status(500).json({
      erro: 'Erro ao buscar orçamentos'
    });
  }
});


// ======================================================
// EXCLUIR ORÇAMENTO
// ======================================================

router.delete('/orcamentos/:id', async (req, res) => {
  try {

    const { id } = req.params;

    await Orcamento.findByIdAndDelete(id);

    res.json({
      sucesso: true
    });

  } catch (error) {

    console.error(
      'Erro ao excluir orçamento:',
      error
    );

    res.status(500).json({
      erro: 'Erro ao excluir orçamento'
    });
  }
});


module.exports = router;