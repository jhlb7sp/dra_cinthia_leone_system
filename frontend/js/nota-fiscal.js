// ===============================
// ELEMENTOS
// ===============================

const buscaPacienteInput = document.getElementById('buscaPaciente');
const listaPacientes = document.getElementById('listaPacientes');

const nomePacienteInput = document.getElementById('nomePaciente');
const cpfPacienteInput = document.getElementById('cpfPaciente');
const emailPacienteInput = document.getElementById('emailPaciente');

const valorNotaInput = document.getElementById('valorNota');
const descricaoNotaInput = document.getElementById('descricaoNota');

const btnAbrirPortal = document.getElementById('btnAbrirPortal');
const btnSalvarNota = document.getElementById('btnSalvarNota');
const btnLimpar = document.getElementById('btnLimpar');

const cardSalvarNota = document.getElementById('cardSalvarNota');

const numeroNotaInput = document.getElementById('numeroNota');
const dataEmissaoInput = document.getElementById('dataEmissao');
const codigoVerificacaoInput = document.getElementById('codigoVerificacao');
const arquivoNotaInput = document.getElementById('arquivoNota');

const btnConfirmarSalvarNota = document.getElementById('btnConfirmarSalvarNota');
const btnCancelarSalvarNota = document.getElementById('btnCancelarSalvarNota');

const tbodyNotas = document.getElementById('tbodyNotas');

const toast = document.getElementById('toast');


// ===============================
// CONFIG
// ===============================

const API_URL = 'http://localhost:3000/api';

let pacienteSelecionado = null;


// ===============================
// TOAST
// ===============================

function mostrarToast(mensagem) {
  toast.textContent = mensagem;

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}


// ===============================
// FORMATADORES
// ===============================

