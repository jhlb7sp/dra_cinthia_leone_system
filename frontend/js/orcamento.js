// frontend/js/orcamento.js

let procedimentos = [];
let debounceTimer = null;

let procedimentoSelecionado = null;
let indiceObservacao = null;

// Usado quando o valor fica abaixo da tabela família
let acaoValorPendente = null;

// Manutenção vinculada ao aparelho
let manutencaoSelecionada = null;


const MAPA_MANUTENCOES = {
    'instalacao convencional': 'Manut. convencional',
    'instalacao auto ligado': 'Manut. Auto ligado',
    'aparelho twin block': 'Manut. Twin Block',
    'aparelho hirax': 'Manut. Hirax',
    'aparelho mcnamara': 'Manut. Mcnamara'
};


/* =========================================================
   HELPERS DE APARELHO / MANUTENÇÃO
========================================================= */

function normalizarNome(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}


function obterManutencaoDaInstalacao(nomeProcedimento) {
    return MAPA_MANUTENCOES[
        normalizarNome(nomeProcedimento)
    ] || null;
}


function ehInstalacaoAparelho(nomeProcedimento) {
    return !!obterManutencaoDaInstalacao(
        nomeProcedimento
    );
}


/* =========================================================
   HELPERS GERAIS
========================================================= */

function debounce(fn, delay = 300) {
    return (...args) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(
            () => fn(...args),
            delay
        );
    };
}


function converterNumero(valor) {
    if (
        valor === undefined ||
        valor === null ||
        valor === ''
    ) {
        return 0;
    }

    if (typeof valor === 'number') {
        return isNaN(valor) ? 0 : valor;
    }

    let texto = String(valor)
        .replace('R$', '')
        .trim();

    if (texto.includes(',')) {
        texto = texto
            .replace(/\./g, '')
            .replace(',', '.');
    }

    const numero = Number(texto);

    return isNaN(numero) ? 0 : numero;
}


function formatarMoeda(valor) {
    return converterNumero(valor).toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    );
}


/* =========================================================
   REGRA DE COR

   Principal 250
   Desconto  200
   Família   150

   250 -> verde
   249 -> amarelo
   200 -> amarelo
   199 -> vermelho
   150 -> vermelho
   149 -> vermelho + alerta
========================================================= */

function obterStatusValor(
    valor,
    valorPrincipal,
    valorDesconto
) {
    valor =
        converterNumero(valor);

    valorPrincipal =
        converterNumero(valorPrincipal);

    valorDesconto =
        converterNumero(valorDesconto);


    if (valor >= valorPrincipal) {
        return 'verde';
    }


    if (valor >= valorDesconto) {
        return 'amarelo';
    }


    return 'vermelho';
}


function obterTituloStatus(status) {
    if (status === 'verde') {
        return 'Valor principal';
    }


    if (status === 'amarelo') {
        return 'Valor com desconto';
    }


    return 'Valor abaixo da tabela de desconto';
}


/* =========================================================
   INDICADOR DO NOVO PROCEDIMENTO
========================================================= */

function atualizarIndicadorNovoProcedimento() {

    const indicador =
        document.getElementById(
            'statusValor'
        );


    if (!indicador) {
        return;
    }


    if (!procedimentoSelecionado) {

        indicador.className =
            'status-valor verde';

        indicador.title =
            'Valor principal';

        return;
    }


    const valor =
        converterNumero(
            document.getElementById(
                'valorProc'
            ).value
        );


    const principal =
        converterNumero(
            procedimentoSelecionado
                .precos?.padrao ??
            procedimentoSelecionado
                .valor
        );


    const desconto =
        converterNumero(
            procedimentoSelecionado
                .precos?.especial1
        );


    const status =
        obterStatusValor(
            valor,
            principal,
            desconto
        );


    indicador.className =
        `status-valor ${status}`;


    indicador.title =
        obterTituloStatus(
            status
        );
}


/* =========================================================
   AUTOCOMPLETE PROCEDIMENTOS
========================================================= */

function mostrarSugestoes(lista) {

    const box =
        document.getElementById(
            'procedimentoSugestoes'
        );


    box.innerHTML = '';


    if (!lista.length) {

        box.style.display =
            'none';

        return;
    }


    lista.forEach(proc => {

        const div =
            document.createElement(
                'div'
            );


        div.className =
            'autocomplete-item';


        let descricao =
            proc.nome || '';


        if (proc.tipo) {
            descricao +=
                ` (${proc.tipo})`;
        }


        if (proc.dente) {
            descricao +=
                ` - Dente: ${proc.dente}`;
        }


        div.textContent =
            descricao;


        div.onclick =
            () =>
                selecionarProcedimento(
                    proc
                );


        box.appendChild(
            div
        );
    });


    box.style.display =
        'block';
}


