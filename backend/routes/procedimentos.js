// backend/routes/procedimentos.js

const express = require('express');
const router = express.Router();
const Procedimento = require('../models/Procedimento');

function converterValor(valor) {
  if (valor === undefined || valor === null || valor === '') {
    return 0;
  }

  // Se já veio como número do Excel/JSON
  if (typeof valor === 'number') {
    return isNaN(valor) ? 0 : valor;
  }

  let texto = String(valor)
    .replace('R$', '')
    .trim();

  // Formato brasileiro: 1.250,50
  if (texto.includes(',')) {
    texto = texto
      .replace(/\./g, '')
      .replace(',', '.');
  }

  const numero = Number(texto);

  return isNaN(numero) ? 0 : numero;
}


// Cadastrar procedimento
router.post('/adicionar', async (req, res) => {
  const {
    nome,
    tipo,
    dente,
    valor,
    precos
  } = req.body;

  const valorPrincipal = precos?.padrao ?? valor;

  if (
    !nome ||
    valorPrincipal === undefined ||
    valorPrincipal === null ||
    valorPrincipal === ''
  ) {
    return res.status(400).json({
      error: 'Preencha nome e valor principal'
    });
  }

  try {
    const novoProcedimento = new Procedimento({
      nome,
      tipo: tipo || '',
      dente: dente || '',

      valor: converterValor(valorPrincipal),

      precos: {
        padrao: converterValor(valorPrincipal),
        especial1: converterValor(precos?.especial1),
        especial2: converterValor(precos?.especial2)
      },

      updatedAt: new Date()
    });

    await novoProcedimento.save();

    res.status(201).json({
      message: 'Procedimento cadastrado com sucesso!'
    });

  } catch (err) {
    console.error('Erro ao salvar procedimento:', err);

    res.status(500).json({
      error: 'Erro ao salvar procedimento'
    });
  }
});


// Listar todos os procedimentos
router.get('/listar', async (req, res) => {
  try {
    const procedimentos = await Procedimento.find();

    res.json(procedimentos);

  } catch (err) {
    console.error('Erro ao buscar procedimentos:', err);

    res.status(500).json({
      error: 'Erro ao buscar procedimento'
    });
  }
});


