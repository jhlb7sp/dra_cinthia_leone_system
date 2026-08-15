const API_MANUTENCOES = 'http://localhost:3000/api/manutencoes';
const API_PACIENTES = 'http://localhost:3000/api/pacientes';

const INTERVALOS_MESES = {
  'Facetas em resina': 6,
  Ortodontia: 1,
  Limpeza: 6
};

const estado = {
  manutencoes: [],
  pacienteSelecionado: null,
  editando: null,
  manutencaoConclusao: null
};

const elementos = {};

document.addEventListener('DOMContentLoaded', iniciarTela);

function iniciarTela() {
  mapearElementos();
  configurarEventos();
  aplicarFiltroInicialUrl();
  carregarManutencoes();
}

function mapearElementos() {
  elementos.btnAbrirFormulario = document.getElementById('btnAbrirFormulario');
  elementos.painelFormulario = document.getElementById('painelFormulario');
  elementos.formManutencao = document.getElementById('formManutencao');
  elementos.manutencaoId = document.getElementById('manutencaoId');
  elementos.pacienteId = document.getElementById('pacienteId');
  elementos.pacienteCpf = document.getElementById('pacienteCpf');
  elementos.pacienteTelefone = document.getElementById('pacienteTelefone');
  elementos.pacienteBusca = document.getElementById('pacienteBusca');
  elementos.listaPacientes = document.getElementById('listaPacientes');
  elementos.tipoManutencao = document.getElementById('tipoManutencao');
  elementos.dataUltimoAtendimento = document.getElementById('dataUltimoAtendimento');
  elementos.dataProximaManutencao = document.getElementById('dataProximaManutencao');
  elementos.observacoes = document.getElementById('observacoes');
  elementos.btnCancelar = document.getElementById('btnCancelar');
  elementos.btnSalvar = document.getElementById('btnSalvar');
  elementos.filtroTermo = document.getElementById('filtroTermo');
  elementos.filtroTipo = document.getElementById('filtroTipo');
  elementos.filtroSituacao = document.getElementById('filtroSituacao');
  elementos.filtroAtencao = document.getElementById('filtroAtencao');
  elementos.btnFiltrar = document.getElementById('btnFiltrar');
  elementos.btnLimparFiltros = document.getElementById('btnLimparFiltros');
  elementos.totalManutencoes = document.getElementById('totalManutencoes');
  elementos.mensagemLista = document.getElementById('mensagemLista');
  elementos.tabelaManutencoes = document.getElementById('tabelaManutencoes');
  elementos.modalHistorico = document.getElementById('modalHistorico');
  elementos.tituloHistorico = document.getElementById('tituloHistorico');
  elementos.subtituloHistorico = document.getElementById('subtituloHistorico');
  elementos.listaHistorico = document.getElementById('listaHistorico');
  elementos.btnFecharHistorico = document.getElementById('btnFecharHistorico');
  elementos.modalConclusao = document.getElementById('modalConclusao');
  elementos.subtituloConclusao = document.getElementById('subtituloConclusao');
  elementos.dataRealizacao = document.getElementById('dataRealizacao');
  elementos.observacaoConclusao = document.getElementById('observacaoConclusao');
  elementos.btnFecharConclusao = document.getElementById('btnFecharConclusao');
  elementos.btnCancelarConclusao = document.getElementById('btnCancelarConclusao');
  elementos.btnConfirmarConclusao = document.getElementById('btnConfirmarConclusao');
}

function configurarEventos() {
  elementos.btnAbrirFormulario.addEventListener('click', () => abrirFormulario());
  elementos.btnCancelar.addEventListener('click', fecharFormulario);
  elementos.formManutencao.addEventListener('submit', salvarManutencao);

  elementos.pacienteBusca.addEventListener('input', buscarPacientes);
  elementos.tipoManutencao.addEventListener('change', calcularProximaDataFormulario);
  elementos.dataUltimoAtendimento.addEventListener('change', calcularProximaDataFormulario);

  elementos.btnFiltrar.addEventListener('click', carregarManutencoes);
  elementos.btnLimparFiltros.addEventListener('click', limparFiltros);

  elementos.filtroTermo.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') carregarManutencoes();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.autocomplete-wrap')) {
      esconderAutocomplete();
    }
  });

  elementos.btnFecharHistorico.addEventListener('click', fecharHistorico);
  elementos.modalHistorico.addEventListener('click', (event) => {
    if (event.target === elementos.modalHistorico) fecharHistorico();
  });
  elementos.btnFecharConclusao.addEventListener('click', fecharModalConclusao);
  elementos.btnCancelarConclusao.addEventListener('click', fecharModalConclusao);
  elementos.btnConfirmarConclusao.addEventListener('click', confirmarConclusao);
  elementos.modalConclusao.addEventListener('click', (event) => {
    if (event.target === elementos.modalConclusao) fecharModalConclusao();
  });

  elementos.tabelaManutencoes.addEventListener('click', tratarCliqueTabela);
  elementos.tabelaManutencoes.addEventListener('change', tratarMudancaTabela);
}

