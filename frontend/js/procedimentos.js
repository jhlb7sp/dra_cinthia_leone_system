// frontend/js/procedimentos.js

function filtrarProcedimentos() {
  const filtro = document.getElementById('filtro').value.toLowerCase();
  const linhas = document.querySelectorAll('#tabelaProcedimentos tr');

  linhas.forEach(linha => {
    const nome = linha.cells[0].innerText.toLowerCase();
    linha.style.display = nome.includes(filtro) ? '' : 'none';
  });
}

function adicionarProcedimentos() {
  const nome = document.getElementById('nome').value.trim();
  const tipo = document.getElementById('tipo').value.trim();
  const dente = document.getElementById('dente').value.trim();
  const valor = document.getElementById('valor').value.trim();

  if (!nome || !valor) {
    alert('Preencha os campos obrigatórios!');
    return;
  }

  fetch('/api/procedimentos/adicionar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, tipo, dente, valor })
  })
    .then(r => r.json())
    .then(data => {
      alert(data.message || 'Procedimento adicionado!');
      document.getElementById('nome').value = '';
      document.getElementById('tipo').value = '';
      document.getElementById('dente').value = '';
      document.getElementById('valor').value = '';
      carregarProcedimentos();
    })
    .catch(console.error);
}

function carregarProcedimentos() {
  fetch('/api/procedimentos/listar')
    .then(r => r.json())
    .then(lista => {
      const tabela = document.getElementById('tabelaProcedimentos');
      tabela.innerHTML = '';

      lista.forEach(proc => {
        const row = tabela.insertRow();
        row.insertCell(0).innerText = proc.nome || '';
        row.insertCell(1).innerText = proc.tipo || '';
        row.insertCell(2).innerText = proc.dente || '';
        row.insertCell(3).innerText = proc.valor || '';
        row.insertCell(4).innerHTML =
          `<span class="btn-excluir" onclick="excluirProcedimentos('${proc._id}')">X</span>`;
      });

      filtrarProcedimentos();
    })
    .catch(console.error);
}

function excluirProcedimentos(id) {
  fetch(`/api/procedimentos/excluir/${id}`, { method: 'DELETE' })
    .then(r => r.json())
    .then(data => {
      alert(data.message || 'Procedimento excluído!');
      carregarProcedimentos();
    })
    .catch(console.error);
}

window.onload = carregarProcedimentos;