// Importar / atualizar procedimentos em lote
router.post('/importar', async (req, res) => {
  try {
    const procedimentos = req.body.procedimentos;

    if (!Array.isArray(procedimentos)) {
      return res.status(400).json({
        error: 'Lista de procedimentos inválida'
      });
    }

    let cadastrados = 0;
    let atualizados = 0;
    let ignorados = 0;
    let erros = 0;

    for (const item of procedimentos) {
      try {
        const nome = String(item.nome || '').trim();
        const tipo = String(item.tipo || '').trim();
        const dente = String(item.dente || '').trim();

        if (!nome) {
          erros++;
          continue;
        }

        const novoPadrao = converterValor(
          item.precos?.padrao ?? item.valorPrincipal ?? item.valor
        );

        const novoEspecial1 = converterValor(
          item.precos?.especial1 ?? item.valorDesconto
        );

        const novoEspecial2 = converterValor(
          item.precos?.especial2 ?? item.valorFamilia
        );


        let procedimentoExistente = null;


        // Primeiro tenta localizar pelo ID
        if (item._id || item.id) {
          const id = item._id || item.id;

          try {
            procedimentoExistente =
              await Procedimento.findById(id);
          } catch (err) {
            procedimentoExistente = null;
          }
        }


        // Caso não tenha encontrado pelo ID,
        // procura por nome + tipo + dente
        if (!procedimentoExistente) {
          procedimentoExistente =
            await Procedimento.findOne({
              nome: {
                $regex: `^${nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                $options: 'i'
              },
              tipo,
              dente
            });
        }


        // Não existe: cadastra novo
        if (!procedimentoExistente) {

          const novoProcedimento = new Procedimento({
            nome,
            tipo,
            dente,

            valor: novoPadrao,

            precos: {
              padrao: novoPadrao,
              especial1: novoEspecial1,
              especial2: novoEspecial2
            },

            updatedAt: new Date()
          });

          await novoProcedimento.save();

          cadastrados++;
          continue;
        }


        // Valores atuais
        const atualPadrao =
          converterValor(
            procedimentoExistente.precos?.padrao ??
            procedimentoExistente.valor
          );

        const atualEspecial1 =
          converterValor(
            procedimentoExistente.precos?.especial1
          );

        const atualEspecial2 =
          converterValor(
            procedimentoExistente.precos?.especial2
          );


        const houveAlteracao =
          atualPadrao !== novoPadrao ||
          atualEspecial1 !== novoEspecial1 ||
          atualEspecial2 !== novoEspecial2;


        // Nada mudou
        if (!houveAlteracao) {
          ignorados++;
          continue;
        }


        // Guarda valores antigos no histórico
        procedimentoExistente.historicoPrecos.push({
          padrao: atualPadrao,
          especial1: atualEspecial1,
          especial2: atualEspecial2,
          alteradoEm: new Date(),
          origem: 'importacao'
        });


        // Atualiza valores atuais
        procedimentoExistente.valor = novoPadrao;

        procedimentoExistente.precos = {
          padrao: novoPadrao,
          especial1: novoEspecial1,
          especial2: novoEspecial2
        };

        procedimentoExistente.updatedAt = new Date();

        await procedimentoExistente.save();

        atualizados++;

      } catch (err) {
        console.error(
          'Erro ao importar procedimento:',
          item,
          err
        );

        erros++;
      }
    }


    res.json({
      message: 'Importação concluída',
      resultado: {
        cadastrados,
        atualizados,
        ignorados,
        erros
      }
    });

  } catch (err) {
    console.error(
      'Erro geral na importação:',
      err
    );

    res.status(500).json({
      error: 'Erro ao importar procedimentos'
    });
  }
});


// Excluir procedimento
router.delete('/excluir/:id', async (req, res) => {
  try {
    await Procedimento.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Procedimento excluído com sucesso!'
    });

  } catch (err) {
    console.error('Erro ao excluir procedimento:', err);

    res.status(500).json({
      error: 'Erro ao excluir procedimento'
    });
  }
});

// ======================================================
// EDITAR PROCEDIMENTO
// ======================================================

router.put('/editar/:id', async (req, res) => {
  try {
    const procedimento = await Procedimento.findById(req.params.id);

    if (!procedimento) {
      return res.status(404).json({
        error: 'Procedimento não encontrado'
      });
    }

    const {
      nome,
      tipo,
      dente,
      precos
    } = req.body;

    if (!nome || precos?.padrao === undefined) {
      return res.status(400).json({
        error: 'Preencha nome e valor principal'
      });
    }

    const novoPadrao = converterValor(precos.padrao);
    const novoDesconto = converterValor(precos.especial1);
    const novoFamilia = converterValor(precos.especial2);

    const atualPadrao = converterValor(
      procedimento.precos?.padrao ?? procedimento.valor
    );

    const atualDesconto = converterValor(
      procedimento.precos?.especial1
    );

    const atualFamilia = converterValor(
      procedimento.precos?.especial2
    );

    const precoMudou =
      atualPadrao !== novoPadrao ||
      atualDesconto !== novoDesconto ||
      atualFamilia !== novoFamilia;

    // Só cria histórico se algum preço realmente mudou
    if (precoMudou) {
      procedimento.historicoPrecos.push({
        padrao: atualPadrao,
        especial1: atualDesconto,
        especial2: atualFamilia,
        alteradoEm: new Date(),
        origem: 'manual'
      });
    }

    procedimento.nome = nome.trim();
    procedimento.tipo = (tipo || '').trim();
    procedimento.dente = (dente || '').trim();

    procedimento.valor = novoPadrao;

    procedimento.precos = {
      padrao: novoPadrao,
      especial1: novoDesconto,
      especial2: novoFamilia
    };

    procedimento.updatedAt = new Date();

    await procedimento.save();

    res.json({
      message: 'Procedimento atualizado com sucesso!'
    });

  } catch (err) {
    console.error('Erro ao editar procedimento:', err);

    res.status(500).json({
      error: 'Erro ao atualizar procedimento'
    });
  }
});


// ======================================================
// HISTÓRICO DE PREÇOS
// ======================================================

router.get('/historico/:id', async (req, res) => {
  try {
    const procedimento = await Procedimento.findById(req.params.id);

    if (!procedimento) {
      return res.status(404).json({
        error: 'Procedimento não encontrado'
      });
    }

    res.json({
      _id: procedimento._id,
      nome: procedimento.nome,
      tipo: procedimento.tipo,
      dente: procedimento.dente,

      precos: {
        padrao:
          procedimento.precos?.padrao ??
          procedimento.valor ??
          0,

        especial1:
          procedimento.precos?.especial1 ?? 0,

        especial2:
          procedimento.precos?.especial2 ?? 0
      },

      historicoPrecos:
        [...(procedimento.historicoPrecos || [])]
          .sort(
            (a, b) =>
              new Date(b.alteradoEm) -
              new Date(a.alteradoEm)
          ),

      createdAt: procedimento.createdAt,
      updatedAt: procedimento.updatedAt
    });

  } catch (err) {
    console.error('Erro ao buscar histórico:', err);

    res.status(500).json({
      error: 'Erro ao buscar histórico de preços'
    });
  }
});


// Buscar procedimentos pelo nome
router.get('/buscar', async (req, res) => {
  try {
    const nome = (req.query.nome || '').trim();

    if (!nome) {
      return res.json([]);
    }

    const procedimentos = await Procedimento.find({
      nome: {
        $regex: nome,
        $options: 'i'
      }
    }).limit(20);

    res.json(procedimentos);

  } catch (err) {
    console.error('Erro ao buscar procedimento:', err);

    res.status(500).json({
      error: 'Erro ao buscar procedimento'
    });
  }
});


module.exports = router;