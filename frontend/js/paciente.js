console.log("paciente.js carregado");

const params = new URLSearchParams(window.location.search);
const cpf = params.get("cpf");

const API_BASE = "http://localhost:3000/api";

const nomePacienteEl = document.getElementById("nomePaciente");
const iframe = document.getElementById("conteudoAba");
const botoesAba = document.querySelectorAll(".btn-aba");

document.addEventListener("DOMContentLoaded", iniciarPaginaPaciente);

async function iniciarPaginaPaciente() {
  if (!cpf) {
    nomePacienteEl.textContent = "Paciente não informado";
    return;
  }

  await carregarPacienteTopo();
  configurarAbas();
  abrirAba("tratamento");
}

async function carregarPacienteTopo() {
  try {
    const res = await fetch(`${API_BASE}/pacientes/cpf/${cpf}`);
    if (!res.ok) throw new Error("Paciente não encontrado");

    const paciente = await res.json();
    nomePacienteEl.textContent = `${paciente.nome} (${paciente.cpf || cpf})`;
  } catch (error) {
    console.error(error);
    nomePacienteEl.textContent = `Paciente (${cpf})`;
  }
}

function configurarAbas() {
  botoesAba.forEach(botao => {
    botao.addEventListener("click", () => {
      const aba = botao.dataset.aba;
      abrirAba(aba);
    });
  });
}

function abrirAba(nomeAba) {
  const paginas = {
    dados: `dados.html?cpf=${encodeURIComponent(cpf)}`,
    anamnese: `anamnese.html?cpf=${encodeURIComponent(cpf)}`,
    tratamento: `tratamento.html?cpf=${encodeURIComponent(cpf)}`,
    historico: `historico.html?cpf=${encodeURIComponent(cpf)}`,
    orcamento: `orcamentoPaciente.html?cpf=${encodeURIComponent(cpf)}`,
  };

  iframe.src = paginas[nomeAba] || paginas.tratamento;
  marcarAbaAtiva(nomeAba);
}

function marcarAbaAtiva(nomeAba) {
  botoesAba.forEach(botao => {
    const ativa = botao.dataset.aba === nomeAba;
    botao.classList.toggle("ativo", ativa);
  });
}

window.abrirAba = abrirAba;
window.marcarAbaAtiva = marcarAbaAtiva;