function aplicarFiltroInicialUrl() {
  const params = new URLSearchParams(window.location.search);
  const filtro = params.get('filtro') || params.get('atencao');

  if (filtro === 'atencao' || filtro === 'true') {
    elementos.filtroAtencao.checked = true;
  }
}

async function carregarManutencoes() {
  elementos.mensagemLista.textContent = 'Carregando...';
  elementos.tabelaManutencoes.innerHTML = '<tr><td colspan="7" class="estado-vazio">Carregando manutenções...</td></tr>';

  const params = new URLSearchParams();
  const termo = elementos.filtroTermo.value.trim();
  const tipo = elementos.filtroTipo.value;
  const situacao = elementos.filtroSituacao.value;

  if (termo) params.set('termo', termo);
  if (tipo) params.set('tipoManutencao', tipo);
  if (situacao) params.set('situacao', situacao);
  if (elementos.filtroAtencao.checked) params.set('atencao', 'true');

  try {
    const url = params.toString() ? `${API_MANUTENCOES}?${params}` : API_MANUTENCOES;
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error('Erro ao carregar manutenções.');

    estado.manutencoes = await resposta.json();
    renderizarTabela();
  } catch (error) {
    console.error(error);
    elementos.totalManutencoes.textContent = '0';
    elementos.mensagemLista.textContent = 'Não foi possível carregar as manutenções.';
    elementos.tabelaManutencoes.innerHTML = '<tr><td colspan="7" class="estado-vazio">Erro ao carregar dados.</td></tr>';
  }
}

