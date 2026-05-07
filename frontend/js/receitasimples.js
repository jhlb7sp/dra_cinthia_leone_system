function gerarPDFsimples() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const paciente = document.getElementById('paciente').value;
  const cpf = document.getElementById('cpf').value;
  const assinatura = document.getElementById('assinatura');

  // pega a lista certa (vem do script.js)
  const meds = window.medicamentos || [];

  if (!paciente || meds.length === 0) {
    alert("Preencha nome e pelo menos um medicamento!");
    return;
  }

  // sua receita simples gera 1 via
  for (let via = 1; via < 2; via++) {
    if (via > 1) doc.addPage();

    doc.addImage(logoBase642, 'PNG', 30, 90, 150, 150);
    doc.addImage(logoBase64, 'PNG', 30, 10, 150, 23);

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

    doc.setFont(undefined, 'bold');
    doc.text('Paciente:', 20, inicioY + 37);
    doc.setFont(undefined, 'normal');
    doc.text(paciente, 40, inicioY + 37);

    doc.setFont(undefined, 'bold');
    doc.text('CPF:', 120, inicioY + 37);
    doc.setFont(undefined, 'normal');
    doc.text(cpf, 135, inicioY + 37);

    // Título Prescrição
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Prescrição", 95, inicioY + 57, { align: 'center' });

    // ==========================
    // Prescrição (quebra em linhas)
    // ==========================
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);

    let y = inicioY + 67;
    const LIMITE_Y = 220;

    meds.forEach(m => {
      // se vier string (formato antigo), adapta
      const item = (typeof m === 'string') ? { texto: m, obs: '' } : m;

      // separa em 2 partes pelo "—"
      const partes = (item.texto || '').split('—');
      const medicamentoTxt = (partes[0] || '').trim();
      const posologiaTxt   = (partes[1] || '').trim();

      // 1) Linha do medicamento
      const linhasMed = doc.splitTextToSize(`- ${medicamentoTxt}`, 180);
      if (y + (linhasMed.length * 6) > LIMITE_Y) { doc.addPage(); y = 20; }
      doc.text(linhasMed, 20, y);
      y += linhasMed.length * 6;

      // 2) Linha posologia (indentada)
      if (posologiaTxt) {
        const linhasPos = doc.splitTextToSize(posologiaTxt, 165);
        if (y + (linhasPos.length * 6) > LIMITE_Y) { doc.addPage(); y = 20; }
        doc.text(linhasPos, 28, y);
        y += linhasPos.length * 6;
      }

      // 3) Observação (se existir)
      if (item.obs) {
        doc.setFontSize(10);
        const linhasObs = doc.splitTextToSize(`Obs: ${item.obs}`, 165);
        if (y + (linhasObs.length * 6) > LIMITE_Y) { doc.addPage(); y = 20; }
        doc.text(linhasObs, 28, y);
        y += linhasObs.length * 6;
        doc.setFontSize(11);
      }

      y += 2;
    });

    // Assinatura
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(ass1, 130, inicioY + 205);
    doc.text(ass2, 130, inicioY + 210);

    if (assinatura?.checked) {
      doc.addImage(carimbo, 'PNG', 135, 215, 38, 38);
    }

    // Rodapé
    doc.setFontSize(9);
    doc.text(endereco, 50, 275);
    doc.text(telefone, 80, 280);
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

        // corrigido: value
        const enderecoInput = document.getElementById('endereco');
        if (enderecoInput) enderecoInput.value = '';

        if (p.endereco && typeof p.endereco === 'object' && enderecoInput) {
          const e = p.endereco;
          const enderecoFormatado =
            `${e.rua || ''}, ${e.numero || ''} - ${e.bairro || ''} - ${e.cep || ''}` +
            `${e.cidade ? `, ${e.cidade}` : ''}` +
            `${e.estado ? ` - ${e.estado}` : ''}`;

          enderecoInput.value = enderecoFormatado.trim();
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

    // corrigido: não sombreia window.medicamentos
    const medsAPI = await response.json();

    sugestoesMedDiv.innerHTML = '';

    medsAPI.forEach(med => {
      const sugestao = document.createElement('div');
      const descricao = med.mg ? `${med.nome} ------------------------------------------ ${med.mg}` : med.nome;
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

// expor a função correta (simples)
window.gerarPDFsimples = gerarPDFsimples;
