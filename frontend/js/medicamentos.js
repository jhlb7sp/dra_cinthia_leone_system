const CATEGORIAS_MEDICAMENTO = {
    simples: 'Simples',
    antimicrobiano: 'Antimicrobiano',
    controle_especial: 'Controle Especial'
};

let medicamentosCarregados = [];


function textoLimpo(valor) {
    return String(valor || '').trim();
}


function textoNormalizado(valor) {
    return textoLimpo(valor)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}


function normalizarCategoria(valor) {
    const categoria = textoNormalizado(valor)
        .replace(/[\s-]+/g, '_');

    const categoriasAceitas = {
        simples: 'simples',
        receita_simples: 'simples',
        antimicrobiano: 'antimicrobiano',
        antimicrobianos: 'antimicrobiano',
        antibiotico: 'antimicrobiano',
        antibioticos: 'antimicrobiano',
        controle_especial: 'controle_especial',
        controlada: 'controle_especial',
        receita_controlada: 'controle_especial'
    };

    return categoriasAceitas[categoria] || '';
}


async function lerRespostaJson(response) {
    const texto = await response.text();

    try {
        return texto ? JSON.parse(texto) : {};
    } catch (error) {
        return {
            error: 'O servidor retornou uma resposta inválida.'
        };
    }
}


function criarBadgeCategoria(categoria) {
    const badge = document.createElement('span');
    const categoriaValida = normalizarCategoria(categoria);

    badge.className = categoriaValida
        ? `categoria-badge categoria-${categoriaValida}`
        : 'categoria-badge categoria-nao-definida';

    badge.textContent = categoriaValida
        ? CATEGORIAS_MEDICAMENTO[categoriaValida]
        : 'Não definida';

    return badge;
}


function atualizarTabela() {
    const tabela = document.getElementById('tabelaMedicamentos');
    tabela.innerHTML = '';

    medicamentosCarregados.forEach(med => {
        const row = tabela.insertRow();

        const cellNome = row.insertCell(0);
        const cellMg = row.insertCell(1);
        const cellCategoria = row.insertCell(2);
        const cellAcao = row.insertCell(3);

        cellNome.textContent = med.nome || '';
        cellMg.textContent = med.mg || '';
        cellCategoria.appendChild(
            criarBadgeCategoria(med.categoria)
        );

        const btnExcluir = document.createElement('button');
        btnExcluir.type = 'button';
        btnExcluir.className = 'btn-excluir';
        btnExcluir.textContent = 'X';
        btnExcluir.title = 'Excluir medicamento';
        btnExcluir.addEventListener('click', () => {
            excluirMedicamento(med._id, med.nome);
        });

        cellAcao.appendChild(btnExcluir);
    });

    filtrarMedicamentos();
}


function filtrarMedicamentos() {
    const filtro = textoNormalizado(
        document.getElementById('filtro').value
    );

    const linhas = document.querySelectorAll(
        '#tabelaMedicamentos tr'
    );

    linhas.forEach(linha => {
        const nome = textoNormalizado(
            linha.cells[0]?.textContent
        );

        linha.style.display = nome.includes(filtro)
            ? ''
            : 'none';
    });
}


async function adicionarMedicamento() {
    const nomeInput = document.getElementById('nome');
    const mgInput = document.getElementById('mg');
    const categoriaInput = document.getElementById('categoria');

    const nome = textoLimpo(nomeInput.value);
    const mg = textoLimpo(mgInput.value);
    const categoria = normalizarCategoria(
        categoriaInput.value
    );

    if (!nome || !mg || !categoria) {
        alert('Preencha Nome, MG e Categoria.');
        return;
    }

    try {
        const response = await fetch(
            '/api/medicamentos/adicionar',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome,
                    mg,
                    categoria
                })
            }
        );

        const data = await lerRespostaJson(response);

        if (!response.ok) {
            throw new Error(
                data.error || 'Erro ao cadastrar medicamento.'
            );
        }

        alert(data.message);

        nomeInput.value = '';
        mgInput.value = '';
        categoriaInput.value = '';
        nomeInput.focus();

        await carregarMedicamentos();
    } catch (error) {
        console.error('Erro ao cadastrar medicamento:', error);
        alert(error.message);
    }
}


async function carregarMedicamentos() {
    try {
        const response = await fetch(
            '/api/medicamentos/listar'
        );

        const data = await lerRespostaJson(response);

        if (!response.ok) {
            throw new Error(
                data.error || 'Erro ao carregar medicamentos.'
            );
        }

        medicamentosCarregados = Array.isArray(data)
            ? data
            : [];

        atualizarTabela();
    } catch (error) {
        console.error('Erro ao carregar medicamentos:', error);
        alert(error.message);
    }
}


