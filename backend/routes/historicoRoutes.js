const express = require('express');
const router = express.Router();

const HistoricoPaciente =
  require('../models/HistoricoPaciente');


// ======================================================
// SALVAR ATENDIMENTO
// ======================================================

router.post('/historico', async (req, res) => {
  try {

    const {
      cpf,
      data,
      procedimentos,
      observacao
    } = req.body;


    // ==================================================
    // VALIDAÇÕES
    // ==================================================

    if (!cpf || !cpf.trim()) {
      return res.status(400).json({
        erro: 'CPF não informado'
      });
    }


    if (!data) {
      return res.status(400).json({
        erro: 'Data não informada'
      });
    }


    if (
      !Array.isArray(procedimentos) ||
      procedimentos.length === 0
    ) {
      return res.status(400).json({
        erro:
          'Informe pelo menos um procedimento'
      });
    }


    if (
      !observacao ||
      !observacao.trim()
    ) {
      return res.status(400).json({
        erro: 'Observação não informada'
      });
    }


    // Valida os procedimentos recebidos
    for (const procedimento of procedimentos) {

      if (
        !procedimento.procedimentoId ||
        !procedimento.nomeProcedimento
      ) {

        return res.status(400).json({
          erro:
            'Existe um procedimento inválido no atendimento'
        });

      }

    }


    // ==================================================
    // CRIAR REGISTRO
    // ==================================================

    const novoHistorico =
      new HistoricoPaciente({

        cpf:
          cpf.trim(),

        data:
          new Date(data),

        procedimentos:
          procedimentos.map(
            procedimento => ({

              procedimentoId:
                procedimento.procedimentoId,

              nomeProcedimento:
                procedimento.nomeProcedimento.trim()

            })
          ),

        observacao:
          observacao.trim(),

        updatedAt:
          new Date()

      });


    await novoHistorico.save();


    res.status(201).json({

      sucesso: true,

      message:
        'Atendimento registrado com sucesso!',

      historico:
        novoHistorico

    });


  } catch (error) {

    console.error(
      'Erro ao salvar histórico:',
      error
    );


    res.status(500).json({

      erro:
        'Erro ao salvar histórico',

      detalhes:
        error.message

    });

  }
});


// ======================================================
// BUSCAR HISTÓRICO DO PACIENTE POR CPF
// ======================================================

router.get('/historico/:cpf', async (req, res) => {

  try {

    const { cpf } =
      req.params;


    const historico =
      await HistoricoPaciente
        .find({
          cpf: cpf.trim()
        })
        .sort({
          data: -1,
          createdAt: -1
        });


    res.json(
      historico
    );


  } catch (error) {

    console.error(
      'Erro ao buscar histórico:',
      error
    );


    res.status(500).json({

      erro:
        'Erro ao buscar histórico'

    });

  }

});


// ======================================================
// BUSCAR UM ATENDIMENTO PELO ID
// ======================================================

router.get(
  '/historico/detalhe/:id',
  async (req, res) => {

    try {

      const { id } =
        req.params;


      const historico =
        await HistoricoPaciente
          .findById(id);


      if (!historico) {

        return res.status(404).json({

          erro:
            'Atendimento não encontrado'

        });

      }


      res.json(
        historico
      );


    } catch (error) {

      console.error(
        'Erro ao buscar atendimento:',
        error
      );


      res.status(500).json({

        erro:
          'Erro ao buscar atendimento'

      });

    }

  }
);


// ======================================================
// EDITAR ATENDIMENTO
// ======================================================

router.put(
  '/historico/:id',
  async (req, res) => {

    try {

      const { id } =
        req.params;


      const {
        data,
        procedimentos,
        observacao
      } = req.body;


      // ==================================================
      // VALIDAÇÕES
      // ==================================================

      if (!data) {

        return res.status(400).json({

          erro:
            'Data não informada'

        });

      }


      if (
        !Array.isArray(procedimentos) ||
        procedimentos.length === 0
      ) {

        return res.status(400).json({

          erro:
            'Informe pelo menos um procedimento'

        });

      }


      if (
        !observacao ||
        !observacao.trim()
      ) {

        return res.status(400).json({

          erro:
            'Observação não informada'

        });

      }


      for (
        const procedimento
        of procedimentos
      ) {

        if (
          !procedimento.procedimentoId ||
          !procedimento.nomeProcedimento
        ) {

          return res.status(400).json({

            erro:
              'Existe um procedimento inválido no atendimento'

          });

        }

      }


      // ==================================================
      // ATUALIZAR
      // ==================================================

      const historicoAtualizado =
        await HistoricoPaciente
          .findByIdAndUpdate(

            id,

            {

              data:
                new Date(data),

              procedimentos:
                procedimentos.map(
                  procedimento => ({

                    procedimentoId:
                      procedimento.procedimentoId,

                    nomeProcedimento:
                      procedimento.nomeProcedimento.trim()

                  })
                ),

              observacao:
                observacao.trim(),

              updatedAt:
                new Date()

            },

            {
              new: true,
              runValidators: true
            }

          );


      if (!historicoAtualizado) {

        return res.status(404).json({

          erro:
            'Atendimento não encontrado'

        });

      }


      res.json({

        sucesso: true,

        message:
          'Atendimento atualizado com sucesso!',

        historico:
          historicoAtualizado

      });


    } catch (error) {

      console.error(
        'Erro ao editar atendimento:',
        error
      );


      res.status(500).json({

        erro:
          'Erro ao editar atendimento',

        detalhes:
          error.message

      });

    }

  }
);


// ======================================================
// EXCLUIR ATENDIMENTO
// ======================================================

router.delete(
  '/historico/:id',
  async (req, res) => {

    try {

      const { id } =
        req.params;


      const historico =
        await HistoricoPaciente
          .findByIdAndDelete(id);


      if (!historico) {

        return res.status(404).json({

          erro:
            'Atendimento não encontrado'

        });

      }


      res.json({

        sucesso: true,

        message:
          'Atendimento excluído com sucesso!'

      });


    } catch (error) {

      console.error(
        'Erro ao excluir atendimento:',
        error
      );


      res.status(500).json({

        erro:
          'Erro ao excluir atendimento'

      });

    }

  }
);


module.exports = router;