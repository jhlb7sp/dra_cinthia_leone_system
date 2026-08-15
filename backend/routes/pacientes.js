const express = require('express');
const router = express.Router();
const Paciente = require('../models/Paciente');

// ✅ Rota para autocomplete por nome
router.get('/pacientes', async (req, res) => {
  const nome = req.query.nome;
  if (!nome) return res.status(400).json({ error: 'Nome não informado.' });

  try {
    const pacientes = await Paciente.find({
      nome: { $regex: nome, $options: 'i' }
    }).limit(5);

    res.json(pacientes);
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    res.status(500).json({ error: 'Erro ao buscar pacientes.' });
  }
});

// ✅ Buscar paciente pelo CPF
router.get('/pacientes/cpf/:cpf', async (req, res) => {
  const cpf = req.params.cpf;
  if (!cpf) return res.status(400).json({ error: 'CPF não informado.' });

  try {
    const paciente = await Paciente.findOne({ cpf: cpf });
    if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado.' });

    res.json(paciente);
  } catch (error) {
    console.error('Erro ao buscar paciente por CPF:', error);
    res.status(500).json({ error: 'Erro ao buscar paciente.' });
  }
});

// ✅ Busca por nome ou CPF
router.get('/pacientes/busca', async (req, res) => {
  try {
    const termo = req.query.termo || '';

    const pacientes = await Paciente.find({
      $or: [
        { nome: { $regex: termo, $options: 'i' } },
        { cpf: { $regex: termo, $options: 'i' } }
      ]
    }).limit(10);

    res.json(pacientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar pacientes' });
  }
});

// Excluir somente o cadastro principal do paciente
router.delete('/pacientes/:id', async (req, res) => {
  try {
    const pacienteExcluido = await Paciente.findByIdAndDelete(
      req.params.id
    );

    if (!pacienteExcluido) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Paciente não encontrado.'
      });
    }

    res.json({
      sucesso: true,
      mensagem: 'Paciente excluído com sucesso.'
    });
  } catch (error) {
    console.error('Erro ao excluir paciente:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Identificação do paciente inválida.'
      });
    }

    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao excluir paciente.'
    });
  }
});

// ✅ Aniversariantes do dia
router.get('/pacientes/aniversariantes-hoje', async (req, res) => {
  try {
    const hoje = new Date();
    const diaHoje = String(hoje.getDate()).padStart(2, '0');
    const mesHoje = String(hoje.getMonth() + 1).padStart(2, '0');

    const pacientes = await Paciente.find();

    const aniversariantes = pacientes.filter(paciente => {
      if (!paciente.dataNascimento) return false;

      const nascimento = paciente.dataNascimento;

      if (nascimento instanceof Date) {
        const dia = String(nascimento.getUTCDate()).padStart(2, '0');
        const mes = String(nascimento.getUTCMonth() + 1).padStart(2, '0');

        return dia === diaHoje && mes === mesHoje;
      }

      if (typeof nascimento === 'string') {
        const dataLimpa = nascimento.split('T')[0];
        const partes = dataLimpa.split('-');

        if (partes.length !== 3) return false;

        const mes = partes[1];
        const dia = partes[2];

        return dia === diaHoje && mes === mesHoje;
      }

      return false;
    });

    console.log('Aniversariantes de hoje:', aniversariantes.map(p => p.nome));

    res.json(aniversariantes);
  } catch (error) {
    console.error('Erro ao buscar aniversariantes:', error);
    res.status(500).json({ error: 'Erro ao buscar aniversariantes.' });
  }
});

module.exports = router;