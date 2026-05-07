// =============================
// relatorio.js — Faturamento + Detalhamento
// =============================

const BASE_URL = 'http://localhost:3000/api/faturamento';

// Elementos – quadro Faturamento (esquerda)
const mesReferenciaInput = document.getElementById('mesReferencia');
const spanTotalEntrada = document.getElementById('totalEntrada');
const spanTotalSaida = document.getElementById('totalSaida');
const spanSaldoPeriodo = document.getElementById('saldoPeriodo');
const cardPendentes = document.getElementById('cardPendentes');
const listaPendentes = document.getElementById('listaPendentes');

// Elementos – quadro Detalhamento (direita)
const inicioDetalhamentoInput = document.getElementById('inicioDetalhamento');
const fimDetalhamentoInput = document.getElementById('fimDetalhamento');
const btnAplicarDetalhamento = document.getElementById('btnAplicarDetalhamento');
const tabelaFaturamentoBody = document.getElementById('tabelaFaturamento');

let graficoFaturamentoPizza = null;
let lancamentosTodos = [];

// =============================
// Funções utilitárias
// =============================

function formatarMoeda(valor) {
  return (Number(valor) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function parseMonthValue(value) {
  if (!value) return null;
  const [anoStr, mesStr] = value.split('-');
  const ano = parseInt(anoStr, 10);
  const mes = parseInt(mesStr, 10);
  if (isNaN(ano) || isNaN(mes)) return null;
  return { ano, mes }; // mes 1–12
}

function estaNoMes(data, alvo) {
  const ano = data.getFullYear();
  const mes = data.getMonth() + 1;
  return ano === alvo.ano && mes === alvo.mes;
}

function estaNoIntervaloDeMeses(data, inicio, fim) {
  const ano = data.getFullYear();
  const mes = data.getMonth() + 1;

  if (inicio && (ano < inicio.ano || (ano === inicio.ano && mes < inicio.mes))) {
    return false;
  }
  if (fim && (ano > fim.ano || (ano === fim.ano && mes > fim.mes))) {
    return false;
  }
  return true;
}

function formatarDataCurta(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  if (!dia) return `${mes}/${ano}`;
  return `${dia}/${mes}/${ano}`;
}

// Define defaults de período (mês atual / ano vigente)
(function inicializarDefaults() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const mesAtual = `${ano}-${mes}`;

  if (mesReferenciaInput && !mesReferenciaInput.value) {
    mesReferenciaInput.value = mesAtual;
  }

  const janeiro = `${ano}-01`;
  if (inicioDetalhamentoInput && !inicioDetalhamentoInput.value) {
    inicioDetalhamentoInput.value = janeiro;
  }
  if (fimDetalhamentoInput && !fimDetalhamentoInput.value) {
    fimDetalhamentoInput.value = mesAtual;
  }
})();

// =============================
// Backend
// =============================

async function buscarLancamentosDoBanco() {
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error('Erro ao buscar lançamentos');
    const data = await res.json();
    lancamentosTodos = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Erro ao carregar lançamentos:', e);
    lancamentosTodos = [];
  }
}

// =============================
// Faturamento (ESQUERDA)
// =============================

function atualizarResumoEMesEPizza() {
  if (!lancamentosTodos.length) return;

  let alvoMes = parseMonthValue(mesReferenciaInput.value);
  if (!alvoMes) {
    const hoje = new Date();
    alvoMes = { ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 };
  }

  let totalEntradaMes = 0;
  let totalSaidaMes = 0;
  const pendentesMes = [];

  lancamentosTodos.forEach(l => {
    if (!l.data) return;
    const data = new Date(l.data);
    if (isNaN(data.getTime())) return;

    if (!estaNoMes(data, alvoMes)) return;

    const valor = Number(l.valor) || 0;

    if (l.tipo === 'entrada') totalEntradaMes += valor;
    if (l.tipo === 'saida') totalSaidaMes += valor;

    if (l.pagamento && l.pagamento !== 'ok') {
      pendentesMes.push(l);
    }
  });

  const saldoMes = totalEntradaMes - totalSaidaMes;

  spanTotalEntrada.textContent = formatarMoeda(totalEntradaMes);
  spanTotalSaida.textContent = formatarMoeda(totalSaidaMes);
  spanSaldoPeriodo.textContent = formatarMoeda(saldoMes);
  spanSaldoPeriodo.style.color = saldoMes >= 0 ? '#15803d' : '#b91c1c';
  spanSaldoPeriodo.style.fontWeight = '700'; // negrito sempre

  atualizarGraficoPizza(totalEntradaMes, totalSaidaMes);
  atualizarPendentes(pendentesMes);
}