function esconderSugestoes() {

    const box =
        document.getElementById(
            'procedimentoSugestoes'
        );


    if (box) {
        box.style.display =
            'none';
    }
}


function selecionarProcedimento(proc) {

    procedimentoSelecionado =
        proc;


    document.getElementById(
        'procedimentoInput'
    ).value =
        proc.nome || '';


    document.getElementById(
        'tipo'
    ).value =
        proc.tipo || '';


    document.getElementById(
        'dente'
    ).value =
        proc.dente || '';


    const valorPrincipal =
        converterNumero(
            proc.precos?.padrao ??
            proc.valor
        );


    document.getElementById(
        'valorProc'
    ).value =
        valorPrincipal.toFixed(2);


    atualizarIndicadorNovoProcedimento();

    esconderSugestoes();
}


const buscarProcedimentos =
    debounce(
        async texto => {

            const q =
                (texto || '').trim();


            if (q.length < 2) {

                mostrarSugestoes([]);

                return;
            }


            try {

                const res =
                    await fetch(
                        `/api/procedimentos/buscar?nome=${encodeURIComponent(q)}`
                    );


                const data =
                    await res.json();


                mostrarSugestoes(
                    Array.isArray(data)
                        ? data
                        : []
                );

            } catch (e) {

                console.error(
                    'Erro ao buscar procedimentos:',
                    e
                );


                mostrarSugestoes([]);
            }

        },
        250
    );


/* =========================================================
   CRIAR ITEM
========================================================= */

function criarItemProcedimento() {

    const nome =
        document.getElementById(
            'procedimentoInput'
        ).value.trim();


    const tipo =
        document.getElementById(
            'tipo'
        ).value.trim();


    const dente =
        document.getElementById(
            'dente'
        ).value.trim();


    const valorCobrado =
        converterNumero(
            document.getElementById(
                'valorProc'
            ).value
        );


    const valorPrincipal =
        converterNumero(
            procedimentoSelecionado
                ?.precos?.padrao ??
            procedimentoSelecionado
                ?.valor ??
            valorCobrado
        );


    const valorDesconto =
        converterNumero(
            procedimentoSelecionado
                ?.precos?.especial1 ??
            valorPrincipal
        );


    const valorFamilia =
        converterNumero(
            procedimentoSelecionado
                ?.precos?.especial2 ??
            valorDesconto
        );


    return {

        procedimentoId:
            procedimentoSelecionado
                ?._id ||
            null,

        nomeProcedimento:
            nome,

        tipo,

        dente,

        quantidade:
            1,

        valorPrincipal,

        valorDesconto,

        valorFamilia,

        valorCobrado,

        valorTotal:
            valorCobrado,

        observacao:
            '',

        manutencao:
            null
    };
}


/* =========================================================
   LIMPAR PROCEDIMENTO
========================================================= */

function limparProcedimento() {

    document.getElementById(
        'procedimentoInput'
    ).value = '';


    document.getElementById(
        'tipo'
    ).value = '';


    document.getElementById(
        'dente'
    ).value = '';


    document.getElementById(
        'valorProc'
    ).value = '';


    procedimentoSelecionado =
        null;


    const indicador =
        document.getElementById(
            'statusValor'
        );


    if (indicador) {

        indicador.className =
            'status-valor verde';


        indicador.title =
            'Valor principal';
    }
}


/* =========================================================
   ADICIONAR PROCEDIMENTO
========================================================= */

function addProcedimento() {

    const nome =
        document.getElementById(
            'procedimentoInput'
        ).value.trim();


    if (!nome) {

        alert(
            'Informe o procedimento.'
        );

        return;
    }


    const item =
        criarItemProcedimento();


    if (
        item.valorFamilia > 0 &&
        item.valorCobrado <
        item.valorFamilia
    ) {

        acaoValorPendente = {
            tipo:
                'novo',

            item
        };


        abrirModalValorFamilia(
            item.valorCobrado,
            item.valorFamilia
        );


        return;
    }


    procedimentos.push(
        item
    );


    const novoIndex =
        procedimentos.length - 1;


    limparProcedimento();

    atualizarTabela();


    /*
       Instalação de aparelho:
       abre automaticamente a tela
       de manutenção/observação.
    */

    if (
        ehInstalacaoAparelho(
            item.nomeProcedimento
        )
    ) {

        abrirModalObservacao(
            novoIndex
        );
    }
}