function renderizarTabela() {
  elementos.totalManutencoes.textContent = estado.manutencoes.length;
  elementos.mensagemLista.textContent = estado.manutencoes.length
    ? 'Lista atualizada.'
    : 'Nenhuma manutenção encontrada para os filtros informados.';

  if (!estado.manutencoes.length) {
    elementos.tabelaManutencoes.innerHTML = '<tr><td colspan="7" class="estado-vazio">Nenhuma manutenção cadastrada.</td></tr>';
    return;
  }

  elementos.tabelaManutencoes.innerHTML = estado.manutencoes.map(manutencao => `
    <tr>
      <td>
        <span class="paciente-nome">${escapeHtml(manutencao.pacienteNome)}</span>
        <span class="paciente-cpf">${formatarCPF(manutencao.cpf)}</span>
      </td>
      <td>${escapeHtml(manutencao.tipoManutencao)}</td>
      <td>${formatarDataBR(manutencao.dataUltimoAtendimento)}</td>
      <td>${formatarDataBR(manutencao.dataProximaManutencao)}</td>
      <td>${montarBadgePrazo(manutencao.statusPrazo)}</td>
      <td>${montarSelectSituacao(manutencao)}</td>
      <td>
        <div class="acoes-tabela">
          <button type="button" class="btn-whatsapp" data-acao="whatsapp" data-id="${manutencao._id}">WhatsApp</button>
          <button type="button" data-acao="agendar" data-id="${manutencao._id}">Agendar</button>
          <button type="button" class="btn-secundario" data-acao="historico" data-id="${manutencao._id}">Histórico</button>
          <button type="button" class="btn-editar" data-acao="editar" data-id="${manutencao._id}">Editar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function tratarCliqueTabela(event) {
  const botao = event.target.closest('[data-acao]');
  if (!botao) return;

  const manutencao = estado.manutencoes.find(item => item._id === botao.dataset.id);
  if (!manutencao) return;

  const acoes = {
    editar: () => abrirFormularioEdicao(manutencao),
    whatsapp: () => abrirWhatsApp(manutencao),
    agendar: () => abrirAgendaParaManutencao(manutencao),
    historico: () => abrirHistorico(manutencao)
  };

  if (acoes[botao.dataset.acao]) acoes[botao.dataset.acao]();
}

function tratarMudancaTabela(event) {
  const selectSituacao = event.target.closest('[data-acao="situacao"]');
  if (!selectSituacao) return;

  const manutencao = estado.manutencoes.find(item => item._id === selectSituacao.dataset.id);
  if (!manutencao) return;

  const novaSituacao = selectSituacao.value;

  if (novaSituacao === manutencao.situacao) return;

  if (novaSituacao === 'excluido') {
    excluirManutencao(manutencao, selectSituacao);
    return;
  }

  if (novaSituacao === 'concluido') {
    selectSituacao.value = manutencao.situacao;
    concluirManutencao(manutencao);
    return;
  }

  alterarSituacao(manutencao, novaSituacao, selectSituacao);
}

function abrirFormulario() {
  limparFormulario();
  elementos.painelFormulario.hidden = false;
  elementos.btnAbrirFormulario.textContent = 'Ocultar Formulário';
  elementos.pacienteBusca.focus();
}

function abrirFormularioEdicao(manutencao) {
  estado.editando = manutencao;
  estado.pacienteSelecionado = {
    _id: manutencao.pacienteId,
    nome: manutencao.pacienteNome,
    cpf: manutencao.cpf,
    telefone: manutencao.telefone
  };

  elementos.manutencaoId.value = manutencao._id;
  elementos.pacienteId.value = manutencao.pacienteId || '';
  elementos.pacienteCpf.value = manutencao.cpf || '';
  elementos.pacienteTelefone.value = manutencao.telefone || '';
  elementos.pacienteBusca.value = manutencao.pacienteNome || '';
  elementos.tipoManutencao.value = manutencao.tipoManutencao || '';
  elementos.dataUltimoAtendimento.value = manutencao.dataUltimoAtendimento || '';
  elementos.dataProximaManutencao.value = manutencao.dataProximaManutencao || '';
  elementos.observacoes.value = manutencao.observacoes || '';

  elementos.painelFormulario.hidden = false;
  elementos.btnAbrirFormulario.textContent = 'Ocultar Formulário';
  elementos.btnSalvar.textContent = 'Salvar Alterações';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fecharFormulario() {
  limparFormulario();
  elementos.painelFormulario.hidden = true;
  elementos.btnAbrirFormulario.textContent = 'Nova Manutenção';
}

function limparFormulario() {
  estado.editando = null;
  estado.pacienteSelecionado = null;
  elementos.formManutencao.reset();
  elementos.manutencaoId.value = '';
  elementos.pacienteId.value = '';
  elementos.pacienteCpf.value = '';
  elementos.pacienteTelefone.value = '';
  elementos.btnSalvar.textContent = 'Salvar';
  esconderAutocomplete();
}

async function salvarManutencao(event) {
  event.preventDefault();

  const id = elementos.manutencaoId.value;
  const pacienteId = elementos.pacienteId.value;
  const tipoManutencao = elementos.tipoManutencao.value;
  const dataProximaManutencao = elementos.dataProximaManutencao.value;

  if (!id && !pacienteId) {
    alert('Selecione um paciente na lista de sugestões.');
    elementos.pacienteBusca.focus();
    return;
  }

  if (!tipoManutencao || !dataProximaManutencao) {
    alert('Preencha tipo e data da próxima manutenção.');
    return;
  }

  const payload = {
    pacienteId,
    pacienteNome: elementos.pacienteBusca.value.trim(),
    cpf: elementos.pacienteCpf.value,
    telefone: elementos.pacienteTelefone.value,
    tipoManutencao,
    dataUltimoAtendimento: elementos.dataUltimoAtendimento.value,
    dataProximaManutencao,
    observacoes: elementos.observacoes.value.trim(),
    usuario: sessionStorage.getItem('usuarioLogado') || ''
  };

  try {
    elementos.btnSalvar.disabled = true;

    const resposta = await fetch(id ? `${API_MANUTENCOES}/${id}` : API_MANUTENCOES, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || 'Erro ao salvar manutenção.');

    fecharFormulario();
    await carregarManutencoes();
  } catch (error) {
    console.error(error);
    alert(error.message || 'Erro ao salvar manutenção.');
  } finally {
    elementos.btnSalvar.disabled = false;
  }
}

let timerBuscaPaciente = null;

function buscarPacientes() {
  const termo = elementos.pacienteBusca.value.trim();
  estado.pacienteSelecionado = null;
  elementos.pacienteId.value = '';
  elementos.pacienteCpf.value = '';
  elementos.pacienteTelefone.value = '';

  clearTimeout(timerBuscaPaciente);

  if (termo.length < 2) {
    esconderAutocomplete();
    return;
  }

  timerBuscaPaciente = setTimeout(async () => {
    try {
      const resposta = await fetch(`${API_PACIENTES}?nome=${encodeURIComponent(termo)}`);
      if (!resposta.ok) throw new Error('Erro ao buscar pacientes.');

      const pacientes = await resposta.json();
      renderizarSugestoesPacientes(pacientes);
    } catch (error) {
      console.error(error);
      esconderAutocomplete();
    }
  }, 250);
}

function renderizarSugestoesPacientes(pacientes) {
  if (!Array.isArray(pacientes) || !pacientes.length) {
    esconderAutocomplete();
    return;
  }

  elementos.listaPacientes.innerHTML = pacientes.map(paciente => `
    <button type="button" class="autocomplete-item" data-id="${paciente._id}">
      <strong>${escapeHtml(paciente.nome || '')}</strong>
      <span>${formatarCPF(paciente.cpf)} ${paciente.telefone ? '- ' + formatarTelefone(paciente.telefone) : ''}</span>
    </button>
  `).join('');

  elementos.listaPacientes.hidden = false;

  elementos.listaPacientes.querySelectorAll('.autocomplete-item').forEach(item => {
    item.addEventListener('click', () => {
      const paciente = pacientes.find(p => p._id === item.dataset.id);
      selecionarPaciente(paciente);
    });
  });
}

function selecionarPaciente(paciente) {
  if (!paciente) return;

  estado.pacienteSelecionado = paciente;
  elementos.pacienteId.value = paciente._id || '';
  elementos.pacienteCpf.value = paciente.cpf || '';
  elementos.pacienteTelefone.value = paciente.telefone || '';
  elementos.pacienteBusca.value = paciente.nome || '';
  esconderAutocomplete();
}

function esconderAutocomplete() {
  elementos.listaPacientes.innerHTML = '';
  elementos.listaPacientes.hidden = true;
}

function calcularProximaDataFormulario() {
  const tipo = elementos.tipoManutencao.value;
  const dataUltimoAtendimento = elementos.dataUltimoAtendimento.value;
  const intervalo = INTERVALOS_MESES[tipo];

  if (!intervalo || !dataUltimoAtendimento || elementos.dataProximaManutencao.value) return;

  elementos.dataProximaManutencao.value = adicionarMeses(dataUltimoAtendimento, intervalo);
}

function adicionarMeses(dataTexto, meses) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataTexto || '')) return '';

  const [ano, mes, dia] = dataTexto.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  const resultado = new Date(data.getFullYear(), data.getMonth() + meses, 1);
  const ultimoDiaMes = new Date(resultado.getFullYear(), resultado.getMonth() + 1, 0).getDate();

  resultado.setDate(Math.min(dia, ultimoDiaMes));
  return formatarDataInput(resultado);
}

function formatarDataInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function limparFiltros() {
  elementos.filtroTermo.value = '';
  elementos.filtroTipo.value = '';
  elementos.filtroSituacao.value = '';
  elementos.filtroAtencao.checked = false;
  carregarManutencoes();
}

async function abrirWhatsApp(manutencao) {
  const telefoneLimpo = String(manutencao.telefone || '').replace(/\D/g, '');

  if (!telefoneLimpo) {
    alert('Esse paciente não possui telefone cadastrado.');
    return;
  }

  const mensagem = montarMensagemWhatsApp(manutencao);
  window.open(`https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');

  try {
    await chamarEndpointAcao(`${API_MANUTENCOES}/${manutencao._id}/whatsapp-aberto`, 'POST');
  } catch (error) {
    console.error(error);
    alert('WhatsApp aberto, mas não foi possível registrar no histórico.');
  }
}

function montarMensagemWhatsApp(manutencao) {
  const primeiroNome = String(manutencao.pacienteNome || '').trim().split(' ')[0] || '';
  const data = formatarDataBR(manutencao.dataProximaManutencao).replace(/<[^>]*>/g, '');

  const mensagens = {
    'Facetas em resina': `Olá, ${primeiroNome}! Tudo bem?\n\nPassando para lembrar que chegou o período da sua manutenção das facetas em resina com a Dra. Cinthia Leone. Podemos agendar seu retorno?`,
    Ortodontia: `Olá, ${primeiroNome}! Tudo bem?\n\nPassando para lembrar da sua manutenção de ortodontia com a Dra. Cinthia Leone. Podemos agendar seu próximo horário?`,
    Limpeza: `Olá, ${primeiroNome}! Tudo bem?\n\nPassando para lembrar que está na época do seu retorno de limpeza com a Dra. Cinthia Leone. Podemos agendar sua consulta?`
  };

  return `${mensagens[manutencao.tipoManutencao] || mensagens.Limpeza}\n\nPrevisão de retorno: ${data}.`;
}

async function alterarSituacao(manutencao, situacao, controle = null) {
  const rotulo = formatarSituacao(situacao).toLowerCase();
  const mensagemConfirmacao = situacao === 'arquivado'
    ? `Arquivar a manutenção de ${manutencao.pacienteNome}? Ela só aparecerá quando o filtro Arquivado estiver selecionado.`
    : `Marcar a manutenção de ${manutencao.pacienteNome} como ${rotulo}?`;

  if (!confirm(mensagemConfirmacao)) {
    if (controle) controle.value = manutencao.situacao;
    return;
  }

  try {
    await chamarEndpointAcao(`${API_MANUTENCOES}/${manutencao._id}/situacao`, 'PATCH', { situacao });
    await carregarManutencoes();
  } catch (error) {
    console.error(error);
    if (controle) controle.value = manutencao.situacao;
    alert(error.message || 'Erro ao alterar situação.');
  }
}

async function excluirManutencao(manutencao, controle = null) {
  const confirmou = confirm(
    `Excluir definitivamente a manutenção de ${manutencao.pacienteNome} (${manutencao.tipoManutencao})?\n\n` +
    'Esta ação não poderá ser desfeita. O cadastro do paciente não será excluído.'
  );

  if (!confirmou) {
    if (controle) controle.value = manutencao.situacao;
    return;
  }

  try {
    if (controle) controle.disabled = true;

    await chamarEndpointAcao(
      `${API_MANUTENCOES}/${manutencao._id}`,
      'DELETE'
    );

    await carregarManutencoes();
    alert('Manutenção excluída com sucesso.');
  } catch (error) {
    console.error(error);

    if (controle) {
      controle.disabled = false;
      controle.value = manutencao.situacao;
    }

    alert(error.message || 'Erro ao excluir manutenção.');
  }
}

function abrirAgendaParaManutencao(manutencao) {
  sessionStorage.setItem('rascunhoAgendamentoManutencao', JSON.stringify({
    manutencaoId: manutencao._id,
    pacienteId: manutencao.pacienteId || '',
    pacienteNome: manutencao.pacienteNome || '',
    telefone: manutencao.telefone || '',
    tipoManutencao: manutencao.tipoManutencao || '',
    dataSugerida: manutencao.dataProximaManutencao || ''
  }));

  const iframe = window.parent?.document?.getElementById('iframePrincipal');

  if (iframe) {
    iframe.src = 'pagina_inicial.html?origem=manutencao';
    return;
  }

  window.location.href = 'pagina_inicial.html?origem=manutencao';
}

async function concluirManutencao(manutencao) {
  estado.manutencaoConclusao = manutencao;
  elementos.subtituloConclusao.textContent = `${manutencao.pacienteNome} - ${manutencao.tipoManutencao}`;
  elementos.dataRealizacao.value = formatarDataInput(new Date());
  elementos.observacaoConclusao.value = '';
  elementos.modalConclusao.hidden = false;
  elementos.dataRealizacao.focus();
}

function fecharModalConclusao() {
  estado.manutencaoConclusao = null;
  elementos.dataRealizacao.value = '';
  elementos.observacaoConclusao.value = '';
  elementos.modalConclusao.hidden = true;
}

async function confirmarConclusao() {
  const manutencao = estado.manutencaoConclusao;
  if (!manutencao) return;

  const dataRealizacao = elementos.dataRealizacao.value;
  const observacoes = elementos.observacaoConclusao.value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataRealizacao)) {
    alert('Informe a data de realização.');
    return;
  }

  if (!confirm('Concluir esta manutenção e criar automaticamente a próxima?')) return;

  try {
    elementos.btnConfirmarConclusao.disabled = true;
    await chamarEndpointAcao(`${API_MANUTENCOES}/${manutencao._id}/concluir`, 'POST', { dataRealizacao, observacoes });
    fecharModalConclusao();
    await carregarManutencoes();
  } catch (error) {
    console.error(error);
    alert(error.message || 'Erro ao concluir manutenção.');
  } finally {
    elementos.btnConfirmarConclusao.disabled = false;
  }
}

