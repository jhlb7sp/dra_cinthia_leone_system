// ============================
// MÁSCARA CPF
// ============================
document.getElementById('cpf')?.addEventListener('input', function (e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 11) value = value.slice(0, 11);
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  e.target.value = value;
});

// ============================
// VALIDAR CPF
// ============================
function validarCPF(cpf) {
  cpf = (cpf || '').replace(/\D/g, '');
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

// ============================
// MEDICAMENTOS (única fonte da verdade)
// ============================
window.medicamentos = []; // [{ texto: "...", obs: "..." }]

// ============================
// ADD MEDICAMENTO (com Observação opcional)
// ============================
function addMedicamento() {
  const nome = document.getElementById('medicamento')?.value.trim() || '';
  const tomardar = document.getElementById('tomardar')?.value || 'Tomar';
  const quantidade = document.getElementById('quantidade')?.value || '';
  const unidade = document.getElementById('unidade')?.value || '';
  const intervalo = document.getElementById('intervalo')?.value || 'vazio';
  const horas = document.getElementById('horas')?.value || 'vazio';
  const dias = document.getElementById('dias')?.value || '';

  // (se você ainda usa esse select obs antigo, pode manter)
  const obsSelect = document.getElementById('obs') ? document.getElementById('obs').value.trim() : '';

  // NOVO: textarea observacao
  const observacao = document.getElementById('observacao') ? document.getElementById('observacao').value.trim() : '';

  if (!nome || !quantidade || !unidade) {
    alert("Preencha ao menos o nome, quantidade e unidade.");
    return;
  }

  // Frase base
  let texto = `${nome} — ${tomardar} ${quantidade} ${unidade}`;

  // Horas / Intervalo (mantendo sua lógica + melhor frase)
  if (horas && horas !== 'vazio') {
    if (String(horas) === '24') {
      texto += ` via oral - 1x ao dia`;
    } else {
      // se intervalo estiver vazio, ainda assim mostra "a cada X horas"
      texto += ` a cada ${horas} horas`;
    }
  } else if (intervalo && intervalo !== 'vazio') {
    texto += ` a cada ${intervalo} horas`;
  }

  // Dias
  if (dias) {
    texto += `, durante ${dias} dias.`;
  } else {
    texto += `.`;
  }

  // Obs final (prioriza textarea; se vazio usa select antigo)
  const obsFinal = observacao || obsSelect || '';

  window.medicamentos.push({
    texto,
    obs: obsFinal
  });

  atualizarLista();

  // Limpar campos
  document.getElementById('medicamento').value = '';
  document.getElementById('quantidade').value = '';
  document.getElementById('unidade').value = 'comprimido(s)';
  document.getElementById('intervalo').value = 'vazio';
  document.getElementById('horas').value = 'vazio';
  document.getElementById('dias').value = '';
  if (document.getElementById('obs')) document.getElementById('obs').value = '';
  if (document.getElementById('observacao')) document.getElementById('observacao').value = '';
}

function removerMedicamento(index) {
  window.medicamentos.splice(index, 1);
  atualizarLista();
}

function atualizarLista() {
  const lista = document.getElementById('listaMedicamentos');
  if (!lista) return;

  lista.innerHTML = window.medicamentos.map((m, i) => `
    <div style="padding:8px 0; border-bottom:1px solid #eee;">
      <div><strong>${i + 1}.</strong> ${m.texto}</div>
      ${m.obs ? `<div style="margin-left:18px; font-size:12px; color:#555;"><em>Obs:</em> ${escapeHtml(m.obs)}</div>` : ""}
      <div style="margin-left:18px; margin-top:6px;">
        <button onclick="removerMedicamento(${i})">Remover</button>
      </div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  return (str || '')
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ============================
// LOGIN CHECK
// ============================
if (sessionStorage.getItem('logado') !== 'sim') {
  window.location.href = 'login.html';
}

function sair() {
  sessionStorage.removeItem('logado');
  window.top.location.href = 'index.html';
}

// expor funções pro HTML
window.addMedicamento = addMedicamento;
window.removerMedicamento = removerMedicamento;
window.validarCPF = validarCPF;
window.sair = sair;
