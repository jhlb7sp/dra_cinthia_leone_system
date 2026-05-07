document.getElementById('consultar').addEventListener('click', async () => {
    const nome = document.getElementById('nome').value.trim();
    const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
    const filtroStatus = document.getElementById("filtroStatus").value;

    // CPF com pontuação
    const cpfFormatado = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

    let url = '/pacientes?';
    if (nome) url += `nome=${encodeURIComponent(nome)}&`;
    if (cpf) url += `cpf=${cpf}&`;
    if (filtroStatus) url += `status=${filtroStatus}&`;

    try {
        const resposta = await fetch(url);
        const pacientes = await resposta.json();

        const tabela = document.getElementById('tabelaPacientes');
        tabela.innerHTML = '';

        if (pacientes.length === 0) {
            tabela.innerHTML = '<tr><td colspan="5">Nenhum paciente encontrado.</td></tr>';
            return;
        }
        pacientes.forEach(paciente => {
            function formatarNomeCompleto(nome) {
                return nome.split(' ').map(palavra => {
                    if (palavra.length === 0) return '';
                    return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
                }).join(' ');
            }
            // Formatar nome (primeira letra maiúscula)
            const nomeFormatado = formatarNomeCompleto(paciente.nome);

            // CPF com pontuação
            const cpfLimpo = paciente.cpf.replace(/\D/g, '');
            const cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

            // Data de nascimento dd/mm/aaaa
            let dataFormatada = '';
            if (paciente.dataNascimento) {
                const data = new Date(paciente.dataNascimento);
                const dia = String(data.getDate()).padStart(2, '0');
                const mes = String(data.getMonth() + 1).padStart(2, '0');
                const ano = data.getFullYear();
                dataFormatada = `${dia}/${mes}/${ano}`;
            }

            const linha = document.createElement('tr');
            linha.innerHTML = `
            <td>${nomeFormatado}</td>
            <td>${cpfFormatado}</td>
            <td>${dataFormatada}</td>
            <td>
                <button class="btn-acoes" onclick="paciente('${cpfLimpo}')">Ver</button>
            </td>
            <td>${paciente.status || 'Ativo'}</td>`;
            tabela.appendChild(linha);
        });
        document.getElementById('quantidadeResultados').textContent = `Total de registros encontrados: ${pacientes.length}`;
        if (pacientes.length === 0) {
            tabela.innerHTML = '<tr><td colspan="5">Nenhum paciente encontrado.</td></tr>';
            document.getElementById('quantidadeResultados').textContent = 'Total de registros encontrados: 0';
            return;
        }

    } catch (erro) {
        console.error('Erro ao consultar pacientes:', erro);
    }
});

document.getElementById('limpar').addEventListener('click', () => {
    document.getElementById('nome').value = '';
    document.getElementById('cpf').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('tabelaPacientes').innerHTML = '';
    document.getElementById('quantidadeResultados').textContent = '';
});

function paciente(cpf) {
  window.location.href = `paciente.html?cpf=${cpf}`;
}