async function abrirHistorico(manutencaoResumo) {
  try {
    elementos.tituloHistorico.textContent = 'Histórico';
    elementos.subtituloHistorico.textContent = `${manutencaoResumo.pacienteNome} - ${manutencaoResumo.tipoManutencao}`;
    elementos.listaHistorico.innerHTML = '<div class="estado-vazio">Carregando histórico...</div>';
    elementos.modalHistorico.hidden = false;

    const resposta = await fetch(`${API_MANUTENCOES}/${manutencaoResumo._id}`);
    const manutencao = await resposta.json();
    if (!resposta.ok) throw new Error(manutencao.erro || 'Erro ao carregar histórico.');

    renderizarHistorico(manutencao.historico || []);
  } catch (error) {
    console.error(error);
    elementos.listaHistorico.innerHTML = '<div class="estado-vazio">Erro ao carregar histórico.</div>';
  }
}

function fecharHistorico() {
  elementos.modalHistorico.hidden = true;
}

function renderizarHistorico(historico) {
  if (!historico.length) {
    elementos.listaHistorico.innerHTML = '<div class="estado-vazio">Nenhuma ação registrada.</div>';
    return;
  }

  elementos.listaHistorico.innerHTML = historico
    .slice()
    .reverse()
    .map(item => `
      <article class="historico-item">
        <div class="historico-topo">
          <span>${formatarTipoHistorico(item.tipo)}</span>
          <span>${formatarDataHora(item.dataHora)}</span>
        </div>
        <div class="historico-descricao">${escapeHtml(item.descricao)}</div>
        ${item.usuario ? `<div class="historico-usuario">Responsável: ${escapeHtml(item.usuario)}</div>` : ''}
      </article>
    `).join('');
}

