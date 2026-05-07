let procedimentos = [];
let debounceTimer = null;

let orcamentoOriginal = null;
let orcamentoVisualizadoId = null;

// guarda o procedimento selecionado (com dados do BD)
let procedimentoSelecionado = null;

/* =========================
   HELPERS
========================= */
function debounce(fn, delay = 300) {
    return (...args) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fn(...args), delay);
    };
}

function normalizarProcedimentos(lista = []) {
    return lista.map(item => ({
        procedimento: item.procedimento || '',
        tipo: item.tipo || '',
        dente: item.dente || '',
        valor: Number(item.valor) || 0
    }));
}

function montarSnapshotAtual() {
    const paciente = document.getElementById('paciente').value.trim();
    const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
    const desconto = Number(document.getElementById('desconto').value) || 0;
    const parcelas = Number(document.getElementById('parcelas').value) || 1;

    return {
        paciente,
        cpf,
        desconto,
        parcelas,
        procedimentos: normalizarProcedimentos(procedimentos)
    };
}

function snapshotsIguais(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

/* =========================
   AUTOCOMPLETE PROCEDIMENTOS
========================= */
function mostrarSugestoes(lista) {
    const box = document.getElementById('procedimentoSugestoes');
    box.innerHTML = '';

    if (!lista.length) {
        box.style.display = 'none';
        return;
    }

    lista.forEach(proc => {
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        div.textContent = `${proc.nome} ${proc.tipo ? '(' + proc.tipo + ')' : ''} ${proc.dente ? '- Dente: ' + proc.dente : ''}`;
        div.onclick = () => selecionarProcedimento(proc);
        box.appendChild(div);
    });

    box.style.display = 'block';
}

function esconderSugestoes() {
    const box = document.getElementById('procedimentoSugestoes');
    if (box) box.style.display = 'none';
}

function selecionarProcedimento(proc) {
    procedimentoSelecionado = proc;

    document.getElementById('procedimentoInput').value = proc.nome || '';
    document.getElementById('tipo').value = proc.tipo || '';
    document.getElementById('dente').value = proc.dente || '';

    const valorBruto = proc.valor ?? 0;
    const valorNum = Number(String(valorBruto).replace(/\./g, '').replace(',', '.')) || 0;
    document.getElementById('valorProc').value = valorNum;

    esconderSugestoes();
}

const buscarProcedimentos = debounce(async (texto) => {
    const q = (texto || '').trim();

    if (q.length < 2) {
        mostrarSugestoes([]);
        return;
    }

    try {
        const res = await fetch(`/api/procedimentos/buscar?nome=${encodeURIComponent(q)}`);
        const data = await res.json();
        mostrarSugestoes(Array.isArray(data) ? data : []);
    } catch (e) {
        console.error('Erro ao buscar procedimentos:', e);
        mostrarSugestoes([]);
    }
}, 250);

/* =========================
   PROCEDIMENTOS / TABELA
========================= */
function addProcedimento() {
    const procedimento = document.getElementById('procedimentoInput').value.trim();
    const tipo = document.getElementById('tipo').value.trim();
    const dente = document.getElementById('dente').value.trim();
    const valorStr = (document.getElementById('valorProc').value || '').toString();
    const valor = Number(valorStr.replace(/\./g, '').replace(',', '.')) || 0;

    if (!procedimento) {
        alert('Informe o procedimento.');
        return;
    }

    procedimentos.push({
        procedimento,
        tipo,
        dente,
        valor
    });

    document.getElementById('procedimentoInput').value = '';
    document.getElementById('tipo').value = '';
    document.getElementById('dente').value = '';
    document.getElementById('valorProc').value = '';

    procedimentoSelecionado = null;
    atualizarTabela();
}

function atualizarTabela() {
    const tabela = document.getElementById('tabelaProcedimentos');
    const tbody = tabela.querySelector('tbody');
    tbody.innerHTML = '';

    let total = 0;

    procedimentos.forEach((item, index) => {
        const row = tbody.insertRow();

        row.insertCell(0).innerText = item.procedimento;
        row.insertCell(1).innerText = item.tipo;
        row.insertCell(2).innerText = item.dente;

        const valorCell = row.insertCell(3);
        const inputValor = document.createElement('input');
        inputValor.type = 'number';
        inputValor.min = '0';
        inputValor.step = '0.01';
        inputValor.value = item.valor.toFixed(2);
        inputValor.style.width = '80px';

        inputValor.onfocus = () => {
            inputValor.value = '';
        };

        inputValor.onchange = () => {
            procedimentos[index].valor = parseFloat(inputValor.value) || 0;
            atualizarTabela();
        };

        valorCell.appendChild(inputValor);

        const acaoCell = row.insertCell(4);
        const btnRemove = document.createElement('button');
        btnRemove.innerText = 'Remover';
        btnRemove.className = 'btn-remove';

        btnRemove.onclick = () => {
            procedimentos.splice(index, 1);
            atualizarTabela();
        };

        acaoCell.appendChild(btnRemove);

        total += item.valor;
    });

    const desconto = parseFloat(document.getElementById('desconto').value) || 0;
    const totalComDescontoPix = total - (total * (desconto / 100));

    const parcelas = Math.max(1, parseInt(document.getElementById('parcelas').value) || 1);
    const valorParcela = total / parcelas;

    document.getElementById('total').innerText = 'R$ ' + total.toFixed(2).replace('.', ',');
    document.getElementById('valorParcela').innerText = `Em ${parcelas}x de R$ ${valorParcela.toFixed(2).replace('.', ',')}`;

    const elTextoDesconto = document.getElementById('textoDesconto');
    if (desconto > 0) {
        elTextoDesconto.innerText = `${desconto}% de desconto no Pix ou Dinheiro (R$ ${totalComDescontoPix.toFixed(2).replace('.', ',')}).`;
    } else {
        elTextoDesconto.innerText = '';
    }

    tabela.style.display = procedimentos.length > 0 ? 'table' : 'none';
}

/* =========================
   PDF
========================= */
function gerarPdfOrcamento({ paciente, cpf, desconto, parcelas, total, totalComDesconto, valorParcela }) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const inicioY = 45;

    doc.addImage(logoBase642, 'PNG', 30, 90, 150, 150);
    doc.addImage(logoBase64, 'PNG', 30, 10, 150, 23);

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text("Dra. Cinthia Leone da Cunha", 15, inicioY + 9);

    doc.line(15, inicioY + 12, 195, inicioY + 12);

    doc.setFont(undefined, 'bold');
    doc.text("CRO:", 75, inicioY + 9);
    doc.setFont(undefined, 'normal');
    doc.text(cro, 90, inicioY + 9);

    doc.setFont(undefined, 'bold');
    doc.text("Data:", 115, inicioY + 9);
    doc.setFont(undefined, 'normal');
    doc.text(new Date().toLocaleDateString(), 130, inicioY + 9);
    doc.setFont(undefined, 'bold');
    doc.text("-    São Paulo - SP", 155, inicioY + 9);

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text("Orçamento Odontológico", 70, inicioY + 25);

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Paciente:', 20, inicioY + 37);
    doc.setFont(undefined, 'normal');
    doc.text(paciente, 45, inicioY + 37);

    if (cpf) {
        doc.setFont(undefined, 'bold');
        doc.text('CPF:', 130, inicioY + 37);
        doc.setFont(undefined, 'normal');
        doc.text(cpf, 142, inicioY + 37);
    }

    let y = 95;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Procedimentos:", 20, y);
    y += 10;

    doc.setFont(undefined, 'normal');
    procedimentos.forEach(item => {
        doc.text(
            `${item.procedimento} ${item.tipo ? '(' + item.tipo + ')' : ''} ${item.dente ? 'Dente: ' + item.dente : ''}  R$ ${item.valor.toFixed(2).replace('.', ',')}`,
            20, y
        );
        y += 8;
    });

    y += 10;
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: R$ ${total.toFixed(2).replace('.', ',')}`, 20, y + 20);

    y += 8;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Em ${parcelas}x de R$ ${valorParcela.toFixed(2).replace('.', ',')} sem juros`, 20, y + 20);

    y += 3;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(
        '***Caso queira parcelar em mais vezes, o valor da taxa da maquininha fica por conta do paciente.',
        20, y + 20
    );

    if (desconto > 0) {
        y += 8;
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(
            `Desconto de ${desconto}% no pix ou dinheiro, no total de`,
            20, y + 20
        );
        doc.setFont(undefined, 'bold');
        doc.text(
            `R$ ${totalComDesconto.toFixed(2).replace('.', ',')}.`,
            103, y + 20
        );
    }

    y += 8;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text("Orçamento válido por 30 dias.", 20, y + 20);

    doc.setFontSize(9);
    doc.text(endereco, 50, 275);
    doc.text(telefone, 80, 280);

    doc.save(`orcamento_${paciente}.pdf`);
}

