document.getElementById('cpf').addEventListener('input', function (e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 11) value = value.slice(0, 11);
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  e.target.value = value;
});

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0, resto;

  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

function copiarmensagem() {

    const mensagem = `Olá 😊

Para adiantar seu pré-cadastro, por favor me envie as informações abaixo:

Nome completo:
Data nasc:
CPF:
Telefone:
Email:
CEP:
Número residência:
Complemento:
Como conheceu o consultório:`;

    navigator.clipboard.writeText(mensagem)
        .then(() => {

            const botao = document.getElementById('btnCopiarMensagem');

            if (botao) {

                const textoOriginal = botao.innerText;

                botao.innerText = 'Copiado ✓';

                setTimeout(() => {
                    botao.innerText = textoOriginal;
                }, 1500);
            }

        })
        .catch((erro) => {

            console.error(
                'Erro ao copiar mensagem:',
                erro
            );

        });
}

function buscarEndereco() {
  const cep = document.getElementById("cep").value.replace(/\D/g, '');
  if (cep.length !== 8) {
    alert("CEP inválido.");
    return;
  }

  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(response => response.json())
    .then(dados => {
      if (dados.erro) {
        alert("CEP não encontrado.");
        return;
      }
      document.getElementById("rua").value = dados.logradouro;
      document.getElementById("bairro").value = dados.bairro;
      document.getElementById("cidade").value = dados.localidade;
      document.getElementById("estado").value = dados.uf;
    })
    .catch(() => {
      alert("Erro ao buscar CEP.");
    });
}

function salvarCadastro() {
  const paciente = {
    nome: document.getElementById("nome").value,
    cpf: document.getElementById("cpf").value,
    dataNascimento: document.getElementById("dataNascimento").value,
    telefone: document.getElementById("telefone").value,
    email: document.getElementById("email").value,
    endereco: {
      cep: document.getElementById("cep").value,
      rua: document.getElementById("rua").value,
      bairro: document.getElementById("bairro").value,
      cidade: document.getElementById("cidade").value,
      estado: document.getElementById("estado").value,
      numero: document.getElementById("numero").value,
      complemento: document.getElementById("complemento").value
    },
    origem: document.getElementById("origem").value,
    status: "Ativo"  // ✅ sempre salva como Ativo no cadastro
  };

  if (!validarCPF(paciente.cpf)) {
    alert("CPF inválido. Por favor, verifique o número digitado.");
    return;
  }

  if (!paciente.cpf || !paciente.nome || !paciente.dataNascimento || !paciente.telefone) {
    alert("Preencha os campos obrigatórios.");
    return;
  }

  fetch('http://localhost:3000/api/pacientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paciente)
  })
    .then(response => {
      console.log(response);
      return response.json();
    })
    .then(data => {
      console.log(data);
      if (data.sucesso) {
        gerarQRCode(data.cpf);
      } else {
        alert(data.mensagem || "Erro ao salvar.");
      }
    })
    .catch(erro => {
      console.error(erro);
      alert("Erro ao conectar com o servidor.");
    });
}
function cadastroRapido() {
  const paciente = {
    nome: document.getElementById("nome").value,
    cpf: document.getElementById("cpf").value,
    dataNascimento: document.getElementById("dataNascimento").value,
    telefone: document.getElementById("telefone").value,
    email: document.getElementById("email").value,
    endereco: {
      cep: document.getElementById("cep").value,
      rua: document.getElementById("rua").value,
      bairro: document.getElementById("bairro").value,
      cidade: document.getElementById("cidade").value,
      estado: document.getElementById("estado").value,
      numero: document.getElementById("numero").value,
      complemento: document.getElementById("complemento").value
    },
    origem: document.getElementById("origem").value,
    status: "Ativo"
  };

  if (!validarCPF(paciente.cpf)) {
    alert("CPF inválido. Por favor, verifique o número digitado.");
    return;
  }

  if (!paciente.cpf || !paciente.nome || !paciente.dataNascimento || !paciente.telefone) {
    alert("Preencha os campos obrigatórios.");
    return;
  }

  fetch('http://localhost:3000/api/pacientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paciente)
  })
    .then(r => r.json())
    .then(data => {
      if (data.sucesso) {
        alert("Cadastro rápido salvo com sucesso! ✅");

        // opcional: limpar formulário
        document.getElementById("cadastroForm").reset();

        // opcional: limpar área do QR, caso tenha ficado de um cadastro anterior
        document.getElementById("qrcode").innerHTML = "";
        document.getElementById("qrcodeLink").removeAttribute("href");
      } else {
        alert(data.mensagem || "Erro ao salvar.");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    });
}