async function excluirMedicamento(id, nome) {
    if (!id) {
        return;
    }

    const confirmado = confirm(
        `Deseja excluir o medicamento "${nome}"?`
    );

    if (!confirmado) {
        return;
    }

    try {
        const response = await fetch(
            `/api/medicamentos/excluir/${id}`,
            {
                method: 'DELETE'
            }
        );

        const data = await lerRespostaJson(response);

        if (!response.ok) {
            throw new Error(
                data.error || 'Erro ao excluir medicamento.'
            );
        }

        alert(data.message);
        await carregarMedicamentos();
    } catch (error) {
        console.error('Erro ao excluir medicamento:', error);
        alert(error.message);
    }
}


function abrirImportacaoMedicamentos() {
    document.getElementById('arquivoImportacao').click();
}


function obterValorColuna(linha, nomes) {
    const chaveEncontrada = Object.keys(linha).find(chave =>
        nomes.includes(textoNormalizado(chave))
    );

    return chaveEncontrada
        ? linha[chaveEncontrada]
        : '';
}


async function importarMedicamentos(event) {
    const inputArquivo = event.target;
    const arquivo = inputArquivo.files[0];

    if (!arquivo) {
        return;
    }

    try {
        if (typeof XLSX === 'undefined') {
            throw new Error(
                'Não foi possível carregar o recurso de planilha.'
            );
        }

        const dadosArquivo = await arquivo.arrayBuffer();
        const workbook = XLSX.read(dadosArquivo, {
            type: 'array'
        });

        const primeiraAba = workbook.SheetNames[0];

        if (!primeiraAba) {
            throw new Error('A planilha não possui nenhuma aba.');
        }

        const linhas = XLSX.utils.sheet_to_json(
            workbook.Sheets[primeiraAba],
            {
                defval: '',
                raw: false
            }
        );

        if (linhas.length === 0) {
            throw new Error('A planilha está vazia.');
        }

        const medicamentos = [];
        const linhasInvalidas = [];

        linhas.forEach((linha, index) => {
            const id = textoLimpo(
                obterValorColuna(linha, ['id', '_id'])
            );

            const nome = textoLimpo(
                obterValorColuna(linha, ['nome'])
            );

            const mg = textoLimpo(
                obterValorColuna(linha, [
                    'mg',
                    'dosagem'
                ])
            );

            const categoria = normalizarCategoria(
                obterValorColuna(linha, ['categoria'])
            );

            if (!nome || !mg || !categoria) {
                linhasInvalidas.push(index + 2);
                return;
            }

            medicamentos.push({
                _id: id,
                nome,
                mg,
                categoria
            });
        });

        if (linhasInvalidas.length > 0) {
            throw new Error(
                'Revise Nome, MG e Categoria nas linhas: ' +
                linhasInvalidas.join(', ')
            );
        }

        const confirmado = confirm(
            `Importar ${medicamentos.length} medicamento(s)? ` +
            'Os IDs existentes serão atualizados e os novos serão adicionados.'
        );

        if (!confirmado) {
            return;
        }

        const response = await fetch(
            '/api/medicamentos/importar',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ medicamentos })
            }
        );

        const data = await lerRespostaJson(response);

        if (!response.ok) {
            throw new Error(
                data.error || 'Erro ao importar medicamentos.'
            );
        }

        alert(data.message);
        await carregarMedicamentos();
    } catch (error) {
        console.error('Erro ao importar medicamentos:', error);
        alert(error.message);
    } finally {
        inputArquivo.value = '';
    }
}


function exportarMedicamentos() {
    if (medicamentosCarregados.length === 0) {
        alert('Não há medicamentos para exportar.');
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('Não foi possível carregar o recurso de planilha.');
        return;
    }

    const dadosExportacao = medicamentosCarregados.map(med => {
        const categoria = normalizarCategoria(med.categoria);

        return {
            ID: med._id || '',
            Nome: med.nome || '',
            MG: med.mg || '',
            Categoria: categoria
                ? CATEGORIAS_MEDICAMENTO[categoria]
                : ''
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(
        dadosExportacao
    );

    worksheet['!cols'] = [
        { wch: 26 },
        { wch: 38 },
        { wch: 18 },
        { wch: 24 }
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Medicamentos'
    );

    XLSX.writeFile(
        workbook,
        'Lista_Medicamentos_Dra_Cinthia.xlsx'
    );
}


document
    .getElementById('arquivoImportacao')
    .addEventListener(
        'change',
        importarMedicamentos
    );


window.addEventListener(
    'load',
    carregarMedicamentos
);
