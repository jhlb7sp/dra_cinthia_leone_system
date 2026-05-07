
let medicamentos = [];


function excluirMedicamento(index) {
    medicamentos.splice(index, 1);
    atualizarTabela();
}

function atualizarTabela() {
    const tabela = document.getElementById('tabelaMedicamentos');
    tabela.innerHTML = '';

    medicamentos.forEach((med, index) => {
        const row = tabela.insertRow();

        const cellNome = row.insertCell(0);
        const cellMg = row.insertCell(1);
        const cellAcao = row.insertCell(2);

        cellNome.innerText = med.nome;
        cellMg.innerText = med.mg;
        cellAcao.innerHTML = `<span class="btn-excluir" onclick="excluirMedicamento(${index})">X</span>`;
    });

    filtrarMedicamentos();
}

function filtrarMedicamentos() {
    const filtro = document.getElementById('filtro').value.toLowerCase();
    const linhas = document.querySelectorAll('#tabelaMedicamentos tr');

    linhas.forEach(linha => {
        const nome = linha.cells[0].innerText.toLowerCase();
        linha.style.display = nome.includes(filtro) ? '' : 'none';
    });
}

function adicionarMedicamento() {
    const nome = document.getElementById('nome').value.trim();
    const mg = document.getElementById('mg').value.trim();

    if (!nome || !mg) {
        alert('Preencha os campos!');
        return;
    }

    fetch('/api/medicamentos/adicionar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, mg })
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            carregarMedicamentos();
            document.getElementById('nome').value = '';
            document.getElementById('mg').value = '';
        })
        .catch(err => console.error(err));
}

function carregarMedicamentos() {
    fetch('/api/medicamentos/listar')
        .then(res => res.json())
        .then(medicamentos => {
            const tabela = document.getElementById('tabelaMedicamentos');
            tabela.innerHTML = '';
            medicamentos.forEach(med => {
                const row = tabela.insertRow();
                row.insertCell(0).innerText = med.nome;
                row.insertCell(1).innerText = med.mg;
                row.insertCell(2).innerHTML = `<span class="btn-excluir" onclick="excluirMedicamento('${med._id}')">X</span>`;
            });
            filtrarMedicamentos();
        });
}

function excluirMedicamento(id) {
    fetch(`/api/medicamentos/excluir/${id}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            carregarMedicamentos();
        })
        .catch(err => console.error(err));
}

window.onload = carregarMedicamentos;

