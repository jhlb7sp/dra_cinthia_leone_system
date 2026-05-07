console.log("tratamento.js carregado");

const params = new URLSearchParams(window.location.search);
const cpf = params.get("cpf");
const API_BASE = "http://localhost:3000/api";

const estado = {
  paciente: {
    nome: "",
    cpf: cpf || ""
  }
};

const debounceTimers = new WeakMap();

const tituloPaciente = document.getElementById("tituloPaciente");
const tabelaTratamento = document.getElementById("tabelaTratamento");
const totalValor = document.getElementById("totalValor");
const btnNovaLinha = document.getElementById("btnNovaLinha");
const btnSalvarTratamentos = document.getElementById("btnSalvarTratamentos");

const modalVisualizar = document.getElementById("modalVisualizar");
const fecharModal = document.getElementById("fecharModal");

document.addEventListener("DOMContentLoaded", iniciarTela);

function iniciarTela() {
  configurarEventos();
  tituloPaciente.innerText = "Tratamento";

  destacarAbaTratamentoNoPai();

  if (!cpf) {
    adicionarLinha();
    return;
  }

  carregarPaciente();
}

function configurarEventos() {
  btnNovaLinha?.addEventListener("click", () => adicionarLinha());
  btnSalvarTratamentos?.addEventListener("click", salvarTratamentos);

  fecharModal?.addEventListener("click", fecharModalVisualizacao);

  modalVisualizar?.addEventListener("click", (e) => {
    if (e.target === modalVisualizar) {
      fecharModalVisualizacao();
    }
  });
}

async function carregarPaciente() {
  try {
    const res = await fetch(`${API_BASE}/pacientes/cpf/${cpf}`);
    if (!res.ok) throw new Error("Paciente não encontrado");

    const paciente = await res.json();

    estado.paciente.nome = paciente.nome || "";
    estado.paciente.cpf = paciente.cpf || cpf;

    atualizarTopoPaginaPai();
    await carregarTratamentos();
  } catch (error) {
    console.error(error);
    adicionarLinha();
  }
}

function atualizarTopoPaginaPai() {
  try {
    const docPai = window.parent?.document;
    if (!docPai) return;

    const nomePaciente = docPai.getElementById("nomePaciente");
    if (nomePaciente) {
      nomePaciente.textContent = `${estado.paciente.nome} (${estado.paciente.cpf})`;
    }
  } catch (error) {
    console.warn("Não foi possível atualizar o topo da página pai.", error);
  }
}

function destacarAbaTratamentoNoPai() {
  try {
    if (window.parent && typeof window.parent.marcarAbaAtiva === "function") {
      window.parent.marcarAbaAtiva("tratamento");
      return;
    }

    const docPai = window.parent?.document;
    if (!docPai) return;

    docPai.querySelectorAll(".btn-aba").forEach(btn => {
      btn.classList.toggle("ativo", btn.dataset.aba === "tratamento");
    });
  } catch (error) {
    console.warn("Não foi possível destacar a aba Tratamento.", error);
  }
}

async function carregarTratamentos() {
  try {
    const res = await fetch(`${API_BASE}/tratamentos/${cpf}`);
    if (!res.ok) throw new Error("Erro ao carregar tratamentos");

    const tratamentos = await res.json();
    tabelaTratamento.innerHTML = "";

    if (Array.isArray(tratamentos) && tratamentos.length > 0) {
      tratamentos.forEach(trat => adicionarLinha(trat));
    } else {
      adicionarLinha();
    }

    atualizarTotal();
  } catch (error) {
    console.error(error);
    tabelaTratamento.innerHTML = "";
    adicionarLinha();
  }
}

