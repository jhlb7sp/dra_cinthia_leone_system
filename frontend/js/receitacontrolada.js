// ==============================
// Função para gerar o PDF
// ==============================
console.log("PDF carregado com sucesso!");
function gerarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const paciente = document.getElementById('paciente').value;
  const cpf = document.getElementById('cpf').value;
  const enderecoPaciente = document.getElementById('endereco')?.value || '';
  const assinatura = document.getElementById('assinatura');

  // medicamentos vem do script.js (window.medicamentos)
  const meds = window.medicamentos || [];

  if (!validarCPF(cpf)) {
    alert("CPF inválido. Por favor, verifique o número digitado.");
    return;
  }

  if (!paciente || !cpf || meds.length === 0) {
    alert("Preencha nome, CPF e pelo menos um medicamento!");
    return;
  }

  for (let via = 1; via <= 2; via++) {
    if (via > 1) doc.addPage();

    doc.addImage(logoBase642, 'PNG', 30, 90, 150, 150);
    doc.addImage(logoBase64, 'PNG', 30, 10, 150, 23);
    doc.setFontSize(10);
    doc.text(`${via}ª VIA`, 180, 20);

    doc.setFontSize(12);
    const inicioY = 45;
    doc.rect(15, inicioY, 180, 30);
    doc.setFont(undefined, 'bold');
    doc.text(idEminente, 70, inicioY + 7);
    doc.line(15, inicioY + 9, 195, inicioY + 9);

    doc.setFont(undefined, 'bold');
    doc.text("Nome:", 20, inicioY + 15);
    doc.setFont(undefined, 'normal');
    doc.text(cinthia, 35, inicioY + 15);

    doc.setFont(undefined, 'bold');
    doc.text("CRO:", 85, inicioY + 15);
    doc.setFont(undefined, 'normal');
    doc.text(cro, 100, inicioY + 15);

    doc.setFont(undefined, 'bold');
    doc.text("Data:", 20, inicioY + 23);
    doc.setFont(undefined, 'normal');
    doc.text(new Date().toLocaleDateString(), 35, inicioY + 23);
    doc.setFont(undefined, 'bold');
    doc.text("-    São Paulo - SP", 60, inicioY + 23);

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Paciente:', 20, inicioY + 37);
    doc.setFont(undefined, 'normal');
    doc.text(paciente, 50, inicioY + 37);

    doc.setFont(undefined, 'bold');
    doc.text('CPF:', 120, inicioY + 37);
    doc.setFont(undefined, 'normal');
    doc.text(cpf, 135, inicioY + 37);

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Endereço:', 20, inicioY + 43);

    if (enderecoPaciente) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(enderecoPaciente, 50, inicioY + 43);
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Prescrição", 95, inicioY + 57, { align: 'center' });

    // ==========================
// Prescrição (1 linha medicamento, 1 linha posologia, obs opcional)
// ==========================
doc.setFont(undefined, 'normal');
doc.setFontSize(11);

let y = inicioY + 67;
const LIMITE_Y = 220;

meds.forEach(m => {
  // segurança: se vier string (formato antigo), adapta
  const item = (typeof m === 'string') ? { texto: m, obs: '' } : m;

  // separa em 2 partes pelo "—"
  const partes = (item.texto || '').split('—');
  const medicamentoTxt = (partes[0] || '').trim(); // ex: "Dipirona 1g"
  const posologiaTxt   = (partes[1] || '').trim(); // ex: "Tomar 1 comprimido(s)..."

  // 1) Linha do medicamento
  const linhasMed = doc.splitTextToSize(`- ${medicamentoTxt}`, 180);
  if (y + (linhasMed.length * 6) > LIMITE_Y) { doc.addPage(); y = 20; }
  doc.text(linhasMed, 20, y);
  y += linhasMed.length * 6;

  // 2) Linha da posologia (embaixo e indentada)
  if (posologiaTxt) {
    const linhasPos = doc.splitTextToSize(posologiaTxt, 165);
    if (y + (linhasPos.length * 6) > LIMITE_Y) { doc.addPage(); y = 20; }
    doc.text(linhasPos, 28, y); // 28 = identação
    y += linhasPos.length * 6;
  }

  // 3) Observação (se existir) embaixo e menor
  if (item.obs) {
    doc.setFontSize(10);
    const linhasObs = doc.splitTextToSize(`Obs: ${item.obs}`, 165);
    if (y + (linhasObs.length * 6) > LIMITE_Y) { doc.addPage(); y = 20; }
    doc.text(linhasObs, 28, y); // indentada
    y += linhasObs.length * 6;
    doc.setFontSize(11);
  }

  y += 2; // espacinho entre medicamentos
});


    // Quadros / rodapé
    const quadroY = 232;
    doc.rect(14, quadroY, 90, 40);
    doc.setFontSize(12);
    doc.text("IDENTIFICAÇÃO DO COMPRADOR", 18, quadroY + 7);
    doc.setFontSize(10);
    doc.text(
      "Nome:_____________________________________\nIdentidade:______________ Org. Emissor: _______\nEndereço:__________________________________\nCidade:_____________________________UF:____\nTelefone: (___)_______________",
      18,
      quadroY + 15
    );

    doc.rect(108, quadroY, 85, 40);
    doc.setFontSize(12);
    doc.text("IDENTIFICAÇÃO DO FORNECEDOR", 112, quadroY + 7);
    doc.setFontSize(10);
    doc.text("\n\n\n\nAssinatura: ______________________\nData:__/__/_____", 112, quadroY + 15);

    if (assinatura.checked) {
      doc.addImage(carimbo, 'PNG', 135, 190, 38, 38);
    }

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(ass1, 130, inicioY + 178);
    doc.text(ass2, 130, inicioY + 183);

    doc.setFontSize(9);
    doc.text(endereco, 50, 277);
    doc.text(telefone, 80, 282);
  }

  doc.save(`Receita_${paciente}.pdf`);
}

