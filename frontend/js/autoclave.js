// Alternância entre as abas
function openTab(evt, tabName) {
  const tabs = document.querySelectorAll(".tabcontent");
  const tablinks = document.querySelectorAll(".tablink");

  tabs.forEach(tab => tab.classList.remove("active"));
  tablinks.forEach(btn => btn.classList.remove("active"));

  document.getElementById(tabName).classList.add("active");
  evt.currentTarget.classList.add("active");
}

// Adicionar Controle Físico
function adicionarControleFisico() {
  const registro = {
    data: document.getElementById('dataFisico').value,
    horario: document.getElementById('horarioFisico').value,
    operador: document.getElementById('operadorFisico').value,
    temperatura: document.getElementById('temperaturaFisico').value,
    pressao: document.getElementById('pressaoFisico').value,
    tempo: document.getElementById('tempoFisico').value,
    fitaIndicadora: document.getElementById('fitaIndicadoraFisico').value
  };

  fetch('http://localhost:3000/api/controleFisico', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registro)
  })
  .then(res => res.ok ? carregarControlesFisicos() : alert('Erro ao salvar controle físico.'))
  .catch(err => console.error(err));
}

// Adicionar Controle Biológico
function adicionarControleBiologico() {
  const registro = {
    data: document.getElementById('dataBiologico').value,
    lote: document.getElementById('loteBiologico').value,
    resultado: document.getElementById('resultadoBiologico').value,
    dataLeitura: document.getElementById('dataLeituraBiologico').value,
    responsavel: document.getElementById('responsavelLeituraBiologico').value,
    observacoes: document.getElementById('observacoesBiologico').value
  };

  fetch('http://localhost:3000/api/controleBiologico', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registro)
  })
  .then(res => res.ok ? carregarControlesBiologicos() : alert('Erro ao salvar controle biológico.'))
  .catch(err => console.error(err));
}

// Carregar Controle Físico
function carregarControlesFisicos() {
  fetch('http://localhost:3000/api/controleFisico')
    .then(res => res.json())
    .then(data => {
      const tabela = document.querySelector('#tabelaFisico tbody');
      tabela.innerHTML = '';
      data.forEach(registro => {
        const linha = `
          <tr>
            <td>${registro.data}</td>
            <td>${registro.horario}</td>
            <td>${registro.operador}</td>
            <td>${registro.temperatura}</td>
            <td>${registro.pressao}</td>
            <td>${registro.tempo}</td>
            <td>${registro.fitaIndicadora}</td>
            <td><button class="btnExcluir" onclick="excluirControleFisico('${registro._id}')">X</button></td>
          </tr>
        `;
        tabela.innerHTML += linha;
      });
    });
}

// Carregar Controle Biológico
function carregarControlesBiologicos() {
  fetch('http://localhost:3000/api/controleBiologico')
    .then(res => res.json())
    .then(data => {
      const tabela = document.querySelector('#tabelaBiologico tbody');
      tabela.innerHTML = '';
      data.forEach(registro => {
        const linha = `
          <tr>
            <td>${registro.data}</td>
            <td>${registro.lote}</td>
            <td>${registro.resultado}</td>
            <td>${registro.dataLeitura}</td>
            <td>${registro.responsavel}</td>
            <td>${registro.observacoes}</td>
            <td><button class="btnExcluir" onclick="excluirControleBiologico('${registro._id}')">X</button></td>
          </tr>
        `;
        tabela.innerHTML += linha;
      });
    });
}
//FILTRAR CONTROLE FISICO
function filtrarControleFisico() {
  const inicio = document.getElementById('dataInicioFisico').value;
  const fim = document.getElementById('dataFimFisico').value;

  fetch(`http://localhost:3000/api/controleFisico?inicio=${inicio}&fim=${fim}`)
    .then(res => res.json())
    .then(data => {
      const tabela = document.querySelector('#tabelaFisico tbody');
      tabela.innerHTML = '';
      data.forEach(registro => {
        const linha = `
          <tr>
            <td>${registro.data}</td>
            <td>${registro.horario}</td>
            <td>${registro.operador}</td>
            <td>${registro.temperatura}</td>
            <td>${registro.pressao}</td>
            <td>${registro.tempo}</td>
            <td>${registro.fitaIndicadora}</td>
          </tr>
        `;
        tabela.innerHTML += linha;
      });
    });
}
//FILTRAR CONTROLE BIOLOGICO
function filtrarControleBiologico() {
  const inicio = document.getElementById('dataInicioBiologico').value;
  const fim = document.getElementById('dataFimBiologico').value;

  fetch(`http://localhost:3000/api/controleBiologico?inicio=${inicio}&fim=${fim}`)
    .then(res => res.json())
    .then(data => {
      const tabela = document.querySelector('#tabelaBiologico tbody');
      tabela.innerHTML = '';
      data.forEach(registro => {
        const linha = `
          <tr>
            <td>${registro.data}</td>
            <td>${registro.lote}</td>
            <td>${registro.resultado}</td>
            <td>${registro.dataLeitura}</td>
            <td>${registro.responsavel}</td>
            <td>${registro.observacoes}</td>
          </tr>
        `;
        tabela.innerHTML += linha;
      });
    });
}
//EXPORTAR CONTROLE FISICO
function exportarControleFisicoPDF() {
  const doc = new jspdf.jsPDF();
  doc.text("Relatório de Controle Físico - Autoclave", 10, 10);
  doc.autoTable({ html: '#tabelaFisico' });
  doc.save("controle_fisico.pdf");
}

//EXCLUIR LINHA CONTROLE FISICO
function excluirControleFisico(id) {
  if (confirm("Tem certeza que deseja excluir este registro?")) {
    fetch(`http://localhost:3000/api/controleFisico/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) carregarControlesFisicos();
        else alert('Erro ao excluir registro.');
      });
  }
}

//EXPORTAR CONTROLE BIOLOGICO
function exportarControleBiologicoPDF() {
  const doc = new jspdf.jsPDF();
  doc.text("Relatório de Controle Biológico - Autoclave", 10, 10);
  doc.autoTable({ html: '#tabelaBiologico' });
  doc.save("controle_biologico.pdf");
}
//EXCLUIR LINHA CONTROLE BIOLOGICO
function excluirControleBiologico(id) {
  if (confirm("Tem certeza que deseja excluir este registro?")) {
    fetch(`http://localhost:3000/api/controleBiologico/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) carregarControlesBiologicos();
        else alert('Erro ao excluir registro.');
      });
  }
}


window.onload = () => {
  carregarControlesFisicos();
  carregarControlesBiologicos();
};
