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
                <div class="acoes-paciente">
                    <button
                        type="button"
                        class="btn-acoes btn-ver-paciente"
                    >Ver</button>

                    <button
                        type="button"
                        class="btn-acoes btn-excluir-paciente"
                        title="Excluir paciente"
                        aria-label="Excluir paciente"
                    >X</button>
                </div>
            </td>
            <td>${paciente.status || 'Ativo'}</td>`;

            linha
                .querySelector('.btn-ver-paciente')
                .addEventListener('click', () => {
                    abrirPaciente(cpfLimpo);
                });

            const botaoExcluir = linha.querySelector(
                '.btn-excluir-paciente'
            );

            botaoExcluir.addEventListener('click', () => {
                excluirPaciente(
                    paciente._id,
                    nomeFormatado,
                    linha,
                    botaoExcluir
                );
            });

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

function abrirPaciente(cpf) {
    window.location.href = `paciente.html?cpf=${cpf}`;
}

async function excluirPaciente(id, nome, linha, botao) {
    const confirmou = confirm(
        `Deseja realmente excluir o paciente "${nome}"?\n\n` +
        'Esta ação não poderá ser desfeita.'
    );

    if (!confirmou) return;

    botao.disabled = true;

    try {
        const resposta = await fetch(
            `/api/pacientes/${encodeURIComponent(id)}`,
            {
                method: 'DELETE'
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            throw new Error(
                resultado.mensagem ||
                'Não foi possível excluir o paciente.'
            );
        }

        linha.remove();

        const tabela = document.getElementById('tabelaPacientes');
        const quantidade = tabela.querySelectorAll('tr').length;

        document.getElementById('quantidadeResultados').textContent =
            `Total de registros encontrados: ${quantidade}`;

        if (quantidade === 0) {
            tabela.innerHTML =
                '<tr><td colspan="5">Nenhum paciente encontrado.</td></tr>';
        }

        alert('Paciente excluído com sucesso.');

    } catch (erro) {
        console.error('Erro ao excluir paciente:', erro);

        botao.disabled = false;

        alert(
            erro.message ||
            'Erro ao excluir paciente.'
        );
    }
}