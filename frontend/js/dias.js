document.getElementById('cid').value = '';

function atestadodias() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const paciente = document.getElementById('paciente').value;
    const cpf = document.getElementById('cpf').value;
    const data = document.getElementById('data').value;
    const dataFormatada = data.split('-').reverse().join('/');
    const entrada = document.getElementById('entrada').value;
    const saida = document.getElementById('saida').value;
    const diasrepouso = document.getElementById('diasrepouso').value;
    const cid = document.getElementById('cid').value;

    let diasFormatado = document.getElementById('diasrepouso').value;
    diasFormatado = diasFormatado === '' ? '00' : diasFormatado.toString().padStart(2, '0');

    // Marca d'água no centro da página
    doc.addImage(logoBase642, 'PNG', 30, 90, 150, 150);
    // Adiciona logo no topo
    doc.addImage(logoBase64, 'PNG', 30, 10, 150, 23);

    if (paciente === '' || diasrepouso === '') {
        alert("Por favor, preencha o nome do paciente e os dias.");
        return;
    }

    // Caixa de identificação do eminente
    doc.setFontSize(12);
    const inicioY = 45;
    doc.rect(15, inicioY, 180, 30);
    doc.setFont(undefined, 'bold');
    doc.text(idEminente, 70, inicioY + 7);
    doc.line(15, inicioY + 9, 195, inicioY + 9);

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
    doc.text(dataFormatada, 35, inicioY + 23);

    doc.setFont(undefined, 'bold');
    doc.text("-    São Paulo - SP", 60, inicioY + 23);

    // Paciente
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Paciente:', 20, inicioY + 37);
    doc.setFont(undefined, 'normal');
    doc.text(paciente, 45, inicioY + 37);
    doc.setFont(undefined, 'bold');
    doc.text('CPF:', 20, inicioY + 44);
    doc.setFont(undefined, 'normal');
    doc.text(cpf, 45, inicioY + 44);

    let y = 100;

    // Título
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text("Atestado Odontológico", 105, y, { align: "center" });

    y += 20;
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text("Atesto, para os devidos fins, que o(a) paciente ", 20, y);

    // Nome do paciente em negrito
    const pacienteX = doc.getTextWidth("Atesto, para os devidos fins, que o(a) paciente ") + 20;
    doc.setFont(undefined, 'bold');
    doc.text(paciente, pacienteX, y);

    let proximaX = pacienteX + doc.getTextWidth(paciente) + 2;
    doc.setFont(undefined, 'normal');
    doc.text(",", proximaX, y);

    y += 10;
    doc.text("esteve em consulta odontológica nesta data, "+ dataFormatada +" no período das " +entrada+" às "+saida, 20,y); 

    // Dias de repouso em negrito
    y += 10;
    doc.text("e deverá permanecer em repouso por  ", 20, y);
    const diasX = doc.getTextWidth("esteve em consulta odontológica nesta data e deverá permanecer em repouso por  ") + 20;
    doc.setFont(undefined, 'bold');
    doc.text(`${diasFormatado} dias`, 94, y);
    const finalX = diasX + doc.getTextWidth(diasFormatado) + 2;
    doc.setFont(undefined, 'normal');
    doc.text(", a contar de hoje.", 110, y);

    // CID se houver
    if (cid !== '') {
        y = 200;
        doc.setFont(undefined, 'normal');
        doc.text(`CID: ${cid}`, 20, y);
    }

    if (assinatura.checked) {
            y = 200;
            doc.addImage(carimbo, 'PNG', 135, 215, 38, 38);
        }

    //Assinatura
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(ass1, 130, inicioY + 205);
    doc.text(ass2, 130, inicioY + 210);


    // Rodapé
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(endereco, 50, 275);
    doc.text(telefone, 80, 280);

    doc.save(`Atestado_${paciente}.pdf`);
}
// ============================
// AutoComplete de Pacientes
// ============================

const pacienteInput = document.getElementById('paciente');
const sugestoesDiv = document.getElementById('sugestoes');

pacienteInput.addEventListener('input', async () => {
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
                const cpfFormatado = p.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

                document.getElementById('cpf').value = cpfFormatado;
                //const enderecoInput = document.getElementById('endereco');
                //if (enderecoInput) enderecoInput.value = p.endereco || '';
                sugestoesDiv.innerHTML = '';
            });
            sugestoesDiv.appendChild(sugestao);
        });
    } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
    }
});

// Ocultar sugestões se clicar fora
document.addEventListener('click', (e) => {
    if (e.target !== pacienteInput) {
        sugestoesDiv.innerHTML = '';
    }
});

// ============================
// Deixar a função disponível no escopo global para o HTML
// ============================
window.gerarPDF = gerarPDF;
