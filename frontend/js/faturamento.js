// =============================
// faturamento.js — Tela de Faturamento
// =============================

const BASE_URL = 'http://localhost:3000/api/faturamento';

// Referências aos elementos
const form = document.getElementById('formLancamento');
const tbody = document.getElementById('lancamentosTbody');
const btnFilter = document.getElementById('btnFilter');
const filterStart = document.getElementById('filterStart');
const filterEnd = document.getElementById('filterEnd');
const filterTipo = document.getElementById('filterTipo');

const totalEntradasEl = document.getElementById('totalEntradas');
const totalSaidasEl = document.getElementById('totalSaidas');
const saldoEl = document.getElementById('saldo');

const parcelasInput = document.getElementById('parcelas');

// Armazena lançamentos exibidos e todos do banco
let lancamentos = [];
let lancamentosTodos = [];

// =============================
// Funções utilitárias
// =============================

// Formata valor em R$
function formatarValor(valor) {
  return (Number(valor) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

// Soma entradas/saídas e atualiza totais
function atualizarTotais(lista) {
  let totalEntradas = 0;
  let totalSaidas = 0;

  lista.forEach(l => {
    if (l.tipo === 'entrada') totalEntradas += Number(l.valor) || 0;
    else if (l.tipo === 'saida') totalSaidas += Number(l.valor) || 0;
  });

  totalEntradasEl.textContent = `Entradas: ${formatarValor(totalEntradas)}`;
  totalSaidasEl.textContent = `Saídas: ${formatarValor(totalSaidas)}`;

  const saldo = totalEntradas - totalSaidas;
  saldoEl.textContent = `Saldo: ${formatarValor(saldo)}`;
  saldoEl.style.color = saldo >= 0 ? '#2a662a' : '#cc3333';
}

// Cria linha da tabela
function criarLinha(lancamento, index) {
  const tr = document.createElement('tr');

  const btnStatus = document.createElement('button');
  btnStatus.textContent = lancamento.pagamento === 'ok' ? 'OK' : 'PEND';
  btnStatus.className = lancamento.pagamento === 'ok' ? 'btn-ok' : 'btn-pendente';
  btnStatus.addEventListener('click', () => alterarStatusPagamento(index));

  const btnDelete = document.createElement('button');
  btnDelete.textContent = 'Excluir';
  btnDelete.className = 'btn-delete';
  btnDelete.dataset.index = index;

  tr.innerHTML = `
    <td>${lancamento.data}</td>
    <td>${lancamento.tipo.charAt(0).toUpperCase() + lancamento.tipo.slice(1)}</td>
    <td>${lancamento.descricao}</td>
    <td>${formatarValor(lancamento.valor)}</td>
  `;

  const tdPgto = document.createElement('td');
  tdPgto.appendChild(btnStatus);

  const tdAcao = document.createElement('td');
  tdAcao.appendChild(btnDelete);

  tr.appendChild(tdPgto);
  tr.appendChild(tdAcao);

  return tr;
}

// Atualiza tabela com lista passada
function atualizarTabela(lista) {
  tbody.innerHTML = '';
  lista.forEach((l, i) => {
    tbody.appendChild(criarLinha(l, i));
  });
  atualizarTotais(lista);
}

// Adiciona lançamento ao array e atualiza tabela (modo simples, 1 parcela)
function adicionarLancamento(lancamento) {
  lancamentos.push(lancamento);
  atualizarTabela(lancamentos);
}

function parseISODateLocal(dateStr) {
  // dateStr: "YYYY-MM-DD"
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d); // <- local, sem bug de UTC
}

function removerDoEstadoPorId(id) {
  lancamentos = lancamentos.filter(l => l._id !== id);
  lancamentosTodos = lancamentosTodos.filter(l => l._id !== id);
}

const valorInput = document.getElementById('valor');

function formatarMoedaInput(valor) {
  valor = (valor || '').toString().replace(/\D/g, '');
  if (!valor) return '';
  valor = (Number(valor) / 100).toFixed(2);
  valor = valor.replace('.', ',');
  valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return 'R$ ' + valor;
}

function moedaParaNumero(valorStr) {
  if (!valorStr) return 0;
  return Number(
    valorStr
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim()
  );
}

valorInput?.addEventListener('input', (e) => {
  const digits = e.target.value.replace(/\D/g, '');
  e.target.value = digits ? formatarMoedaInput(digits) : '';
});

valorInput?.addEventListener('blur', (e) => {
  const digits = e.target.value.replace(/\D/g, '');
  e.target.value = digits ? formatarMoedaInput(digits) : '';
});



// =============================
// Lançamento parcelado
// =============================

// Add meses a uma data (preserva dia, dentro do possível)
function adicionarMeses(dataISO, quantidadeMeses) {
  const [anoStr, mesStr, diaStr] = dataISO.split('-');
  const ano = parseInt(anoStr, 10);
  const mes = parseInt(mesStr, 10) - 1;
  const dia = parseInt(diaStr, 10);

  const base = new Date(ano, mes, dia);
  base.setMonth(base.getMonth() + quantidadeMeses);

  // Garante formato YYYY-MM-DD
  const anoFinal = base.getFullYear();
  const mesFinal = String(base.getMonth() + 1).padStart(2, '0');
  const diaFinal = String(base.getDate()).padStart(2, '0');

  return `${anoFinal}-${mesFinal}-${diaFinal}`;
}

// Salvar 1 ou N parcelas no backend
function salvarLancamentosParcelados({ data, tipo, descricao, valor, pagamento, parcelas }) {
  return new Promise((resolve, reject) => {
    if (parcelas <= 1) {
      // Comportamento antigo: um único lançamento
      fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, tipo, descricao, valor, pagamento })
      })
        .then(res => res.json())
        .then(resultado => {
          if (!resultado.sucesso) {
            return reject(new Error('Erro ao salvar lançamento no banco.'));
          }
          resolve([{ _id: resultado.id, data, tipo, descricao, valor, pagamento }]);
        })
        .catch(err => reject(err));
      return;
    }

    // Parcelado
    const qtdParcelas = parcelas;
    const valorTotal = valor;
    const valorBaseParcela = Math.round((valorTotal / qtdParcelas) * 100) / 100;

    const lancamentosCriados = [];
    const promises = [];
    let acumulado = 0;

    for (let i = 0; i < qtdParcelas; i++) {
      let valorParcela = valorBaseParcela;

      // Ajustar última parcela para garantir soma exata
      if (i === qtdParcelas - 1) {
        const diferenca = Math.round((valorTotal - (acumulado + valorBaseParcela)) * 100) / 100;
        valorParcela = valorBaseParcela + diferenca;
      }

      acumulado += valorParcela;

      const dataParcela = adicionarMeses(data, i);
      const descricaoParcela = `${descricao} (${i + 1}/${qtdParcelas})`;

      const body = {
        data: dataParcela,
        tipo,
        descricao: descricaoParcela,
        valor: valorParcela,
        pagamento
      };

      const prom = fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
        .then(res => res.json())
        .then(resultado => {
          if (!resultado.sucesso) {
            throw new Error('Erro ao salvar parcela no banco.');
          }
          lancamentosCriados.push({
            _id: resultado.id,
            ...body
          });
        });

      promises.push(prom);
    }

    Promise.all(promises)
      .then(() => resolve(lancamentosCriados))
      .catch(err => reject(err));
  });
}

