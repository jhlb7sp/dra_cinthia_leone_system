const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Manutencao = require('../models/Manutencao');
const Paciente = require('../models/Paciente');

const INTERVALOS_MESES = {
  'Facetas em resina': 6,
  Ortodontia: 1,
  Limpeza: 6
};

function dataLocalHoje() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return hoje;
}

function parseDataLocal(dataTexto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataTexto || '')) return null;

  const [ano, mes, dia] = dataTexto.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setHours(0, 0, 0, 0);
  return data;
}

function formatarDataLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function adicionarMesesDataLocal(dataTexto, meses) {
  const data = parseDataLocal(dataTexto);
  if (!data) return '';

  const diaOriginal = data.getDate();
  const resultado = new Date(data.getFullYear(), data.getMonth() + meses, 1);
  const ultimoDiaMes = new Date(resultado.getFullYear(), resultado.getMonth() + 1, 0).getDate();

  resultado.setDate(Math.min(diaOriginal, ultimoDiaMes));
  resultado.setHours(0, 0, 0, 0);

  return formatarDataLocal(resultado);
}

function calcularStatusPrazo(dataProximaManutencao) {
  const proximaData = parseDataLocal(dataProximaManutencao);
  if (!proximaData) return 'Em dia';

  const hoje = dataLocalHoje();
  const diffMs = proximaData.getTime() - hoje.getTime();
  const diffDias = Math.round(diffMs / 86400000);

  if (diffDias < 0) return 'Vencido';
  if (diffDias === 0) return 'Vence hoje';
  if (diffDias <= 7) return 'Vencendo nos próximos 7 dias';

  return 'Em dia';
}

function estaEmAtencao(manutencao) {
  const statusPrazo = calcularStatusPrazo(manutencao.dataProximaManutencao);
  return ['Vencendo nos próximos 7 dias', 'Vence hoje', 'Vencido'].includes(statusPrazo);
}

function adicionarHistorico(manutencao, tipo, descricao, usuario = '') {
  manutencao.historico.push({
    tipo,
    descricao,
    usuario: usuario || ''
  });
}

function manutencaoComStatus(manutencao) {
  const dados = manutencao.toObject ? manutencao.toObject() : manutencao;
  return {
    ...dados,
    statusPrazo: calcularStatusPrazo(dados.dataProximaManutencao)
  };
}

function validarObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function montarDadosPaciente(pacienteId, body) {
  if (!validarObjectId(pacienteId)) {
    const erro = new Error('Paciente inválido.');
    erro.statusCode = 400;
    throw erro;
  }

  const paciente = await Paciente.findById(pacienteId);
  if (!paciente) {
    const erro = new Error('Paciente não encontrado.');
    erro.statusCode = 404;
    throw erro;
  }

  return {
    pacienteId: paciente._id,
    pacienteNome: body.pacienteNome || paciente.nome || '',
    cpf: String(body.cpf || paciente.cpf || '').replace(/\D/g, ''),
    telefone: body.telefone || paciente.telefone || ''
  };
}

function obterIntervalo(tipoManutencao) {
  return INTERVALOS_MESES[tipoManutencao] || 0;
}