/* =========================
   CARREGAR ORÇAMENTO EXISTENTE
========================= */
async function carregarOrcamentoPorId(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/orcamentos/item/${id}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.erro || 'Erro ao carregar orçamento');
        }

        orcamentoVisualizadoId = data._id || null;

        document.getElementById('paciente').value = data.paciente || '';
        document.getElementById('cpf').value = data.cpf || '';
        document.getElementById('desconto').value = data.desconto ?? 5;
        document.getElementById('parcelas').value = data.parcelas ?? 1;

        procedimentos = normalizarProcedimentos(data.procedimentos || []);
        atualizarTabela();

        orcamentoOriginal = montarSnapshotAtual();
    } catch (error) {
        console.error('Erro ao carregar orçamento:', error);
        alert('Não foi possível carregar o orçamento.');
    }
}

/* =========================
   GERAR ORÇAMENTO
========================= */
async function gerarOrcamento() {
    const paciente = document.getElementById('paciente').value.trim();
    const cpf = document.getElementById('cpf').value.trim();

    if (!paciente) {
        alert("Por favor, preencha o nome do paciente.");
        return;
    }

    if (!cpf) {
        alert("Por favor, preencha o CPF do paciente.");
        return;
    }

    if (procedimentos.length === 0) {
        alert("Adicione pelo menos um procedimento.");
        return;
    }

    const desconto = parseFloat(document.getElementById('desconto').value) || 0;
    const parcelas = Math.max(1, parseInt(document.getElementById('parcelas').value) || 1);

    const total = procedimentos.reduce((acc, item) => acc + item.valor, 0);
    const totalComDesconto = total - (total * (desconto / 100));
    const valorParcela = total / parcelas;

    const atual = montarSnapshotAtual();

    let precisaSalvarNovo = true;

    if (orcamentoOriginal) {
        precisaSalvarNovo = !snapshotsIguais(atual, orcamentoOriginal);
    }

    const btn = document.querySelector('.btn-pdf');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Gerando...';
    }

    try {
        if (precisaSalvarNovo) {
            const payload = {
                cpf: cpf.replace(/\D/g, ''),
                paciente,
                procedimentos: normalizarProcedimentos(procedimentos),
                desconto,
                parcelas,
                total,
                totalComDesconto
            };

            const response = await fetch('http://localhost:3000/api/orcamentos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.erro || 'Erro ao salvar orçamento');
            }

            orcamentoOriginal = montarSnapshotAtual();
            orcamentoVisualizadoId = data.orcamento?._id || null;
        }

        gerarPdfOrcamento({
            paciente,
            cpf,
            desconto,
            parcelas,
            total,
            totalComDesconto,
            valorParcela
        });

        if (precisaSalvarNovo) {
            alert('Novo orçamento salvo e PDF gerado com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao gerar orçamento:', error);
        alert('Não foi possível gerar o orçamento.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Gerar Orçamento';
        }
    }
}