/* =========================================================
   ATUALIZAR TABELA
========================================================= */

function atualizarTabela() {

    const tabela =
        document.getElementById(
            'tabelaProcedimentos'
        );


    const tbody =
        tabela.querySelector(
            'tbody'
        );


    tbody.innerHTML =
        '';


    let total =
        0;


    procedimentos.forEach(
        (item, index) => {

            const row =
                tbody.insertRow();


            /* PROCEDIMENTO */

            row.insertCell(
                0
            ).innerText =
                item.nomeProcedimento;


            /* TIPO */

            row.insertCell(
                1
            ).innerText =
                item.tipo || '';


            /* DENTE */

            row.insertCell(
                2
            ).innerText =
                item.dente || '';


            /* =================================
               VALOR
            ================================= */

            const valorCell =
                row.insertCell(
                    3
                );


            const valorContainer =
                document.createElement(
                    'div'
                );


            valorContainer.className =
                'valor-item';


            const inputValor =
                document.createElement(
                    'input'
                );


            inputValor.type =
                'number';


            inputValor.min =
                '0';


            inputValor.step =
                '0.01';


            inputValor.value =
                converterNumero(
                    item.valorCobrado
                ).toFixed(2);


            const indicador =
                document.createElement(
                    'span'
                );


            const status =
                obterStatusValor(
                    item.valorCobrado,
                    item.valorPrincipal,
                    item.valorDesconto
                );


            indicador.className =
                `status-valor ${status}`;


            indicador.title =
                obterTituloStatus(
                    status
                );


            inputValor.onfocus =
                () => {

                    inputValor.select();
                };


            inputValor.onchange =
                () => {

                    const novoValor =
                        converterNumero(
                            inputValor.value
                        );


                    if (
                        item.valorFamilia > 0 &&
                        novoValor <
                        item.valorFamilia
                    ) {

                        acaoValorPendente = {

                            tipo:
                                'editar',

                            index,

                            novoValor
                        };


                        abrirModalValorFamilia(
                            novoValor,
                            item.valorFamilia
                        );


                        return;
                    }


                    procedimentos[
                        index
                    ].valorCobrado =
                        novoValor;


                    procedimentos[
                        index
                    ].valorTotal =
                        novoValor;


                    atualizarTabela();
                };


            valorContainer.appendChild(
                inputValor
            );


            valorContainer.appendChild(
                indicador
            );


            valorCell.appendChild(
                valorContainer
            );


            /* =================================
               OBSERVAÇÃO
            ================================= */

            const observacaoCell =
                row.insertCell(
                    4
                );


            const btnObservacao =
                document.createElement(
                    'button'
                );


            btnObservacao.type =
                'button';


            btnObservacao.className =
                'btn-observacao';


            if (
                item.observacao ||
                item.manutencao
                    ?.nomeProcedimento
            ) {

                btnObservacao.innerText =
                    '📝 Observação';


                btnObservacao.classList.add(
                    'tem-observacao'
                );

            } else {

                btnObservacao.innerText =
                    '+ Observação';
            }


            btnObservacao.onclick =
                () =>
                    abrirModalObservacao(
                        index
                    );


            observacaoCell.appendChild(
                btnObservacao
            );


            /* =================================
               AÇÕES
            ================================= */

            const acaoCell =
                row.insertCell(
                    5
                );


            const acoes =
                document.createElement(
                    'div'
                );


            acoes.className =
                'acoes-item';


            const btnRemove =
                document.createElement(
                    'button'
                );


            btnRemove.type =
                'button';


            btnRemove.innerText =
                '×';


            btnRemove.className =
                'btn-remover';


            btnRemove.title =
                'Remover procedimento';


            btnRemove.onclick =
                () => {

                    procedimentos.splice(
                        index,
                        1
                    );


                    atualizarTabela();
                };


            acoes.appendChild(
                btnRemove
            );


            acaoCell.appendChild(
                acoes
            );


            total +=
                converterNumero(
                    item.valorCobrado
                );
        }
    );


    /* =========================================
       TOTAIS
    ========================================= */

    const desconto =
        converterNumero(
            document.getElementById(
                'desconto'
            ).value
        );


    const totalComDescontoPix =
        total -
        (
            total *
            (
                desconto /
                100
            )
        );


    const parcelas =
        Math.max(
            1,

            parseInt(
                document.getElementById(
                    'parcelas'
                ).value
            ) || 1
        );


    const valorParcela =
        total /
        parcelas;


    document.getElementById(
        'total'
    ).innerText =
        formatarMoeda(
            total
        );


    document.getElementById(
        'valorParcela'
    ).innerText =
        `Em ${parcelas}x de ${formatarMoeda(valorParcela)}`;


    const textoDesconto =
        document.getElementById(
            'textoDesconto'
        );


    if (desconto > 0) {

        textoDesconto.innerText =
            `${desconto}% de desconto no Pix ou Dinheiro (${formatarMoeda(totalComDescontoPix)}).`;

    } else {

        textoDesconto.innerText =
            '';
    }


    tabela.style.display =
        procedimentos.length > 0
            ? 'table'
            : 'none';
}