async function chamarEndpointAcao(url, method, body = {}) {
  const payload = {
    ...body,
    usuario: sessionStorage.getItem('usuarioLogado') || ''
  };

  const resposta = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || 'Erro ao executar ação.');
  return dados;
}

function montarBadgePrazo(statusPrazo) {
  const classe = {
    'Em dia': 'badge-em-dia',
    'Vencendo nos próximos 7 dias': 'badge-vencendo',
    'Vence hoje': 'badge-hoje',
    Vencido: 'badge-vencido'
  }[statusPrazo] || 'badge-em-dia';

  return `<span class="badge ${classe}">${escapeHtml(statusPrazo || 'Em dia')}</span>`;
}

function montarSelectSituacao(manutencao) {
  const opcoes = [
    ['pendente', 'Pendente'],
    ['agendado', 'Agendado'],
    ['concluido', 'Concluído'],
    ['cancelado', 'Cancelado'],
    ['arquivado', 'Arquivar'],
    ['excluido', 'Excluir']
  ];

  return `
    <select class="select-situacao" data-acao="situacao" data-id="${manutencao._id}">
      ${opcoes.map(([valor, texto]) => `
        <option value="${valor}" ${manutencao.situacao === valor ? 'selected' : ''}>${texto}</option>
      `).join('')}
    </select>
  `;
}