/* =========================
   AUTOCOMPLETE PACIENTES
========================= */
const pacienteInput = document.getElementById('paciente');
const sugestoesDiv = document.getElementById('sugestoes');
const cpfInput = document.getElementById('cpf');

pacienteInput?.addEventListener('input', async () => {
    const termo = pacienteInput.value.trim();

    cpfInput.value = '';

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
                cpfInput.value = p.cpf || '';
                sugestoesDiv.innerHTML = '';
            });

            sugestoesDiv.appendChild(sugestao);
        });
    } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
        sugestoesDiv.innerHTML = '';
    }
});

/* =========================
   EVENTOS
========================= */
document.addEventListener('click', (e) => {
    if (pacienteInput && e.target !== pacienteInput) {
        sugestoesDiv.innerHTML = '';
    }

    const wrap = document.querySelector('.autocomplete-wrap');
    if (wrap && !wrap.contains(e.target)) {
        esconderSugestoes();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('desconto').oninput = atualizarTabela;
    document.getElementById('parcelas').oninput = atualizarTabela;

    const inputProc = document.getElementById('procedimentoInput');

    inputProc.addEventListener('input', (e) => {
        procedimentoSelecionado = null;
        buscarProcedimentos(e.target.value);
    });

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (id) {
        carregarOrcamentoPorId(id);
    }
});