/* =========================================================
   MODAL DE OBSERVAÇÃO
========================================================= */

async function abrirModalObservacao(
    index
) {

    indiceObservacao =
        index;


    const item =
        procedimentos[
        index
        ];


    document.getElementById(
        'observacaoProcedimentoNome'
    ).innerText =
        item.nomeProcedimento;


    document.getElementById(
        'observacaoProcedimento'
    ).value =
        item.observacao || '';


    const bloco =
        document.getElementById(
            'blocoManutencao'
        );


    const nomeManutencao =
        obterManutencaoDaInstalacao(
            item.nomeProcedimento
        );


    /*
       Procedimento normal:
       só observação.
    */

    if (!nomeManutencao) {

        bloco.style.display =
            'none';


        manutencaoSelecionada =
            null;


        document.getElementById(
            'modalObservacao'
        ).classList.add(
            'ativo'
        );


        return;
    }


    /*
       Aparelho:
       exibe manutenção.
    */

    bloco.style.display =
        'block';


    /*
       Se manutenção já estiver salva,
       apenas recarrega.
    */

    if (
        item.manutencao &&
        item.manutencao
            .nomeProcedimento
    ) {

        manutencaoSelecionada = {
            ...item.manutencao
        };


        preencherManutencaoModal();


        document.getElementById(
            'modalObservacao'
        ).classList.add(
            'ativo'
        );


        return;
    }


    /*
       Caso ainda não exista,
       busca automaticamente.
    */

    try {

        const response =
            await fetch(
                `/api/procedimentos/buscar?nome=${encodeURIComponent(nomeManutencao)}`
            );


        const lista =
            await response.json();


        const proc =
            lista.find(
                p =>
                    normalizarNome(
                        p.nome
                    ) ===
                    normalizarNome(
                        nomeManutencao
                    )
            );


        if (!proc) {

            alert(
                `A manutenção "${nomeManutencao}" não foi encontrada no cadastro de procedimentos.`
            );


            return;
        }


        manutencaoSelecionada = {

            procedimentoId:
                proc._id,

            nomeProcedimento:
                proc.nome,

            valorPrincipal:
                converterNumero(
                    proc.precos
                        ?.padrao ??
                    proc.valor
                ),

            valorDesconto:
                converterNumero(
                    proc.precos
                        ?.especial1
                ),

            valorFamilia:
                converterNumero(
                    proc.precos
                        ?.especial2
                ),

            valorCobrado:
                converterNumero(
                    proc.precos
                        ?.padrao ??
                    proc.valor
                )
        };


        preencherManutencaoModal();


        document.getElementById(
            'modalObservacao'
        ).classList.add(
            'ativo'
        );

    } catch (error) {

        console.error(
            'Erro ao buscar manutenção:',
            error
        );


        alert(
            'Não foi possível carregar a manutenção vinculada.'
        );
    }
}


/* =========================================================
   PREENCHER MANUTENÇÃO
========================================================= */

function preencherManutencaoModal() {

    if (
        !manutencaoSelecionada
    ) {
        return;
    }


    document.getElementById(
        'manutencaoNome'
    ).value =
        manutencaoSelecionada
            .nomeProcedimento;


    document.getElementById(
        'manutencaoValor'
    ).value =
        converterNumero(
            manutencaoSelecionada
                .valorCobrado
        ).toFixed(2);


    atualizarCorManutencao();
}


/* =========================================================
   COR DA MANUTENÇÃO
========================================================= */

function atualizarCorManutencao() {

    if (
        !manutencaoSelecionada
    ) {
        return;
    }


    const valor =
        converterNumero(
            document.getElementById(
                'manutencaoValor'
            ).value
        );


    const status =
        obterStatusValor(
            valor,

            manutencaoSelecionada
                .valorPrincipal,

            manutencaoSelecionada
                .valorDesconto
        );


    const indicador =
        document.getElementById(
            'statusValorManutencao'
        );


    indicador.className =
        `status-valor ${status}`;


    indicador.title =
        obterTituloStatus(
            status
        );
}


/* =========================================================
   FECHAR OBSERVAÇÃO
========================================================= */