function formatarCPF(valor) {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatarMoeda(valor) {
  const numero = valor.replace(/\D/g, '');

  const numeroFloat = Number(numero) / 100;

  return numeroFloat.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function moedaParaNumero(valor) {
  if (!valor) return 0;

  return Number(
    valor
      .replace(/\s/g, '')
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
  );
}


// ===============================
// BUSCAR PACIENTES
// ===============================

async function buscarPacientes(termo) {

  try {

    const response = await fetch(
      `${API_URL}/pacientes/busca?termo=${encodeURIComponent(termo)}`
    );

    const pacientes = await response.json();

    renderizarListaPacientes(pacientes);

  } catch (error) {

    console.error(error);

    mostrarToast('Erro ao buscar pacientes');

  }

}


// ===============================
// RENDER LISTA PACIENTES
// ===============================

function renderizarListaPacientes(pacientes) {

  if (!pacientes.length) {

    listaPacientes.style.display = 'none';

    listaPacientes.innerHTML = '';

    return;

  }

  listaPacientes.innerHTML = pacientes.map(paciente => `
    
    <div class="item-paciente"
      data-id="${paciente._id}"
      data-nome="${paciente.nome || ''}"
      data-cpf="${paciente.cpf || ''}"
      data-email="${paciente.email || ''}"
    >

      <strong>${paciente.nome || 'Sem nome'}</strong>

      <span>
        CPF: ${formatarCPF(paciente.cpf || '')}
      </span>

    </div>

  `).join('');

  listaPacientes.style.display = 'block';

}


// ===============================
// SELECIONAR PACIENTE
// ===============================

listaPacientes.addEventListener('click', (e) => {

  const item = e.target.closest('.item-paciente');

  if (!item) return;

  pacienteSelecionado = {
    _id: item.dataset.id,
    nome: item.dataset.nome,
    cpf: item.dataset.cpf,
    email: item.dataset.email
  };

  nomePacienteInput.value = pacienteSelecionado.nome || '';

  cpfPacienteInput.value =
    formatarCPF(pacienteSelecionado.cpf || '');

  emailPacienteInput.value =
    pacienteSelecionado.email || '';

  buscaPacienteInput.value =
    pacienteSelecionado.nome || '';

  listaPacientes.innerHTML = '';

  listaPacientes.style.display = 'none';

  carregarNotasPaciente();

});


// ===============================
// INPUT BUSCA
// ===============================

buscaPacienteInput.addEventListener('input', async () => {

  const termo = buscaPacienteInput.value.trim();

  if (termo.length < 2) {

    listaPacientes.innerHTML = '';

    listaPacientes.style.display = 'none';

    return;

  }

  await buscarPacientes(termo);

});


// ===============================
// FORMAT CPF
// ===============================

cpfPacienteInput.addEventListener('input', (e) => {

  e.target.value = formatarCPF(e.target.value);

});


// ===============================
// FORMAT VALOR
// ===============================

valorNotaInput.addEventListener('input', (e) => {

  const valor = e.target.value.replace(/\D/g, '');

  if (!valor) {

    e.target.value = '';

    return;

  }

  e.target.value = formatarMoeda(valor);

});


// ===============================
// BOTÕES COPIAR
// ===============================

document.querySelectorAll('.btn-copy').forEach(btn => {

  btn.addEventListener('click', async () => {

    const campoId = btn.dataset.copy;

    const campo = document.getElementById(campoId);

    if (!campo) return;

    await navigator.clipboard.writeText(campo.value);

    mostrarToast('Copiado com sucesso');

  });

});


// ===============================
// ABRIR PORTAL
// ===============================

btnAbrirPortal.addEventListener('click', () => {

  window.open(
    'https://nfe.prefeitura.sp.gov.br/contribuinte/inicio.aspx',
    '_blank'
  );

});


// ===============================
// MOSTRAR CARD SALVAR
// ===============================

btnSalvarNota.addEventListener('click', () => {

  if (!nomePacienteInput.value.trim()) {

    mostrarToast('Selecione um paciente');

    return;

  }

  cardSalvarNota.style.display = 'block';

  cardSalvarNota.scrollIntoView({
    behavior: 'smooth'
  });

});


// ===============================
// CANCELAR SALVAR
// ===============================

btnCancelarSalvarNota.addEventListener('click', () => {

  cardSalvarNota.style.display = 'none';

});


// ===============================
// LIMPAR
// ===============================

btnLimpar.addEventListener('click', () => {

  pacienteSelecionado = null;

  buscaPacienteInput.value = '';

  nomePacienteInput.value = '';

  cpfPacienteInput.value = '';

  emailPacienteInput.value = '';

  valorNotaInput.value = '';

  descricaoNotaInput.value = '';

  numeroNotaInput.value = '';

  codigoVerificacaoInput.value = '';

  arquivoNotaInput.value = '';

  tbodyNotas.innerHTML = `
    <tr>
      <td colspan="7" class="tabela-vazia">
        Nenhuma nota salva ainda.
      </td>
    </tr>
  `;

  cardSalvarNota.style.display = 'none';

});


// ===============================
// SALVAR NOTA
// ===============================

btnConfirmarSalvarNota.addEventListener('click', async () => {

  try {

    if (!pacienteSelecionado?._id) {

      mostrarToast('Paciente inválido');

      return;

    }

    if (!numeroNotaInput.value.trim()) {

      mostrarToast('Informe o número da nota');

      return;

    }

    const formData = new FormData();

    formData.append(
      'pacienteId',
      pacienteSelecionado._id
    );

    formData.append(
      'nomePaciente',
      nomePacienteInput.value.trim()
    );

    formData.append(
      'cpf',
      cpfPacienteInput.value.replace(/\D/g, '')
    );

    formData.append(
      'email',
      emailPacienteInput.value.trim()
    );

    formData.append(
      'valor',
      moedaParaNumero(valorNotaInput.value)
    );

    formData.append(
      'descricao',
      descricaoNotaInput.value.trim()
    );

    formData.append(
      'numeroNota',
      numeroNotaInput.value.trim()
    );

    formData.append(
      'dataEmissao',
      dataEmissaoInput.value
    );

    formData.append(
      'codigoVerificacao',
      codigoVerificacaoInput.value.trim()
    );

    if (arquivoNotaInput.files[0]) {

      formData.append(
        'arquivo',
        arquivoNotaInput.files[0]
      );

    }

    const response = await fetch(
      `${API_URL}/notas`,
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.message || 'Erro ao salvar nota'
      );

    }

    mostrarToast('Nota salva com sucesso');

    cardSalvarNota.style.display = 'none';

    numeroNotaInput.value = '';

    codigoVerificacaoInput.value = '';

    arquivoNotaInput.value = '';

    await carregarNotasPaciente();

  } catch (error) {

    console.error(error);

    mostrarToast(error.message);

  }

});


// ===============================
// CARREGAR NOTAS PACIENTE
// ===============================

async function carregarNotasPaciente() {

  try {

    if (!pacienteSelecionado?._id) return;

    const response = await fetch(
      `${API_URL}/notas/paciente/${pacienteSelecionado._id}`
    );

    const notas = await response.json();

    renderizarTabelaNotas(notas);

  } catch (error) {

    console.error(error);

    mostrarToast('Erro ao carregar notas');

  }

}


// ===============================
// RENDER TABELA
// ===============================

function renderizarTabelaNotas(notas) {

  if (!notas.length) {

    tbodyNotas.innerHTML = `
      <tr>
        <td colspan="7" class="tabela-vazia">
          Nenhuma nota salva ainda.
        </td>
      </tr>
    `;

    return;

  }

  tbodyNotas.innerHTML = notas.map(nota => {

    const dataFormatada =
      new Date(nota.dataEmissao)
        .toLocaleDateString('pt-BR');

    const valorFormatado =
      Number(nota.valor || 0)
        .toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });

    return `

      <tr>

        <td>${dataFormatada}</td>

        <td>${nota.nomePaciente || '-'}</td>

        <td>
          ${formatarCPF(nota.cpf || '')}
        </td>

        <td>${nota.numeroNota || '-'}</td>

        <td>${valorFormatado}</td>

        <td>
          <span class="status emitida">
            Emitida
          </span>
        </td>

        <td>

          <div class="acoes-tabela">

            <button
              class="btn-acao btn-visualizar"
              onclick="visualizarNota('${nota._id}')"
            >
              <i class="fa-solid fa-eye"></i>
            </button>

            ${nota.arquivoUrl ? `
              <button
                class="btn-acao btn-download"
                onclick="baixarNota('${nota.arquivoUrl}')"
              >
                <i class="fa-solid fa-download"></i>
              </button>
            ` : ''}

          </div>

        </td>

      </tr>

    `;

  }).join('');

}


// ===============================
// VISUALIZAR
// ===============================

function visualizarNota(id) {

  window.open(
    `${API_URL}/notas/${id}`,
    '_blank'
  );

}


// ===============================
// DOWNLOAD
// ===============================

function baixarNota(url) {

  window.open(url, '_blank');

}


// ===============================
// FECHAR LISTA
// ===============================

document.addEventListener('click', (e) => {

  const clicouFora =
    !e.target.closest('.form-group');

  if (clicouFora) {

    listaPacientes.style.display = 'none';

  }

});


// ===============================
// DATA HOJE
// ===============================

window.addEventListener('DOMContentLoaded', () => {

  const hoje = new Date();

  const yyyy = hoje.getFullYear();

  const mm =
    String(hoje.getMonth() + 1)
      .padStart(2, '0');

  const dd =
    String(hoje.getDate())
      .padStart(2, '0');

  dataEmissaoInput.value =
    `${yyyy}-${mm}-${dd}`;

});