function atualizarPendentes(pendentes) {
  if (!pendentes || !pendentes.length) {
    cardPendentes.style.display = 'none';
    listaPendentes.innerHTML = '';
    return;
  }

  cardPendentes.style.display = 'block';
  listaPendentes.innerHTML = '';

  pendentes.forEach(item => {
    const li = document.createElement('li');
    li.classList.add('item-pendente');

    li.innerHTML = `
      <div class="pendente-linha-superior">
        <span class="pendente-paciente">${item.paciente || 'Paciente não informado'}</span>
        <span class="pendente-valor">${formatarMoeda(item.valor)}</span>
      </div>
      <div class="pendente-linha-inferior">
        <span class="pendente-descricao">${item.descricao || ''}</span>
        <span class="pendente-vencimento">
          ${item.vencimento ? 'Venc.: ' + formatarDataCurta(item.vencimento) : ''}
        </span>
      </div>
    `;

    listaPendentes.appendChild(li);
  });
}

function atualizarGraficoPizza(entradaMes, saidaMes) {
  const ctx = document.getElementById('graficoFaturamentoPizza');
  if (!ctx) return;

  if (graficoFaturamentoPizza) {
    graficoFaturamentoPizza.destroy();
  }

  graficoFaturamentoPizza = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Entrada', 'Saída'],
      datasets: [{
        data: [entradaMes, saidaMes],
        backgroundColor: ['#4caf50', '#f44336']
      }]
    },
    options: {
      responsive: true,
      cutout: '60%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `${context.label}: ${formatarMoeda(context.parsed)}`;
            }
          }
        }
      }
    }
  });
}

// =============================
// DETALHAMENTO (DIREITA)
// =============================

function agruparPorMesAno(lancamentos) {
  const mapa = new Map();

  lancamentos.forEach(l => {
    if (!l.data) return;

    const data = new Date(l.data);
    if (isNaN(data.getTime())) return;

    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    const chave = `${mes}/${ano}`;
    const valor = Number(l.valor) || 0;

    if (!mapa.has(chave)) {
      mapa.set(chave, { mesAno: chave, entrada: 0, saida: 0 });
    }

    const obj = mapa.get(chave);

    if (l.tipo === 'entrada') obj.entrada += valor;
    if (l.tipo === 'saida') obj.saida += valor;
  });

  const lista = Array.from(mapa.values());

  lista.sort((a, b) => {
    const [mesA, anoA] = a.mesAno.split('/');
    const [mesB, anoB] = b.mesAno.split('/');
    return anoA !== anoB
      ? anoA - anoB
      : mesA - mesB;
  });

  return lista;
}

function atualizarTabelaDetalhamento(lancamentosFiltrados) {
  tabelaFaturamentoBody.innerHTML = '';

  if (!lancamentosFiltrados.length) {
    tabelaFaturamentoBody.innerHTML =
      `<tr><td colspan="4" style="text-align:center;">Nenhum dado encontrado para o período.</td></tr>`;
    return;
  }

  const linhasMes = agruparPorMesAno(lancamentosFiltrados);

  let totalEntrada = 0;
  let totalSaida = 0;

  linhasMes.forEach(linha => {
    const saldo = linha.entrada - linha.saida;
    totalEntrada += linha.entrada;
    totalSaida += linha.saida;

    const classeSaldo = saldo >= 0 ? 'saldo-positivo' : 'saldo-negativo';

    tabelaFaturamentoBody.innerHTML += `
      <tr>
        <td>${linha.mesAno}</td>
        <td>${formatarMoeda(linha.entrada)}</td>
        <td>${formatarMoeda(linha.saida)}</td>
        <td class="${classeSaldo}">${formatarMoeda(saldo)}</td>
      </tr>
    `;
  });

  const saldoTotal = totalEntrada - totalSaida;
  const classeSaldoTotal = saldoTotal >= 0 ? 'saldo-positivo' : 'saldo-negativo';

  tabelaFaturamentoBody.innerHTML += `
    <tr class="linha-total">
      <td>Total</td>
      <td>${formatarMoeda(totalEntrada)}</td>
      <td>${formatarMoeda(totalSaida)}</td>
      <td class="${classeSaldoTotal}" style="font-weight:700;">
        ${formatarMoeda(saldoTotal)}
      </td>
    </tr>
  `;
}

function carregarDetalhamentoPorPeriodo() {
  if (!lancamentosTodos.length) return;

  const inicio = parseMonthValue(inicioDetalhamentoInput.value);
  const fim = parseMonthValue(fimDetalhamentoInput.value || inicioDetalhamentoInput.value);

  const filtrados = lancamentosTodos.filter(l => {
    if (!l.data) return false;
    const data = new Date(l.data);
    if (isNaN(data.getTime())) return false;
    return estaNoIntervaloDeMeses(data, inicio, fim);
  });

  atualizarTabelaDetalhamento(filtrados);
}

// =============================
// Eventos + init
// =============================

mesReferenciaInput.addEventListener('change', atualizarResumoEMesEPizza);
btnAplicarDetalhamento.addEventListener('click', carregarDetalhamentoPorPeriodo);

(async function init() {
  await buscarLancamentosDoBanco();
  atualizarResumoEMesEPizza();
  carregarDetalhamentoPorPeriodo();
})();
