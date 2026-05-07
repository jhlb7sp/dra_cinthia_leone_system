document.addEventListener('DOMContentLoaded', () => {
  const btnNovo = document.getElementById('btnNovo');
  const formMaterial = document.getElementById('formMaterial');
  const tabelaMateriais = document.getElementById('tabelaMateriais').querySelector('tbody');

  // Função que adiciona linha na tabela
  function adicionarLinhaTabela(material) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', material._id);
    atualizarCor(tr, material.quantidade);

    tr.innerHTML = `
      <td>${material.nome}</td>
      <td contenteditable="true">${material.categoria}</td>
      <td contenteditable="true">${material.unidade}</td>
      <td contenteditable="true" class="qtd">${material.quantidade}</td>
      <td contenteditable="true" class="valor">${material.valor.toFixed(2)}</td>
      <td contenteditable="true" class="porPaciente">${material.porPaciente}</td>
      <td class="acoes">
        <button class="btnAdd">+1</button>
        <button class="btnSub">-1</button>
        <button class="btnExcluir">❌</button>
      </td>
    `;

    tabelaMateriais.appendChild(tr);
  }

  // Função para carregar materiais do banco
  async function carregarMateriais() {
    try {
      const response = await fetch('http://localhost:3000/api/materiais');
      const materiais = await response.json();
      materiais.forEach(adicionarLinhaTabela);
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
    }
  }

  // Mostrar/esconder formulário
  btnNovo.addEventListener('click', () => {
    formMaterial.style.display = formMaterial.style.display === 'none' ? 'block' : 'none';
  });

  // Submeter novo material
  formMaterial.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    if (!nome) {
      alert('O campo Nome é obrigatório!');
      return;
    }

    const material = {
      nome,
      categoria: document.getElementById('categoria').value,
      unidade: document.getElementById('unidade').value,
      quantidade: parseInt(document.getElementById('quantidade').value) || 0,
      valor: parseFloat(document.getElementById('valor').value) || 0,
      porPaciente: parseInt(document.getElementById('porPaciente').value) || 0
    };

    try {
      const response = await fetch('http://localhost:3000/api/materiais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material)
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      const saved = await response.json();
      adicionarLinhaTabela(saved);

      formMaterial.reset();
      formMaterial.style.display = 'none';
    } catch (error) {
      alert('Erro ao salvar material.');
      console.error(error);
    }
  });

  // Incremento, decremento e excluir
  tabelaMateriais.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btnAdd') || e.target.classList.contains('btnSub')) {
      const tr = e.target.closest('tr');
      const id = tr.getAttribute('data-id');
      const qtdCell = tr.querySelector('.qtd');
      let qtd = parseInt(qtdCell.textContent);

      if (e.target.classList.contains('btnAdd')) qtd++;
      if (e.target.classList.contains('btnSub')) qtd = Math.max(0, qtd - 1);

      qtdCell.textContent = qtd;
      atualizarCor(tr, qtd);

      await fetch(`http://localhost:3000/api/materiais/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantidade: qtd })
      });
    }

    if (e.target.classList.contains('btnExcluir')) {
      const tr = e.target.closest('tr');
      const id = tr.getAttribute('data-id');

      await fetch(`http://localhost:3000/api/materiais/${id}`, {
        method: 'DELETE'
      });

      tr.remove();
    }
  });

  // Atualizar cor da linha conforme quantidade
  function atualizarCor(tr, qtd) {
    tr.classList.remove('zero', 'baixo-estoque');
    if (qtd === 0) tr.classList.add('zero');
    else if (qtd > 0 && qtd <= 3) tr.classList.add('baixo-estoque');
  }

  // Carregar materiais ao abrir a página
  carregarMateriais();
});