function adicionarLinha(dados = {}) {
  const linha = document.createElement("tr");
  const statusAtual = dados.status || "Pendente";

  linha.innerHTML = `
    <td class="td-data">
      <input type="date" class="campo-data" value="${dados.data || ""}">
    </td>

    <td class="td-procedimento">
      <div class="autocomplete-wrap">
        <input
          type="text"
          class="campo-procedimento"
          placeholder="Digite para buscar..."
          autocomplete="off"
          value="${escapeHtml(dados.procedimento || "")}"
        >
        <div class="autocomplete-list" style="display:none;"></div>
      </div>
    </td>

    <td class="td-dente">
      <input
        type="text"
        class="campo-dente"
        value="${escapeHtml(dados.dente || "")}"
        placeholder="Ex: 11"
        maxlength="4"
      >
    </td>

    <td class="td-status">
      <select class="campo-status">
        <option value="Pendente" ${statusAtual === "Pendente" ? "selected" : ""}>Pendente</option>
        <option value="Concluido" ${statusAtual === "Concluido" ? "selected" : ""}>Concluído</option>
        <option value="Pend Pagamento" ${statusAtual === "Pend Pagamento" ? "selected" : ""}>Pend. Pagamento</option>
      </select>
    </td>

    <td class="td-valor">
      <input
        type="text"
        class="campo-valor"
        value="${formatarValorInput(dados.valor)}"
        placeholder="0,00"
        inputmode="numeric"
      >
    </td>

    <td class="td-observacao">
      <textarea
        class="campo-observacao"
        rows="2"
        placeholder="Observações..."
      >${escapeHtml(dados.observacao || "")}</textarea>
    </td>

    <td class="td-acao">
      <div class="acoes-linha">
        <button type="button" class="btn-visualizar" title="Visualizar">👁</button>
        <button type="button" class="btn-faturar" title="Faturar">💰</button>
        <button type="button" class="btn-remover-linha" title="Remover">🗑</button>
      </div>
    </td>
  `;

  const inputProcedimento = linha.querySelector(".campo-procedimento");
  const sugestoesBox = linha.querySelector(".autocomplete-list");
  const inputValor = linha.querySelector(".campo-valor");
  const btnVisualizar = linha.querySelector(".btn-visualizar");
  const btnFaturar = linha.querySelector(".btn-faturar");
  const btnRemover = linha.querySelector(".btn-remover-linha");

  inputValor.addEventListener("input", () => {
    aplicarMascaraMoeda(inputValor);
    atualizarTotal();
  });

  inputValor.addEventListener("blur", () => {
    aplicarMascaraMoeda(inputValor);
    atualizarTotal();
  });

  inputProcedimento.addEventListener("input", () => {
    buscarProcedimentosLinha(inputProcedimento, sugestoesBox, linha);
  });

  btnVisualizar.addEventListener("click", () => visualizarLinha(linha));
  btnFaturar.addEventListener("click", () => faturarLinha(linha));

  btnRemover.addEventListener("click", () => {
    linha.remove();

    if (!document.querySelector("#tabelaTratamento tr")) {
      adicionarLinha();
    }

    atualizarTotal();
  });

  document.addEventListener("click", (e) => {
    const wrap = linha.querySelector(".autocomplete-wrap");
    if (wrap && !wrap.contains(e.target)) {
      esconderSugestoes(sugestoesBox);
    }
  });

  tabelaTratamento.appendChild(linha);
  atualizarTotal();
}