function fecharModalObservacao() {

    document.getElementById(
        'modalObservacao'
    ).classList.remove(
        'ativo'
    );


    indiceObservacao =
        null;


    manutencaoSelecionada =
        null;
}


/* =========================================================
   SALVAR OBSERVAÇÃO / MANUTENÇÃO
========================================================= */

function salvarObservacaoProcedimento() {

    if (
        indiceObservacao ===
        null
    ) {
        return;
    }


    const item =
        procedimentos[
        indiceObservacao
        ];


    const observacao =
        document.getElementById(
            'observacaoProcedimento'
        ).value.trim();


    const nomeManutencao =
        obterManutencaoDaInstalacao(
            item.nomeProcedimento
        );


    /*
       Procedimento comum:
       observação opcional.
    */

    if (!nomeManutencao) {

        item.observacao =
            observacao;


        fecharModalObservacao();

        atualizarTabela();

        return;
    }


    /*
       Instalação:
       manutenção é obrigatória.
    */

    if (
        !manutencaoSelecionada
    ) {

        alert(
            'É necessário informar a manutenção vinculada.'
        );


        return;
    }


    const valorDigitado =
        converterNumero(
            document.getElementById(
                'manutencaoValor'
            ).value
        );


    /*
       Guarda a observação antes
       de qualquer confirmação.
    */

    item.observacao =
        observacao;


    /*
       Se estiver abaixo da família,
       abre nosso alerta.
    */

    if (
        manutencaoSelecionada
            .valorFamilia > 0 &&
        valorDigitado <
        manutencaoSelecionada
            .valorFamilia
    ) {

        acaoValorPendente = {

            tipo:
                'manutencao',

            index:
                indiceObservacao,

            novoValor:
                valorDigitado
        };


        abrirModalValorFamilia(
            valorDigitado,

            manutencaoSelecionada
                .valorFamilia
        );


        return;
    }


    /*
       Salva valor da manutenção.
    */

    manutencaoSelecionada
        .valorCobrado =
        valorDigitado;


    item.manutencao = {
        ...manutencaoSelecionada
    };


    fecharModalObservacao();

    atualizarTabela();
}


/* =========================================================
   ALERTA VALOR ABAIXO DA FAMÍLIA
========================================================= */

function abrirModalValorFamilia(
    valorDigitado,
    valorFamilia
) {

    const modal =
        document.getElementById(
            'modalValorFamilia'
        );


    const conteudo =
        modal.querySelector(
            '.modal-conteudo'
        );


    conteudo.innerHTML = `
        <p>
            O valor informado
            <strong>${formatarMoeda(valorDigitado)}</strong>
            está abaixo do valor família
            <strong>${formatarMoeda(valorFamilia)}</strong>.
        </p>

        <p>
            Este valor poderá gerar prejuízo
            neste procedimento.
        </p>

        <p>
            Deseja continuar?
        </p>
    `;


    modal.classList.add(
        'ativo'
    );
}


function fecharModalValorFamilia() {

    document.getElementById(
        'modalValorFamilia'
    ).classList.remove(
        'ativo'
    );
}


/* =========================================================
   NÃO: USAR VALOR FAMÍLIA
========================================================= */

function usarValorFamilia() {

    if (!acaoValorPendente) {

        fecharModalValorFamilia();

        return;
    }


    if (
        acaoValorPendente.tipo ===
        'novo'
    ) {

        const item =
            acaoValorPendente.item;


        item.valorCobrado =
            item.valorFamilia;


        item.valorTotal =
            item.valorFamilia;


        procedimentos.push(
            item
        );


        limparProcedimento();


    } else if (
        acaoValorPendente.tipo ===
        'manutencao'
    ) {

        const index =
            acaoValorPendente.index;


        const item =
            procedimentos[
            index
            ];


        manutencaoSelecionada
            .valorCobrado =
            manutencaoSelecionada
                .valorFamilia;


        item.manutencao = {
            ...manutencaoSelecionada
        };


        acaoValorPendente =
            null;


        fecharModalValorFamilia();

        fecharModalObservacao();

        atualizarTabela();

        return;


    } else {

        const index =
            acaoValorPendente.index;


        procedimentos[
            index
        ].valorCobrado =
            procedimentos[
                index
            ].valorFamilia;


        procedimentos[
            index
        ].valorTotal =
            procedimentos[
                index
            ].valorFamilia;
    }


    acaoValorPendente =
        null;


    fecharModalValorFamilia();

    atualizarTabela();
}


/* =========================================================
   SIM: MANTER VALOR ABAIXO
========================================================= */