// =============================
// Eventos
// =============================


// Evento submit do formulário
form.addEventListener('submit', e => {
  e.preventDefault();

  const data = form.data.value;
  const tipo = form.tipo.value;
  const descricao = form.descricao.value.trim();
  const valor = moedaParaNumero(form.valor.value);
  const pagamento = document.querySelector('input[name="pagamento"]:checked')?.value;
  let parcelas = parseInt(parcelasInput.value, 10);

  if (!data || !tipo || !descricao || isNaN(valor) || valor <= 0 || !pagamento) {
    alert('Por favor, preencha todos os campos corretamente.');
    return;
  }

  if (isNaN(parcelas) || parcelas < 1) {
    parcelas = 1;
  }

  salvarLancamentosParcelados({ data, tipo, descricao, valor, pagamento, parcelas })
    .then(() => {
      alert(
        parcelas > 1
          ? `Foram lançadas ${parcelas} parcelas com sucesso!`
          : 'Lançamento salvo com sucesso!'
      );
      form.reset();
      parcelasInput.value = '1';
      carregarLancamentos(); // recarrega do banco pra refletir tudo certinho
    })
    .catch(error => {
      console.error('Erro ao salvar lançamento/parcelas:', error);
      alert('Erro ao salvar lançamento.');
    });
});

