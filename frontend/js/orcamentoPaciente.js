const params = new URLSearchParams(window.location.search);
const cpf = params.get('cpf');

const cpfPacienteEl = document.getElementById('cpfPaciente');
const bodyOrcamentos = document.getElementById('bodyOrcamentos');

cpfPacienteEl.textContent = `CPF: ${cpf || 'não informado'}`;

function formatarData(data) {
  if (!data) return '-';

  const dt = new Date(data);
  if (isNaN(dt.getTime())) return '-';

  return dt.toLocaleDateString('pt-BR');
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

async function carregarOrcamentos() {
  if (!cpf) {
    bodyOrcamentos.innerHTML = `
      <tr>
        <td colspan="4" class="sem-registros">CPF não informado.</td>
      </tr>
    `;
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/orcamentos/${cpf}`);
    const orcamentos = await response.json();

    if (!Array.isArray(orcamentos) || orcamentos.length === 0) {
      bodyOrcamentos.innerHTML = `
        <tr>
          <td colspan="4" class="sem-registros">Nenhum orçamento encontrado para este paciente.</td>
        </tr>
      `;
      return;
    }

    bodyOrcamentos.innerHTML = '';

    orcamentos.forEach(orcamento => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${formatarData(orcamento.data)}</td>
        <td>${formatarMoeda(orcamento.total)}</td>
        <td>${orcamento.parcelas || 1}x</td>
        <td>
          <div class="acoes">
            <button class="btn-acao btn-ver" onclick="verOrcamento('${orcamento._id}')">Ver</button>
            <button class="btn-acao btn-excluir" onclick="excluirOrcamento('${orcamento._id}')">Excluir</button>
          </div>
        </td>
      `;

      bodyOrcamentos.appendChild(tr);
    });
  } catch (error) {
    console.error('Erro ao carregar orçamentos:', error);
    bodyOrcamentos.innerHTML = `
      <tr>
        <td colspan="4" class="sem-registros">Erro ao carregar orçamentos.</td>
      </tr>
    `;
  }
}

function verOrcamento(id) {
  window.location.href = `orcamento.html?id=${id}`;
}

function editarOrcamento(id) {
  alert(`Abrir edição do orçamento: ${id}`);
}

async function excluirOrcamento(id) {
  const confirmar = confirm('Deseja realmente excluir este orçamento?');
  if (!confirmar) return;

  try {
    const response = await fetch(`http://localhost:3000/api/orcamentos/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Erro ao excluir orçamento');
    }

    carregarOrcamentos();
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    alert('Não foi possível excluir o orçamento.');
  }
}

carregarOrcamentos();