function manterValorAbaixoFamilia() {

    if (!acaoValorPendente) {

        fecharModalValorFamilia();

        return;
    }


    if (
        acaoValorPendente.tipo ===
        'novo'
    ) {

        procedimentos.push(
            acaoValorPendente.item
        );


        limparProcedimento();


    } else if (
        acaoValorPendente.tipo ===
        'manutencao'
    ) {

        const index =
            acaoValorPendente.index;


        const item =
            procedimentos[
            index
            ];


        manutencaoSelecionada
            .valorCobrado =
            acaoValorPendente
                .novoValor;


        item.manutencao = {
            ...manutencaoSelecionada
        };


        acaoValorPendente =
            null;


        fecharModalValorFamilia();

        fecharModalObservacao();

        atualizarTabela();

        return;


    } else {

        const index =
            acaoValorPendente.index;


        const novoValor =
            acaoValorPendente
                .novoValor;


        procedimentos[
            index
        ].valorCobrado =
            novoValor;


        procedimentos[
            index
        ].valorTotal =
            novoValor;
    }


    acaoValorPendente =
        null;


    fecharModalValorFamilia();

    atualizarTabela();
}


/* =========================================================
   PDF
========================================================= */

function gerarPdfOrcamento({
    paciente,
    cpf,
    desconto,
    parcelas,
    total,
    totalComDesconto,
    valorParcela
}) {

    const {
        jsPDF
    } =
        window.jspdf;


    const doc =
        new jsPDF();


    const inicioY =
        45;


    const imgProps =
        doc.getImageProperties(
            logoBase64
        );


    const larguraLogo =
        140;


    const alturaLogo =
        (
            imgProps.height *
            larguraLogo
        ) /
        imgProps.width;


    doc.addImage(
        logoBase64,
        'PNG',
        30,
        10,
        larguraLogo,
        alturaLogo
    );

    doc.setFontSize(
        12
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        'Dra. Cinthia Leone da Cunha',
        15,
        inicioY + 9
    );


    doc.line(
        15,
        inicioY + 12,
        195,
        inicioY + 12
    );


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        'CRO:',
        75,
        inicioY + 9
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        cro,
        90,
        inicioY + 9
    );


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        'Data:',
        115,
        inicioY + 9
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        new Date()
            .toLocaleDateString(),
        130,
        inicioY + 9
    );


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        '-    São Paulo - SP',
        155,
        inicioY + 9
    );


    doc.setFontSize(
        16
    );


    doc.text(
        'Orçamento Odontológico',
        70,
        inicioY + 25
    );


    doc.setFontSize(
        14
    );


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        'Paciente:',
        20,
        inicioY + 37
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        paciente,
        45,
        inicioY + 37
    );


    if (cpf) {

        doc.setFont(
            undefined,
            'bold'
        );


        doc.text(
            'CPF:',
            130,
            inicioY + 37
        );


        doc.setFont(
            undefined,
            'normal'
        );


        doc.text(
            cpf,
            142,
            inicioY + 37
        );
    }


    let y =
        95;


    doc.setFontSize(
        12
    );


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        'Procedimentos:',
        20,
        y
    );


    y +=
        10;


    doc.setFont(
        undefined,
        'normal'
    );


    procedimentos.forEach(
        item => {

            const texto =
                `${item.nomeProcedimento}` +
                `${item.tipo ? ' (' + item.tipo + ')' : ''}` +
                `${item.dente ? ' - Dente: ' + item.dente : ''}` +
                `  ${formatarMoeda(item.valorCobrado)}`;


            doc.text(
                texto,
                20,
                y
            );


            y +=
                7;


            /*
               MANUTENÇÃO VINCULADA
            */

            if (
                item.manutencao &&
                item.manutencao
                    .nomeProcedimento
            ) {

                doc.setFontSize(
                    10
                );


                doc.setFont(
                    undefined,
                    'normal'
                );


                doc.text(
                    `Manutenção: ${item.manutencao.nomeProcedimento} - ${formatarMoeda(item.manutencao.valorCobrado)}`,
                    25,
                    y
                );


                y +=
                    6;


                doc.setFontSize(
                    12
                );
            }


            /*
               OBSERVAÇÃO ADICIONAL
            */

            if (
                item.observacao
            ) {

                doc.setFontSize(
                    9
                );


                doc.setTextColor(
                    90,
                    90,
                    90
                );


                const linhasObservacao =
                    doc.splitTextToSize(
                        `Obs.: ${item.observacao}`,
                        165
                    );


                doc.text(
                    linhasObservacao,
                    25,
                    y
                );


                y +=
                    linhasObservacao.length *
                    5;


                doc.setTextColor(
                    0,
                    0,
                    0
                );


                doc.setFontSize(
                    12
                );
            }


            y +=
                2;
        }
    );


    y +=
        8;


    doc.setFontSize(
        16
    );


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        `Total: ${formatarMoeda(total)}`,
        20,
        y
    );


    y +=
        10;


    doc.setFontSize(
        12
    );


    doc.text(
        `Em ${parcelas}x de ${formatarMoeda(valorParcela)} sem juros`,
        20,
        y
    );


    if (desconto > 0) {

        y +=
            9;


        doc.setFontSize(
            11
        );


        doc.setFont(
            undefined,
            'normal'
        );


        doc.text(
            `Desconto de ${desconto}% no Pix ou dinheiro: ${formatarMoeda(totalComDesconto)}.`,
            20,
            y
        );
    }


    y +=
        10;


    doc.setFontSize(
        9
    );


    doc.text(
        'Orçamento válido por 30 dias.',
        20,
        y
    );


    doc.setFontSize(
        9
    );


    doc.text(
        endereco,
        50,
        275
    );


    doc.text(
        telefone,
        80,
        280
    );


    doc.save(
        `orcamento_${paciente}.pdf`
    );
}


