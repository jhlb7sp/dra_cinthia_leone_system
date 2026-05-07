window.onload = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const cpf = urlParams.get("cpf");

  // Setando CPF no input hidden
  document.getElementById("cpf").value = cpf;

  if (cpf) {
    try {
      const response = await fetch(`http://localhost:3000/api/pacientes/cpf/${cpf}`);
      if (!response.ok) throw new Error("Erro ao buscar paciente.");

      const paciente = await response.json();
      document.getElementById("tituloAnamnese").innerText = `Anamnese Médica - ${capitalizarNome(paciente.nome)}`;

    } catch (error) {
      console.error("Erro ao carregar paciente:", error);
      alert("Paciente não encontrado.");
    }
  }

  // Ativar exibição de campos condicionais
  configurarCamposCondicionais();
};

// Função para configurar campos condicionais (mostrar campos de texto se 'Sim')
function configurarCamposCondicionais() {
  const radios = document.querySelectorAll('input[type=radio]');

  radios.forEach(radio => {
    radio.addEventListener("change", () => {
      const name = radio.name;
      const valor = radio.value;

      const campoTexto = document.querySelector(`input.campo-texto[data-name="${name}"]`);
      if (campoTexto) {
        campoTexto.style.display = (valor === "sim") ? "inline-block" : "none";
        if (valor === "nao") campoTexto.value = "";
      }
    });
  });
}

// Capturando submissão do formulário
const form = document.querySelector("form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const cpf = document.getElementById("cpf").value;
  const queixa_principal = document.getElementById("queixa_principal").value;

  if (!cpf || !queixa_principal) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const alergia = form.querySelector('input[name="alergia"]:checked')?.value;
  const alergia_qual = form.querySelector('input[name="alergia_qual"]')?.value;

  const gravida = form.querySelector('input[name="gravida"]:checked')?.value;
  const gravida_meses = form.querySelector('input[name="gravida_meses"]')?.value;

  const cirurgia = form.querySelector('input[name="cirurgia"]:checked')?.value;
  const cirurgia_qual = form.querySelector('input[name="cirurgia_qual"]')?.value;

  const tratamento = form.querySelector('input[name="tratamento"]:checked')?.value;
  const tratamento_qual = form.querySelector('input[name="tratamento_qual"]')?.value;

  const medicamento = form.querySelector('input[name="medicamento"]:checked')?.value;
  const medicamento_qual = form.querySelector('input[name="medicamento_qual"]')?.value;

  const fuma = form.querySelector('input[name="fuma"]:checked')?.value;

  const enfermidades = Array.from(form.querySelectorAll('input[name="enfermidades[]"]:checked'))
    .map(input => input.value);

  const enfermidade_outros = form.querySelector('input[name="enfermidade_outros"]')?.value;

  const observacoesGerais = document.getElementById("observacoesGerais").value;

  const dadosAnamnese = {
    cpf,
    queixa_principal,
    alergia,
    alergia_qual,
    gravida,
    gravida_meses,
    cirurgia,
    cirurgia_qual,
    tratamento,
    tratamento_qual,
    medicamento,
    medicamento_qual,
    fuma,
    enfermidades,
    enfermidade_outros,
    observacoesGerais,
  };

  try {
    const response = await fetch("http://localhost:3000/api/anamneses/cadastrar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dadosAnamnese)
    });

    if (response.ok) {
      alert("Anamnese salva com sucesso!");
      window.location.href = "/consultapaciente.html"; // ou onde preferir
    } else {
      alert("Erro ao salvar anamnese.");
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
    alert("Erro ao enviar os dados.");
  }
});