// Altera status de pagamento
function alterarStatusPagamento(index) {
  const lancamento = lancamentos[index];
  if (!lancamento) return;

  if (lancamento.pagamento === 'ok') {
    alert('Esse lançamento já está pago.');
    return;
  }

  const confirmacao = confirm('Confirmar pagamento deste lançamento?');
  if (!confirmacao) return;

  fetch(`${BASE_URL}/${lancamento._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pagamento: 'ok' })
  })
    .then(res => res.json())
    .then(resultado => {
      if (resultado.sucesso) {
        lancamento.pagamento = 'ok';
        atualizarTabela(lancamentos);
      } else {
        alert('Erro ao atualizar status.');
      }
    })
    .catch(error => {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status.');
    });
}

// Remove lançamento pelo índice e atualiza tabela
function removerLancamento(index) {
  lancamentos.splice(index, 1);
  atualizarTabela(lancamentos);
}

// Filtro de lançamentos
function filtrarLancamentos() {
  const start = filterStart.value ? parseISODateLocal(filterStart.value) : null;
  const end = filterEnd.value ? parseISODateLocal(filterEnd.value) : null;

  const tipo = filterTipo.value;

  const filtrados = lancamentosTodos.filter(l => {
    const dataLanc = parseISODateLocal(l.data);

    if (start && dataLanc < start) return false;
    if (end && dataLanc > end) return false;

    if (tipo !== 'Todos') {
      if (tipo === 'pendente' && l.pagamento !== 'pendente') return false;
      if (tipo !== 'pendente' && l.tipo !== tipo) return false;
    }

    return true;
  });

  lancamentos = filtrados;
  atualizarTabela(lancamentos);
}

// Evento click para excluir (delegation)
tbody.addEventListener('click', e => {
  if (e.target.classList.contains('btn-delete')) {
    const index = parseInt(e.target.getAttribute('data-index'));
    const senha = prompt('Informe sua senha para excluir este lançamento:');

    if (!senha) return;

    const usuario = sessionStorage.getItem('usuarioLogado');

    fetch('http://localhost:3000/api/validar-senha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ usuario, senha })
    })
      .then(response => response.json())
      .then(data => {
        if (data.sucesso) {
          const lancamento = lancamentos[index];

          fetch(`${BASE_URL}/${lancamento._id}`, {
            method: 'DELETE'
          })
            .then(res => res.json())
            .then(() => {
              const idRemovido = lancamento._id;
              removerDoEstadoPorId(idRemovido);
              // se tiver filtro aplicado, reaplica pra não “voltar”
              filtrarLancamentos();
              alert('Lançamento removido com sucesso!');
            })
            .catch(err => console.error('Erro ao excluir:', err));
        } else {
          alert('Senha incorreta. Ação não autorizada.');
        }
      })
      .catch(error => {
        console.error('Erro na validação de senha:', error);
      });
  }
});

// Evento do botão filtrar
btnFilter.addEventListener('click', () => {
  filtrarLancamentos();
});

// Inicializa tabela vazia
atualizarTabela(lancamentos);

// Carregar lançamentos do backend
function carregarLancamentos() {
  fetch(BASE_URL)
    .then(res => res.json())
    .then(data => {
      lancamentosTodos = data || [];

      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();

      lancamentos = lancamentosTodos.filter(l => {
        const dataLanc = parseISODateLocal(l.data);
        return (
          dataLanc &&
          dataLanc.getMonth() === mesAtual &&
          dataLanc.getFullYear() === anoAtual
        );

      });

      atualizarTabela(lancamentos);
    })
    .catch(err => console.error('Erro ao carregar lançamentos:', err));
}

// Chama ao abrir
carregarLancamentos();