// ============================
// AutoComplete de Pacientes
// ============================
const pacienteInput = document.getElementById('paciente');
const sugestoesDiv = document.getElementById('sugestoes');

pacienteInput?.addEventListener('input', async () => {
  const termo = pacienteInput.value.trim();

  if (termo.length < 2) {
    sugestoesDiv.innerHTML = '';
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/pacientes?nome=${encodeURIComponent(termo)}`);
    const pacientes = await response.json();

    sugestoesDiv.innerHTML = '';

    pacientes.forEach(p => {
      const sugestao = document.createElement('div');
      sugestao.textContent = p.nome;

      sugestao.addEventListener('click', () => {
        pacienteInput.value = p.nome;
        document.getElementById('cpf').value = p.cpf;

        const enderecoInput = document.getElementById('endereco');

        if (p.endereco && typeof p.endereco === 'object') {
          const e = p.endereco;
          const enderecoFormatado =
            `${e.rua || ''}, ${e.numero || ''} - ${e.bairro || ''} - ${e.cep || ''}` +
            `${e.cidade ? `, ${e.cidade}` : ''}` +
            `${e.estado ? ` - ${e.estado}` : ''}`;

          enderecoInput.value = enderecoFormatado.trim();
        } else {
          enderecoInput.value = '';
        }

        sugestoesDiv.innerHTML = '';
      });

      sugestoesDiv.appendChild(sugestao);
    });
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
  }
});

// ============================
// AutoComplete de Medicamentos
// ============================
const medicamentoInput = document.getElementById('medicamento');
const sugestoesMedDiv = document.getElementById('sugestoesMed');

medicamentoInput?.addEventListener('input', async () => {
  const termo = medicamentoInput.value.trim();

  if (termo.length < 2) {
    sugestoesMedDiv.innerHTML = '';
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/medicamentos?nome=${encodeURIComponent(termo)}`);
    const medsAPI = await response.json(); // <- nome diferente, não conflita com window.medicamentos

    sugestoesMedDiv.innerHTML = '';

    medsAPI.forEach(med => {
      const sugestao = document.createElement('div');
      const descricao = med.mg ? `${med.nome} ------------------------------------- ${med.mg}` : med.nome;
      sugestao.textContent = descricao;

      sugestao.addEventListener('click', () => {
        medicamentoInput.value = descricao;
        sugestoesMedDiv.innerHTML = '';
      });

      sugestoesMedDiv.appendChild(sugestao);
    });

  } catch (error) {
    console.error('Erro ao buscar medicamentos:', error);
  }
});

// Ocultar sugestões se clicar fora
document.addEventListener('click', (e) => {
  if (pacienteInput && e.target !== pacienteInput) sugestoesDiv.innerHTML = '';
  if (medicamentoInput && e.target !== medicamentoInput) sugestoesMedDiv.innerHTML = '';
});

// Preencher automaticamente o select de horas com os mesmos valores do intervalo
function preencherHoras() {
  const intervaloSelect = document.getElementById('intervalo');
  const horasSelect = document.getElementById('horas');

  if (!intervaloSelect || !horasSelect) return;

  horasSelect.innerHTML = '';

  for (let i = 0; i < intervaloSelect.options.length; i++) {
    const option = intervaloSelect.options[i];
    const newOption = document.createElement('option');
    newOption.value = option.value;
    newOption.text = option.text;
    horasSelect.appendChild(newOption);
  }
  horasSelect.value = intervaloSelect.value;
}

document.addEventListener('DOMContentLoaded', preencherHoras);

document.getElementById('intervalo')?.addEventListener('change', () => {
  document.getElementById('horas').value = document.getElementById('intervalo').value;
});

// expor pdf pro botão
window.gerarPDF = gerarPDF;