/* =========================================================
   SALVAR E GERAR ORÇAMENTO
========================================================= */

async function gerarOrcamento() {

    const paciente =
        document.getElementById(
            'paciente'
        ).value.trim();


    const cpf =
        document.getElementById(
            'cpf'
        ).value.trim();


    if (!paciente) {

        alert(
            'Por favor, preencha o nome do paciente.'
        );


        return;
    }


    if (
        procedimentos.length ===
        0
    ) {

        alert(
            'Adicione pelo menos um procedimento.'
        );


        return;
    }


    /*
       Proteção:
       instalação não pode ficar sem
       manutenção vinculada.
    */

    const instalacaoSemManutencao =
        procedimentos.find(
            item =>
                ehInstalacaoAparelho(
                    item.nomeProcedimento
                ) &&
                !item.manutencao
                    ?.nomeProcedimento
        );


    if (
        instalacaoSemManutencao
    ) {

        alert(
            `A manutenção vinculada de "${instalacaoSemManutencao.nomeProcedimento}" precisa ser salva antes de gerar o orçamento.`
        );


        return;
    }


    const desconto =
        converterNumero(
            document.getElementById(
                'desconto'
            ).value
        );


    const parcelas =
        Math.max(
            1,

            parseInt(
                document.getElementById(
                    'parcelas'
                ).value
            ) || 1
        );


    const total =
        procedimentos.reduce(
            (
                acc,
                item
            ) =>
                acc +
                converterNumero(
                    item.valorCobrado
                ),
            0
        );


    const totalComDesconto =
        total -
        (
            total *
            (
                desconto /
                100
            )
        );


    const valorParcela =
        total /
        parcelas;


    const btn =
        document.querySelector(
            '.btn-pdf'
        );


    if (btn) {

        btn.disabled =
            true;


        btn.textContent =
            'Salvando...';
    }


    try {

        const itens =
            procedimentos.map(
                item => ({

                    procedimentoId:
                        item.procedimentoId ||
                        null,

                    nomeProcedimento:
                        item.nomeProcedimento,

                    tipo:
                        item.tipo || '',

                    dente:
                        item.dente || '',

                    quantidade:
                        item.quantidade ||
                        1,

                    valorPrincipal:
                        converterNumero(
                            item.valorPrincipal
                        ),

                    valorDesconto:
                        converterNumero(
                            item.valorDesconto
                        ),

                    valorFamilia:
                        converterNumero(
                            item.valorFamilia
                        ),

                    valorCobrado:
                        converterNumero(
                            item.valorCobrado
                        ),

                    valorTotal:
                        converterNumero(
                            item.valorCobrado
                        ),

                    observacao:
                        item.observacao ||
                        '',

                    manutencao:
                        item.manutencao
                            ? {
                                procedimentoId:
                                    item.manutencao
                                        .procedimentoId ||
                                    null,

                                nomeProcedimento:
                                    item.manutencao
                                        .nomeProcedimento ||
                                    '',

                                valorPrincipal:
                                    converterNumero(
                                        item.manutencao
                                            .valorPrincipal
                                    ),

                                valorDesconto:
                                    converterNumero(
                                        item.manutencao
                                            .valorDesconto
                                    ),

                                valorFamilia:
                                    converterNumero(
                                        item.manutencao
                                            .valorFamilia
                                    ),

                                valorCobrado:
                                    converterNumero(
                                        item.manutencao
                                            .valorCobrado
                                    )
                            }
                            : undefined
                })
            );


        const payload = {

            pacienteNome:
                paciente,

            cpf:
                cpf.replace(
                    /\D/g,
                    ''
                ),

            itens,

            observacaoGeral:
                '',

            desconto,

            parcelas,

            total,

            status:
                'gerado'
        };


        const response =
            await fetch(
                '/api/orcamentos',
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const data =
            await response.json();


        if (
            !response.ok
        ) {

            console.error(
                'ERRO RETORNADO PELO BACKEND:',
                data
            );


            throw new Error(
                data.detalhes ||
                data.erro ||
                'Erro ao salvar orçamento'
            );
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


        alert(
            'Orçamento salvo e PDF gerado com sucesso!'
        );

    } catch (error) {

        console.error(
            'Erro ao gerar orçamento:',
            error
        );


        alert(
            'Não foi possível salvar e gerar o orçamento.'
        );

    } finally {

        if (btn) {

            btn.disabled =
                false;


            btn.textContent =
                'Salvar e Gerar Orçamento';
        }
    }
}


/* =========================================================
   AUTOCOMPLETE PACIENTES
========================================================= */

const pacienteInput =
    document.getElementById(
        'paciente'
    );


const sugestoesDiv =
    document.getElementById(
        'sugestoes'
    );


const cpfInput =
    document.getElementById(
        'cpf'
    );


pacienteInput?.addEventListener(
    'input',
    async () => {

        const termo =
            pacienteInput
                .value
                .trim();


        cpfInput.value =
            '';


        if (
            termo.length <
            2
        ) {

            sugestoesDiv.innerHTML =
                '';


            return;
        }


        try {

            const response =
                await fetch(
                    `/api/pacientes?nome=${encodeURIComponent(termo)}`
                );


            const pacientes =
                await response.json();


            sugestoesDiv.innerHTML =
                '';


            pacientes.forEach(
                p => {

                    const sugestao =
                        document.createElement(
                            'div'
                        );


                    sugestao.textContent =
                        p.nome;


                    sugestao.addEventListener(
                        'click',
                        () => {

                            pacienteInput.value =
                                p.nome;


                            cpfInput.value =
                                p.cpf ||
                                '';


                            sugestoesDiv.innerHTML =
                                '';
                        }
                    );


                    sugestoesDiv.appendChild(
                        sugestao
                    );
                }
            );

        } catch (error) {

            console.error(
                'Erro ao buscar pacientes:',
                error
            );


            sugestoesDiv.innerHTML =
                '';
        }
    }
);


/* =========================================================
   EVENTOS
========================================================= */

document.addEventListener(
    'click',
    e => {

        if (
            pacienteInput &&
            e.target !==
            pacienteInput
        ) {

            sugestoesDiv.innerHTML =
                '';
        }


        const wrapProc =
            document.getElementById(
                'procedimentoInput'
            )?.closest(
                '.autocomplete-wrap'
            );


        if (
            wrapProc &&
            !wrapProc.contains(
                e.target
            )
        ) {

            esconderSugestoes();
        }
    }
);


document.addEventListener(
    'DOMContentLoaded',
    () => {

        const desconto =
            document.getElementById(
                'desconto'
            );


        const parcelas =
            document.getElementById(
                'parcelas'
            );


        const inputProc =
            document.getElementById(
                'procedimentoInput'
            );


        const inputValor =
            document.getElementById(
                'valorProc'
            );


        const inputManutencaoValor =
            document.getElementById(
                'manutencaoValor'
            );


        if (desconto) {

            desconto.oninput =
                atualizarTabela;
        }


        if (parcelas) {

            parcelas.oninput =
                atualizarTabela;
        }


        if (inputProc) {

            inputProc.addEventListener(
                'input',
                e => {

                    procedimentoSelecionado =
                        null;


                    buscarProcedimentos(
                        e.target.value
                    );
                }
            );
        }


        if (inputValor) {

            inputValor.addEventListener(
                'input',
                atualizarIndicadorNovoProcedimento
            );
        }


        if (
            inputManutencaoValor
        ) {

            inputManutencaoValor
                .addEventListener(
                    'input',
                    () => {

                        if (
                            !manutencaoSelecionada
                        ) {
                            return;
                        }


                        const novoValor =
                            converterNumero(
                                inputManutencaoValor
                                    .value
                            );


                        manutencaoSelecionada
                            .valorCobrado =
                            novoValor;


                        atualizarCorManutencao();
                    }
                );
        }
    }
);