function buscarProcedimentosLinha(input, sugestoesBox, linha) {
  const texto = (input.value || "").trim();

  clearTimeout(debounceTimers.get(input));

  const timer = setTimeout(async () => {
    if (texto.length < 2) {
      mostrarSugestoes([], sugestoesBox, linha);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/procedimentos/buscar?nome=${encodeURIComponent(texto)}`);
      const data = await res.json();
      mostrarSugestoes(Array.isArray(data) ? data : [], sugestoesBox, linha);
    } catch (error) {
      console.error(error);
      mostrarSugestoes([], sugestoesBox, linha);
    }
  }, 250);

  debounceTimers.set(input, timer);
}

function mostrarSugestoes(lista, sugestoesBox, linha) {
  sugestoesBox.innerHTML = "";

  if (!lista.length) {
    sugestoesBox.style.display = "none";
    return;
  }

  lista.forEach(proc => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.textContent = `${proc.nome || ""} ${proc.tipo ? "(" + proc.tipo + ")" : ""} ${proc.dente ? "- Dente: " + proc.dente : ""}`;
    item.addEventListener("click", () => selecionarProcedimentoLinha(proc, linha, sugestoesBox));
    sugestoesBox.appendChild(item);
  });

  sugestoesBox.style.display = "block";
}

function esconderSugestoes(sugestoesBox) {
  sugestoesBox.style.display = "none";
}

function selecionarProcedimentoLinha(proc, linha, sugestoesBox) {
  const inputProcedimento = linha.querySelector(".campo-procedimento");
  const inputDente = linha.querySelector(".campo-dente");
  const inputValor = linha.querySelector(".campo-valor");

  inputProcedimento.value = proc.nome || "";

  if (!inputDente.value && proc.dente) {
    inputDente.value = proc.dente;
  }

  inputValor.value = formatarValorInput(proc.valor);

  esconderSugestoes(sugestoesBox);
  atualizarTotal();
}

function visualizarLinha(linha) {
  const dados = obterDadosLinha(linha);

  document.getElementById("modalData").value = formatarDataBR(dados.data);
  document.getElementById("modalProcedimento").value = dados.procedimento;
  document.getElementById("modalDente").value = dados.dente;
  document.getElementById("modalStatus").value = dados.status;
  document.getElementById("modalValor").value = formatarMoeda(dados.valor);
  document.getElementById("modalObservacao").value = dados.observacao || "";

  modalVisualizar.classList.remove("hidden");
}

function fecharModalVisualizacao() {
  modalVisualizar.classList.add("hidden");
}

async function faturarLinha(linha) {
  const dados = obterDadosLinha(linha);

  if (!dados.procedimento) {
    alert("Preencha o procedimento antes de faturar.");
    return;
  }

  if (dados.status !== "Concluido" && dados.status !== "Pend Pagamento") {
    alert('Só é possível faturar quando o status for "Concluído" ou "Pend. Pagamento".');
    return;
  }

  if (!dados.data) {
    alert("Informe a data antes de faturar.");
    return;
  }

  if (!dados.valor || Number(dados.valor) <= 0) {
    alert("Informe um valor válido antes de faturar.");
    return;
  }

  const confirmado = confirm(
    `Deseja lançar este procedimento no faturamento?\n\n` +
    `Paciente: ${estado.paciente.nome || "-"}\n` +
    `Procedimento: ${dados.procedimento}\n` +
    `Valor: ${formatarMoeda(dados.valor)}`
  );

  if (!confirmado) return;

  const payload = {
    data: dados.data,
    tipo: "entrada",
    descricao: `${estado.paciente.nome || "Paciente"} - ${dados.procedimento}`,
    valor: Number(dados.valor),
    pagamento: dados.status === "Concluido" ? "ok" : "pendente"
  };

  try {
    const res = await fetch(`${API_BASE}/faturamento`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Erro ao lançar no faturamento");

    alert("Lançado no faturamento com sucesso!");
  } catch (error) {
    console.error(error);
    alert("Erro ao lançar no faturamento.");
  }
}

async function salvarTratamentos() {
  const linhas = document.querySelectorAll("#tabelaTratamento tr");
  const tratamentos = [];

  for (const linha of linhas) {
    const dados = obterDadosLinha(linha);

    const linhaVazia =
      !dados.data &&
      !dados.procedimento &&
      !dados.dente &&
      !dados.valor &&
      !dados.observacao;

    if (linhaVazia) continue;

    if (!dados.procedimento) {
      alert("Preencha o procedimento antes de salvar.");
      return;
    }

    if ((dados.status === "Concluido" || dados.status === "Pend Pagamento") && !dados.data) {
      alert(`Informe a data para o procedimento "${dados.procedimento}".`);
      return;
    }

    tratamentos.push({
      cpf,
      data: dados.data,
      procedimento: dados.procedimento,
      dente: dados.dente,
      status: dados.status,
      valor: Number(dados.valor) || 0,
      observacao: dados.observacao
    });
  }

  if (tratamentos.length === 0) {
    alert("Nenhum tratamento preenchido para salvar.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/tratamentos/salvar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tratamentos)
    });

    if (!res.ok) throw new Error("Erro ao salvar tratamentos");

    alert("Tratamentos salvos com sucesso!");
    await carregarTratamentos();
  } catch (error) {
    console.error(error);
    alert("Erro ao salvar tratamentos.");
  }
}

function obterDadosLinha(linha) {
  return {
    data: linha.querySelector(".campo-data")?.value?.trim() || "",
    procedimento: linha.querySelector(".campo-procedimento")?.value?.trim() || "",
    dente: linha.querySelector(".campo-dente")?.value?.trim() || "",
    status: linha.querySelector(".campo-status")?.value?.trim() || "Pendente",
    valor: parseMoedaBR(linha.querySelector(".campo-valor")?.value || ""),
    observacao: linha.querySelector(".campo-observacao")?.value?.trim() || ""
  };
}

function atualizarTotal() {
  let total = 0;

  document.querySelectorAll("#tabelaTratamento .campo-valor").forEach(input => {
    total += parseMoedaBR(input.value || "");
  });

  totalValor.innerText = total.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatarMoeda(valor) {
  const numero = Number(valor) || 0;
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarDataBR(dataISO) {
  if (!dataISO) return "";
  const partes = dataISO.split("-");
  if (partes.length !== 3) return dataISO;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function escapeHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseMoedaBR(valor) {
  if (!valor) return 0;

  const limpo = String(valor).replace(/\s/g, "");
  const numero = limpo.replace(/\./g, "").replace(",", ".");
  return Number(numero) || 0;
}

function formatarValorInput(valor) {
  const numero = Number(valor) || 0;
  if (!numero) return "";
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function aplicarMascaraMoeda(input) {
  let valor = input.value.replace(/\D/g, "");

  if (!valor) {
    input.value = "";
    return;
  }

  const numero = Number(valor) / 100;

  input.value = numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}