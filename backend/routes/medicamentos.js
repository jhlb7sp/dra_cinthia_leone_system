const express = require('express');
const router = express.Router();
const Medicamento = require('../models/Medicamento');

function textoLimpo(valor) {
  return String(valor || '').trim();
}

function normalizarCategoria(valor) {
  const categoria = textoLimpo(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  const categoriasAceitas = {
    simples: 'simples',
    receita_simples: 'simples',
    antimicrobiano: 'antimicrobiano',
    antimicrobianos: 'antimicrobiano',
    antibiotico: 'antimicrobiano',
    antibioticos: 'antimicrobiano',
    controle_especial: 'controle_especial',
    controlada: 'controle_especial',
    receita_controlada: 'controle_especial'
  };

  return categoriasAceitas[categoria] || '';
}

function escaparRegex(valor) {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Cadastrar medicamento
router.post('/adicionar', async (req, res) => {
  const nome = textoLimpo(req.body.nome);
  const mg = textoLimpo(req.body.mg);
  const categoria = normalizarCategoria(req.body.categoria);

  if (!nome || !mg || !categoria) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }

  try {
    const existente = await Medicamento.findOne({
      nome: {
        $regex: `^${escaparRegex(nome)}$`,
        $options: 'i'
      },
      mg: {
        $regex: `^${escaparRegex(mg)}$`,
        $options: 'i'
      }
    });

    if (existente) {
      return res.status(409).json({
        error: 'Este medicamento e dosagem já estão cadastrados.'
      });
    }

    const novoMedicamento = new Medicamento({
      nome,
      mg,
      categoria
    });

    await novoMedicamento.save();

    res.status(201).json({
      message: 'Medicamento cadastrado com sucesso!',
      medicamento: novoMedicamento
    });
  } catch (err) {
    console.error('Erro ao salvar medicamento:', err);
    res.status(500).json({ error: 'Erro ao salvar medicamento' });
  }
});

// Importar medicamentos: atualiza pelo ID ou por Nome + MG e inclui os novos
router.post('/importar', async (req, res) => {
  const itens = Array.isArray(req.body.medicamentos)
    ? req.body.medicamentos
    : [];

  if (itens.length === 0) {
    return res.status(400).json({
      error: 'Nenhum medicamento válido foi enviado.'
    });
  }

  const invalidos = [];
  const medicamentosPreparados = [];

  itens.forEach((item, index) => {
    const nome = textoLimpo(item.nome);
    const mg = textoLimpo(item.mg);
    const categoria = normalizarCategoria(item.categoria);
    const id = textoLimpo(item._id || item.id);

    if (!nome || !mg || !categoria) {
      invalidos.push(index + 2);
      return;
    }

    medicamentosPreparados.push({
      id,
      nome,
      mg,
      categoria
    });
  });

  if (invalidos.length > 0) {
    return res.status(400).json({
      error: `Revise as linhas ${invalidos.join(', ')} da planilha.`
    });
  }

  try {
    let adicionados = 0;
    let atualizados = 0;

    for (const item of medicamentosPreparados) {
      let medicamento = null;

      if (
        item.id &&
        /^[a-f\d]{24}$/i.test(item.id)
      ) {
        medicamento = await Medicamento.findById(item.id);
      }

      if (!medicamento) {
        medicamento = await Medicamento.findOne({
          nome: {
            $regex: `^${escaparRegex(item.nome)}$`,
            $options: 'i'
          },
          mg: {
            $regex: `^${escaparRegex(item.mg)}$`,
            $options: 'i'
          }
        });
      }

      if (medicamento) {
        medicamento.nome = item.nome;
        medicamento.mg = item.mg;
        medicamento.categoria = item.categoria;
        await medicamento.save();
        atualizados++;
      } else {
        await Medicamento.create({
          nome: item.nome,
          mg: item.mg,
          categoria: item.categoria
        });
        adicionados++;
      }
    }

    res.json({
      message:
        `Importação concluída: ${adicionados} adicionado(s) e ` +
        `${atualizados} atualizado(s).`,
      adicionados,
      atualizados
    });
  } catch (err) {
    console.error('Erro ao importar medicamentos:', err);
    res.status(500).json({
      error: 'Erro ao importar medicamentos.'
    });
  }
});

// Listar todos os medicamentos
router.get('/listar', async (req, res) => {
  try {
    const medicamentos = await Medicamento.find()
      .sort({ nome: 1, mg: 1 });

    res.json(medicamentos);
  } catch (err) {
    console.error('Erro ao buscar medicamentos:', err);
    res.status(500).json({ error: 'Erro ao buscar medicamentos' });
  }
});

// Excluir medicamento
router.delete('/excluir/:id', async (req, res) => {
  try {
    const medicamento = await Medicamento.findByIdAndDelete(req.params.id);

    if (!medicamento) {
      return res.status(404).json({
        error: 'Medicamento não encontrado.'
      });
    }

    res.json({ message: 'Medicamento excluído com sucesso!' });
  } catch (err) {
    console.error('Erro ao excluir medicamento:', err);
    res.status(500).json({ error: 'Erro ao excluir medicamento' });
  }
});

// Buscar medicamentos pelo nome (autocomplete)

router.get('/', async (req, res) => {
  try {
    const nome = textoLimpo(req.query.nome);
    const filtro = nome
      ? {
          nome: {
            $regex: escaparRegex(nome),
            $options: 'i'
          }
        }
      : {};

    const medicamentos = await Medicamento.find(filtro)
      .sort({ nome: 1, mg: 1 })
      .limit(30);

    res.json(medicamentos);
  } catch (err) {
    console.error('Erro ao buscar medicamentos:', err);
    res.status(500).json({ error: 'Erro ao buscar medicamentos' });
  }
});

module.exports = router;