router.get('/lembretes', async (req, res) => {
  try {
    const manutencoes = await Manutencao.find({
      situacao: { $in: ['pendente', 'agendado'] }
    }).sort({ dataProximaManutencao: 1 });

    const itens = manutencoes
      .filter(estaEmAtencao)
      .map(manutencaoComStatus);

    res.json({
      total: itens.length,
      itens
    });
  } catch (error) {
    console.error('Erro ao buscar lembretes de manutenção:', error);
    res.status(500).json({ erro: 'Erro ao buscar lembretes de manutenção.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { pacienteId, situacao, tipoManutencao, termo, atencao } = req.query;
    const filtro = {};

    if (pacienteId) {
      if (!validarObjectId(pacienteId)) {
        return res.status(400).json({ erro: 'Paciente inválido.' });
      }
      filtro.pacienteId = pacienteId;
    }

    if (situacao) {
      filtro.situacao = situacao;
    } else {
      filtro.situacao = { $ne: 'arquivado' };
    }
    if (tipoManutencao) filtro.tipoManutencao = tipoManutencao;

    if (termo) {
      const regex = { $regex: termo, $options: 'i' };
      filtro.$or = [
        { pacienteNome: regex },
        { cpf: regex },
        { telefone: regex }
      ];
    }

    const manutencoes = await Manutencao.find(filtro).sort({
      dataProximaManutencao: 1,
      pacienteNome: 1
    });

    const resultado = manutencoes
      .filter(item => atencao === 'true' ? estaEmAtencao(item) : true)
      .map(manutencaoComStatus);

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao listar manutenções:', error);
    res.status(500).json({ erro: 'Erro ao listar manutenções.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!validarObjectId(req.params.id)) {
      return res.status(400).json({ erro: 'Manutenção inválida.' });
    }

    const manutencao = await Manutencao.findById(req.params.id);
    if (!manutencao) return res.status(404).json({ erro: 'Manutenção não encontrada.' });

    res.json(manutencaoComStatus(manutencao));
  } catch (error) {
    console.error('Erro ao buscar manutenção:', error);
    res.status(500).json({ erro: 'Erro ao buscar manutenção.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      pacienteId,
      tipoManutencao,
      dataUltimoAtendimento,
      dataProximaManutencao,
      observacoes,
      usuario
    } = req.body;

    const intervaloMeses = obterIntervalo(tipoManutencao);
    if (!intervaloMeses) {
      return res.status(400).json({ erro: 'Tipo de manutenção inválido.' });
    }

    const snapshotsPaciente = await montarDadosPaciente(pacienteId, req.body);
    const proximaData = dataProximaManutencao || adicionarMesesDataLocal(dataUltimoAtendimento, intervaloMeses);

    if (!parseDataLocal(proximaData)) {
      return res.status(400).json({ erro: 'Informe uma data válida para a próxima manutenção.' });
    }

    const manutencao = new Manutencao({
      ...snapshotsPaciente,
      tipoManutencao,
      dataUltimoAtendimento: dataUltimoAtendimento || '',
      intervaloMeses,
      dataProximaManutencao: proximaData,
      situacao: 'pendente',
      observacoes: observacoes || ''
    });

    adicionarHistorico(manutencao, 'criacao', 'Manutenção criada.', usuario);
    await manutencao.save();

    res.status(201).json({
      sucesso: true,
      manutencao: manutencaoComStatus(manutencao)
    });
  } catch (error) {
    console.error('Erro ao criar manutenção:', error);
    res.status(error.statusCode || 500).json({ erro: error.message || 'Erro ao criar manutenção.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!validarObjectId(req.params.id)) {
      return res.status(400).json({ erro: 'Manutenção inválida.' });
    }

    const manutencao = await Manutencao.findById(req.params.id);
    if (!manutencao) return res.status(404).json({ erro: 'Manutenção não encontrada.' });

    const dataAnterior = manutencao.dataProximaManutencao;

    const camposPermitidos = [
      'pacienteNome',
      'cpf',
      'telefone',
      'dataUltimoAtendimento',
      'dataProximaManutencao',
      'observacoes'
    ];

    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        manutencao[campo] = campo === 'cpf'
          ? String(req.body[campo]).replace(/\D/g, '')
          : req.body[campo];
      }
    });

    if (req.body.tipoManutencao !== undefined) {
      const intervaloMeses = obterIntervalo(req.body.tipoManutencao);
      if (!intervaloMeses) return res.status(400).json({ erro: 'Tipo de manutenção inválido.' });
      manutencao.tipoManutencao = req.body.tipoManutencao;
      manutencao.intervaloMeses = intervaloMeses;
    }

    if (!parseDataLocal(manutencao.dataProximaManutencao)) {
      return res.status(400).json({ erro: 'Data da próxima manutenção inválida.' });
    }

    adicionarHistorico(manutencao, 'edicao', 'Dados da manutenção editados.', req.body.usuario);

    if (
      req.body.dataProximaManutencao !== undefined &&
      req.body.dataProximaManutencao !== dataAnterior
    ) {
      adicionarHistorico(
        manutencao,
        'alteracao_data',
        `Data alterada de ${dataAnterior || 'sem data'} para ${req.body.dataProximaManutencao}.`,
        req.body.usuario
      );
    }

    await manutencao.save();

    res.json({
      sucesso: true,
      manutencao: manutencaoComStatus(manutencao)
    });
  } catch (error) {
    console.error('Erro ao editar manutenção:', error);
    res.status(500).json({ erro: 'Erro ao editar manutenção.' });
  }
});

router.patch('/:id/data', async (req, res) => {
  try {
    if (!validarObjectId(req.params.id)) {
      return res.status(400).json({ erro: 'Manutenção inválida.' });
    }

    const { dataProximaManutencao, usuario } = req.body;
    if (!parseDataLocal(dataProximaManutencao)) {
      return res.status(400).json({ erro: 'Informe uma data válida.' });
    }

    const manutencao = await Manutencao.findById(req.params.id);
    if (!manutencao) return res.status(404).json({ erro: 'Manutenção não encontrada.' });

    const dataAnterior = manutencao.dataProximaManutencao;
    manutencao.dataProximaManutencao = dataProximaManutencao;

    adicionarHistorico(
      manutencao,
      'alteracao_data',
      `Data alterada de ${dataAnterior || 'sem data'} para ${dataProximaManutencao}.`,
      usuario
    );

    await manutencao.save();
    res.json({ sucesso: true, manutencao: manutencaoComStatus(manutencao) });
  } catch (error) {
    console.error('Erro ao alterar data da manutenção:', error);
    res.status(500).json({ erro: 'Erro ao alterar data da manutenção.' });
  }
});

router.patch('/:id/situacao', async (req, res) => {
  try {
    if (!validarObjectId(req.params.id)) {
      return res.status(400).json({ erro: 'Manutenção inválida.' });
    }

    const { situacao, usuario } = req.body;
    if (!['pendente', 'agendado', 'cancelado', 'arquivado'].includes(situacao)) {
      return res.status(400).json({ erro: 'Situação inválida para esta ação.' });
    }

    const manutencao = await Manutencao.findById(req.params.id);
    if (!manutencao) return res.status(404).json({ erro: 'Manutenção não encontrada.' });

    manutencao.situacao = situacao;

    const tipoHistorico = situacao === 'agendado'
      ? 'agendamento'
      : situacao === 'cancelado'
        ? 'cancelamento'
        : situacao === 'arquivado'
          ? 'arquivamento'
          : 'edicao';

    adicionarHistorico(manutencao, tipoHistorico, `Situação alterada para ${situacao}.`, usuario);
    await manutencao.save();

    res.json({ sucesso: true, manutencao: manutencaoComStatus(manutencao) });
  } catch (error) {
    console.error('Erro ao alterar situação da manutenção:', error);
    res.status(500).json({ erro: 'Erro ao alterar situação da manutenção.' });
  }
});

router.post('/:id/whatsapp-aberto', async (req, res) => {
  try {
    if (!validarObjectId(req.params.id)) {
      return res.status(400).json({ erro: 'Manutenção inválida.' });
    }

    const manutencao = await Manutencao.findById(req.params.id);
    if (!manutencao) return res.status(404).json({ erro: 'Manutenção não encontrada.' });

    adicionarHistorico(manutencao, 'whatsapp_aberto', 'Conversa do WhatsApp aberta.', req.body.usuario);
    await manutencao.save();

    res.json({ sucesso: true, manutencao: manutencaoComStatus(manutencao) });
  } catch (error) {
    console.error('Erro ao registrar abertura do WhatsApp:', error);
    res.status(500).json({ erro: 'Erro ao registrar abertura do WhatsApp.' });
  }
});

router.post('/:id/contato-confirmado', async (req, res) => {
  try {
    if (!validarObjectId(req.params.id)) {
      return res.status(400).json({ erro: 'Manutenção inválida.' });
    }

    const manutencao = await Manutencao.findById(req.params.id);
    if (!manutencao) return res.status(404).json({ erro: 'Manutenção não encontrada.' });

    adicionarHistorico(manutencao, 'contato_confirmado', 'Contato com o paciente confirmado.', req.body.usuario);
    await manutencao.save();

    res.json({ sucesso: true, manutencao: manutencaoComStatus(manutencao) });
  } catch (error) {
    console.error('Erro ao confirmar contato:', error);
    res.status(500).json({ erro: 'Erro ao confirmar contato.' });
  }
});

router.post('/:id/concluir', async (req, res) => {
  try {
    if (!validarObjectId(req.params.id)) {
      return res.status(400).json({ erro: 'Manutenção inválida.' });
    }

    const { dataRealizacao, usuario, observacoes } = req.body;
    if (!parseDataLocal(dataRealizacao)) {
      return res.status(400).json({ erro: 'Informe uma data de realização válida.' });
    }

    const manutencao = await Manutencao.findById(req.params.id);
    if (!manutencao) return res.status(404).json({ erro: 'Manutenção não encontrada.' });
    if (manutencao.situacao === 'concluido') {
      return res.status(400).json({ erro: 'Esta manutenção já foi concluída.' });
    }

    manutencao.situacao = 'concluido';
    manutencao.dataRealizacao = dataRealizacao;
    if (observacoes !== undefined) manutencao.observacoes = observacoes;

    adicionarHistorico(
      manutencao,
      'conclusao',
      observacoes
        ? `Manutenção concluída em ${dataRealizacao}. Observação: ${observacoes}`
        : `Manutenção concluída em ${dataRealizacao}.`,
      usuario
    );

    const proximaData = adicionarMesesDataLocal(dataRealizacao, manutencao.intervaloMeses);
    const proximaManutencao = new Manutencao({
      pacienteId: manutencao.pacienteId,
      pacienteNome: manutencao.pacienteNome,
      cpf: manutencao.cpf,
      telefone: manutencao.telefone,
      tipoManutencao: manutencao.tipoManutencao,
      dataUltimoAtendimento: dataRealizacao,
      intervaloMeses: manutencao.intervaloMeses,
      dataProximaManutencao: proximaData,
      situacao: 'pendente',
      observacoes: '',
      manutencaoAnteriorId: manutencao._id
    });

    adicionarHistorico(
      proximaManutencao,
      'criacao',
      'Manutenção criada automaticamente após conclusão anterior.',
      usuario
    );

    adicionarHistorico(
      proximaManutencao,
      'proxima_manutencao_criada',
      `Próxima manutenção calculada para ${proximaData}.`,
      usuario
    );

    await proximaManutencao.save();

    manutencao.proximaManutencaoId = proximaManutencao._id;
    adicionarHistorico(
      manutencao,
      'proxima_manutencao_criada',
      `Nova manutenção pendente criada para ${proximaData}.`,
      usuario
    );

    await manutencao.save();

    res.json({
      sucesso: true,
      manutencao: manutencaoComStatus(manutencao),
      proximaManutencao: manutencaoComStatus(proximaManutencao)
    });
  } catch (error) {
    console.error('Erro ao concluir manutenção:', error);
    res.status(500).json({ erro: 'Erro ao concluir manutenção.' });
  }
});

module.exports = router;