function formatarSituacao(situacao) {
  const mapa = {
    pendente: 'Pendente',
    agendado: 'Agendado',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    arquivado: 'Arquivado',
    excluido: 'Excluído'
  };

  return mapa[situacao] || 'Pendente';
}

function formatarTipoHistorico(tipo) {
  const mapa = {
    criacao: 'Criação',
    edicao: 'Edição',
    alteracao_data: 'Alteração da data',
    whatsapp_aberto: 'WhatsApp aberto',
    contato_confirmado: 'Contato confirmado',
    agendamento: 'Agendamento',
    conclusao: 'Conclusão',
    cancelamento: 'Cancelamento',
    arquivamento: 'Arquivamento',
    proxima_manutencao_criada: 'Próxima manutenção criada'
  };

  return mapa[tipo] || tipo || 'Ação';
}

function formatarDataHora(dataHora) {
  if (!dataHora) return '';

  const data = new Date(dataHora);
  if (Number.isNaN(data.getTime())) return '';

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatarDataBR(dataTexto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataTexto || '')) return '<span class="texto-fraco">Sem data</span>';

  const [ano, mes, dia] = dataTexto.split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarCPF(cpf) {
  const numeros = String(cpf || '').replace(/\D/g, '');
  if (numeros.length !== 11) return cpf || '';
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarTelefone(telefone) {
  const numeros = String(telefone || '').replace(/\D/g, '');
  if (numeros.length === 11) return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (numeros.length === 10) return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return telefone || '';
}

function escapeHtml(valor) {
  return String(valor || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
} 