function mensagemWhatsApp() {
  document.getElementById("popupWhatsApp").style.display = "flex";
  document.getElementById("textoWhatsApp").value = "";
  document.getElementById("textoWhatsApp").focus();
}

function fecharPopupWhatsApp() {
  document.getElementById("popupWhatsApp").style.display = "none";
}

function processarMensagemWhatsApp() {
  const texto = document.getElementById("textoWhatsApp").value.trim();

  if (!texto) {
    alert("Cole a mensagem do paciente antes de enviar.");
    return;
  }

  const dados = extrairDadosWhatsApp(texto);

  if (dados.nome) document.getElementById("nome").value = dados.nome;
  if (dados.cpf) document.getElementById("cpf").value = formatarCPF(dados.cpf);
  if (dados.dataNascimento) document.getElementById("dataNascimento").value = converterDataParaInput(dados.dataNascimento);
  if (dados.telefone) document.getElementById("telefone").value = formatarTelefone(dados.telefone);
  if (dados.email) document.getElementById("email").value = dados.email;
  if (dados.cep) document.getElementById("cep").value = formatarCEP(dados.cep);
  if (dados.numero) document.getElementById("numero").value = dados.numero;
  if (dados.complemento) document.getElementById("complemento").value = dados.complemento;
  if (dados.origem) document.getElementById("origem").value = dados.origem;

  fecharPopupWhatsApp();

  if (dados.cep) {
    buscarEndereco();
  }
}

function extrairDadosWhatsApp(texto) {
  const linhas = texto
    .split("\n")
    .map(linha => linha.trim())
    .filter(linha => linha !== "");

  const dados = {
    nome: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
    email: "",
    cep: "",
    numero: "",
    complemento: "",
    origem: ""
  };

  for (const linha of linhas) {
    const linhaLower = linha.toLowerCase();

    if (linhaLower.startsWith("nome")) {
      dados.nome = pegarValorLinha(linha);
    } else if (linhaLower.includes("data nasc") || linhaLower.includes("data de nasc")) {
      dados.dataNascimento = pegarValorLinha(linha);
    } else if (linhaLower.startsWith("cpf")) {
      dados.cpf = pegarValorLinha(linha);
    } else if (linhaLower.startsWith("telefone") || linhaLower.startsWith("celular")) {
      dados.telefone = pegarValorLinha(linha);
    } else if (linhaLower.startsWith("email")) {
      dados.email = pegarValorLinha(linha);
    } else if (linhaLower.startsWith("cep")) {
      dados.cep = pegarValorLinha(linha);
    } else if (linhaLower.includes("número") || linhaLower.includes("numero")) {
      dados.numero = pegarValorLinha(linha);
    } else if (linhaLower.includes("complemento")) {
      dados.complemento = pegarValorLinha(linha);
    } else if (linhaLower.includes("como conheceu") || linhaLower.includes("origem")) {
      dados.origem = pegarValorLinha(linha);
    }
  }

  return dados;
}

function pegarValorLinha(linha) {
  const partes = linha.split(":");
  if (partes.length > 1) {
    return partes.slice(1).join(":").trim();
  }
  return "";
}

function formatarCPF(cpf) {
  const numeros = cpf.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return numeros.replace(/(\d{3})(\d+)/, "$1.$2");
  if (numeros.length <= 9) return numeros.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");

  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarTelefone(telefone) {
  const numeros = telefone.replace(/\D/g, "").slice(0, 11);

  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (numeros.length === 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return telefone;
}

function formatarCEP(cep) {
  const numeros = cep.replace(/\D/g, "").slice(0, 8);
  if (numeros.length === 8) {
    return numeros.replace(/(\d{5})(\d{3})/, "$1-$2");
  }
  return cep;
}

function converterDataParaInput(dataTexto) {
  const data = dataTexto.trim();

  // Formato dd/mm/aaaa
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
    const [dia, mes, ano] = data.split("/");
    return `${ano}-${mes}-${dia}`;
  }

  // Formato dd-mm-aaaa
  if (/^\d{2}-\d{2}-\d{4}$/.test(data)) {
    const [dia, mes, ano] = data.split("-");
    return `${ano}-${mes}-${dia}`;
  }

  // Se já vier no formato yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return data;
  }

  return "";
}

function gerarQRCode(cpf) {
  document.getElementById("qrcode").innerHTML = "";

  // Remove pontos e traço
  const cpfLimpo = cpf.replace(/\D/g, '');

  const url = `cadastro-paciente-anamnese.html?cpf=${cpfLimpo}`;

  const link = document.createElement("a");
  link.href = url;
  link.style.display = "inline-block";

  new QRCode(link, {
    text: url,
    width: 200,
    height: 200
  });

  document.getElementById("qrcode").appendChild(link);
  document.getElementById("qrcodeLink").href = url;
}