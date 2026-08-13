/* =========================================
   PEDIDO ODONTOLÓGICO
   PANORÂMICA / PERIAPICAL / TOMOGRAFIA
   DOCUMENTAÇÃO / SOLICITAÇÃO LIVRE

   PADRÃO PDF:
   MESMO LAYOUT DO ATESTADO
========================================= */

console.log(
    'Pedido odontológico unificado carregado!'
);


/* =========================================
   ELEMENTOS
========================================= */

const pacienteInput =
    document.getElementById('paciente');


const sugestoesDiv =
    document.getElementById('sugestoes');


const campoDocumentacao =
    document.getElementById('campoDocumentacao');


const campoDente =
    document.getElementById('campoDente');


const campoRegiao =
    document.getElementById('campoRegiao');


const campoAdicionar =
    document.getElementById('campoAdicionar');


const campoSolicitacao =
    document.getElementById('campoSolicitacao');


const numDenteInput =
    document.getElementById('numDente');


const regiaoSelect =
    document.getElementById('regiao');


const solicitacaoInput =
    document.getElementById('solicitacao');


const assinaturaInput =
    document.getElementById('assinatura');


const areaItensPedido =
    document.getElementById('areaItensPedido');


const listaItensPedido =
    document.getElementById('listaItensPedido');


const tituloItensPedido =
    document.getElementById('tituloItensPedido');


/* =========================================
   ITENS DO PEDIDO
========================================= */

let itensPedido = [];


/* =========================================
   TIPO DE PEDIDO
========================================= */

function obterTipoPedido() {

    const selecionado =
        document.querySelector(
            'input[name="tipoPedido"]:checked'
        );


    if (!selecionado) {

        return 'panoramica';

    }


    return selecionado.value;

}


/* =========================================
   TIPO DE DOCUMENTAÇÃO
========================================= */

function obterTipoDocumentacao() {

    const selecionado =
        document.querySelector(
            'input[name="tipoDocumentacao"]:checked'
        );


    if (!selecionado) {

        return 'simples';

    }


    return selecionado.value;

}


/* =========================================
   LIMPAR CAMPOS ESPECÍFICOS
========================================= */

function limparCamposEspecificos() {

    if (numDenteInput) {

        numDenteInput.value =
            '';

    }


    if (regiaoSelect) {

        regiaoSelect.value =
            '';

    }


    if (solicitacaoInput) {

        solicitacaoInput.value =
            '';

    }


    itensPedido = [];


    atualizarListaItens();

}


/* =========================================
   ATUALIZAR CAMPOS POR TIPO
========================================= */

function atualizarTipoPedido() {

    const tipo =
        obterTipoPedido();


    /* =====================================
       ESCONDE TODOS OS CAMPOS ESPECÍFICOS
    ====================================== */

    campoDocumentacao.hidden =
        true;


    campoDente.hidden =
        true;


    campoRegiao.hidden =
        true;


    campoAdicionar.hidden =
        true;


    campoSolicitacao.hidden =
        true;


    areaItensPedido.hidden =
        true;


    /* Limpa dados ao trocar o tipo */

    limparCamposEspecificos();


    /* =====================================
       PANORÂMICA
    ====================================== */

    if (
        tipo === 'panoramica'
    ) {

        return;

    }


    /* =====================================
       PERIAPICAL
    ====================================== */

    if (
        tipo === 'periapical'
    ) {

        campoDente.hidden =
            false;


        campoAdicionar.hidden =
            false;


        tituloItensPedido.textContent =
            'Dentes adicionados';


        return;

    }


    /* =====================================
       TOMOGRAFIA
    ====================================== */

    if (
        tipo === 'tomografia'
    ) {

        campoRegiao.hidden =
            false;


        campoDente.hidden =
            false;


        campoAdicionar.hidden =
            false;


        tituloItensPedido.textContent =
            'Regiões / dentes adicionados';


        return;

    }


    /* =====================================
       DOCUMENTAÇÃO
    ====================================== */

    if (
        tipo === 'documentacao'
    ) {

        campoDocumentacao.hidden =
            false;


        return;

    }


    /* =====================================
       SOLICITAÇÃO LIVRE
    ====================================== */

    if (
        tipo === 'solicitacao'
    ) {

        campoSolicitacao.hidden =
            false;

    }

}


/* =========================================
   FLAGS DO TIPO DE PEDIDO
========================================= */

document
    .querySelectorAll(
        'input[name="tipoPedido"]'
    )
    .forEach(
        radio => {

            radio.addEventListener(
                'change',
                atualizarTipoPedido
            );

        }
    );


/* =========================================
   VALIDAR DENTE
========================================= */

function validarNumeroDente(
    numero
) {

    const dente =
        Number(numero);


    const permanentes =
        (
            dente >= 11 &&
            dente <= 18
        ) ||
        (
            dente >= 21 &&
            dente <= 28
        ) ||
        (
            dente >= 31 &&
            dente <= 38
        ) ||
        (
            dente >= 41 &&
            dente <= 48
        );


    const deciduos =
        (
            dente >= 51 &&
            dente <= 55
        ) ||
        (
            dente >= 61 &&
            dente <= 65
        ) ||
        (
            dente >= 71 &&
            dente <= 75
        ) ||
        (
            dente >= 81 &&
            dente <= 85
        );


    return (
        permanentes ||
        deciduos
    );

}


/* =========================================
   ADICIONAR ITEM
========================================= */

function adicionarItemPedido() {

    const tipo =
        obterTipoPedido();


    /* =====================================
       PERIAPICAL
    ====================================== */

    if (
        tipo === 'periapical'
    ) {

        const dente =
            numDenteInput
                .value
                .trim();


        if (!dente) {

            alert(
                'Informe o dente.'
            );


            numDenteInput.focus();


            return;

        }


        if (
            !validarNumeroDente(
                dente
            )
        ) {

            alert(
                'Informe um número de dente válido.'
            );


            numDenteInput.focus();


            return;

        }


        const jaExiste =
            itensPedido.some(
                item =>
                    item.tipo ===
                        'dente' &&
                    item.valor ===
                        dente
            );


        if (
            jaExiste
        ) {

            alert(
                `O dente ${dente} já foi adicionado.`
            );


            return;

        }


        itensPedido.push(
            {
                tipo:
                    'dente',

                valor:
                    dente
            }
        );


        numDenteInput.value =
            '';


        numDenteInput.focus();


        atualizarListaItens();


        return;

    }


    /* =====================================
       TOMOGRAFIA
    ====================================== */

    if (
        tipo === 'tomografia'
    ) {

        const regiao =
            regiaoSelect
                .value
                .trim();


        const dente =
            numDenteInput
                .value
                .trim();


        if (
            !regiao &&
            !dente
        ) {

            alert(
                'Informe pelo menos a região ou o dente.'
            );


            return;

        }


        if (
            dente &&
            !validarNumeroDente(
                dente
            )
        ) {

            alert(
                'Informe um número de dente válido.'
            );


            numDenteInput.focus();


            return;

        }


        const item = {

            tipo:
                'tomografia',

            regiao:
                regiao,

            dente:
                dente

        };


        const jaExiste =
            itensPedido.some(
                existente =>
                    existente.tipo ===
                        'tomografia' &&
                    existente.regiao ===
                        regiao &&
                    existente.dente ===
                        dente
            );


        if (
            jaExiste
        ) {

            alert(
                'Este item já foi adicionado.'
            );


            return;

        }


        itensPedido.push(
            item
        );


        regiaoSelect.value =
            '';


        numDenteInput.value =
            '';


        atualizarListaItens();

    }

}


/* =========================================
   REMOVER ITEM
========================================= */

function removerItemPedido(
    index
) {

    itensPedido.splice(
        index,
        1
    );


    atualizarListaItens();

}


/* =========================================
   ESCAPAR HTML
========================================= */

function escapeHtml(
    texto
) {

    return String(
        texto || ''
    )
        .replaceAll(
            '&',
            '&amp;'
        )
        .replaceAll(
            '<',
            '&lt;'
        )
        .replaceAll(
            '>',
            '&gt;'
        )
        .replaceAll(
            '"',
            '&quot;'
        )
        .replaceAll(
            "'",
            '&#039;'
        );

}


/* =========================================
   TEXTO DO ITEM
========================================= */

function obterTextoItem(
    item
) {

    if (
        item.tipo ===
        'dente'
    ) {

        return (
            `Dente ${item.valor}`
        );

    }


    if (
        item.tipo ===
        'tomografia'
    ) {

        const partes =
            [];


        if (
            item.regiao
        ) {

            partes.push(
                item.regiao
            );

        }


        if (
            item.dente
        ) {

            partes.push(
                `Dente ${item.dente}`
            );

        }


        return partes.join(
            ' • '
        );

    }


    return '';

}


/* =========================================
   ATUALIZAR LISTA DE ITENS
========================================= */

function atualizarListaItens() {

    if (
        !listaItensPedido ||
        !areaItensPedido
    ) {

        return;

    }


    const tipo =
        obterTipoPedido();


    const usaItens =
        tipo ===
            'periapical' ||
        tipo ===
            'tomografia';


    if (
        !usaItens ||
        itensPedido.length === 0
    ) {

        areaItensPedido.hidden =
            true;


        listaItensPedido.innerHTML =
            '';


        return;

    }


    areaItensPedido.hidden =
        false;


    listaItensPedido.innerHTML =
        itensPedido
            .map(
                (
                    item,
                    index
                ) => {


                    const texto =
                        obterTextoItem(
                            item
                        );


                    return `

                        <div class="item-pedido">

                            <span>
                                ${escapeHtml(texto)}
                            </span>

                            <button
                                type="button"
                                class="btn-remover-item"
                                onclick="removerItemPedido(${index})"
                                title="Remover"
                            >
                                ×
                            </button>

                        </div>

                    `;

                }
            )
            .join('');

}


/* =========================================
   ENTER NO DENTE
========================================= */

numDenteInput
    ?.addEventListener(
        'keydown',
        event => {

            if (
                event.key ===
                'Enter'
            ) {

                event.preventDefault();


                adicionarItemPedido();

            }

        }
    );


/* =========================================
   AUTOCOMPLETE DE PACIENTES
========================================= */

pacienteInput
    ?.addEventListener(
        'input',
        async () => {


            const termo =
                pacienteInput
                    .value
                    .trim();


            if (
                termo.length < 2
            ) {

                sugestoesDiv.innerHTML =
                    '';


                return;

            }


            try {


                const response =
                    await fetch(
                        `http://localhost:3000/api/pacientes?nome=${encodeURIComponent(termo)}`
                    );


                if (
                    !response.ok
                ) {

                    throw new Error(
                        'Erro ao buscar pacientes.'
                    );

                }


                const pacientes =
                    await response.json();


                sugestoesDiv.innerHTML =
                    '';


                pacientes.forEach(
                    paciente => {


                        const sugestao =
                            document.createElement(
                                'div'
                            );


                        sugestao.textContent =
                            paciente.nome;


                        sugestao.addEventListener(
                            'click',
                            () => {


                                pacienteInput.value =
                                    paciente.nome;


                                sugestoesDiv.innerHTML =
                                    '';

                            }
                        );


                        sugestoesDiv.appendChild(
                            sugestao
                        );

                    }
                );


            } catch (
                error
            ) {


                console.error(
                    'Erro ao buscar pacientes:',
                    error
                );

            }

        }
    );


/* =========================================
   FECHAR AUTOCOMPLETE
========================================= */

document.addEventListener(
    'click',
    event => {


        if (
            !event.target.closest(
                '.autocomplete-wrap'
            )
        ) {

            sugestoesDiv.innerHTML =
                '';

        }

    }
);


/* =========================================
   DATA POR EXTENSO
========================================= */

function formatarDataExtenso(
    data
) {

    const ano =
        data.getFullYear();


    const mesNumero =
        data.getMonth();


    const dia =
        data.getDate();


    const meses = [

        'janeiro',
        'fevereiro',
        'março',
        'abril',
        'maio',
        'junho',
        'julho',
        'agosto',
        'setembro',
        'outubro',
        'novembro',
        'dezembro'

    ];


    return (
        `${dia} de ` +
        `${meses[mesNumero]} de ` +
        `${ano}`
    );

}


/* =========================================
   DATA ATUAL POR EXTENSO
========================================= */

function obterDataAtualExtenso() {

    return formatarDataExtenso(
        new Date()
    );

}


/* =========================================
   DOCUMENTO BASE
   MESMO PADRÃO DO ATESTADO
========================================= */

function criarDocumentoBase() {

    const { jsPDF } =
        window.jspdf;


    const doc =
        new jsPDF();


    /* =====================================
       LOGO PROPORCIONAL
    ====================================== */

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


    return doc;

}


/* =========================================
   PACIENTE NO PDF

   Sem identificação do emitente.
   Sem caixa antiga.

   Mesmo padrão limpo do atestado.
========================================= */

function adicionarPacientePDF(
    doc,
    paciente
) {

    const inicioY =
        60;

    /* PACIENTE */

    doc.setFontSize(12);
    doc.setFont(undefined,'bold');

    doc.text('Paciente:', 20, inicioY);

    doc.setFont(undefined,'normal');

    doc.text(paciente, 45,inicioY);

}


/* =========================================
   TÍTULO DO DOCUMENTO
========================================= */

function adicionarTituloPedido(
    doc
) {

    doc.setFontSize(
        16
    );


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        'Pedido Odontológico',
        105,
        82,
        {
            align:
                'center'
        }
    );

}


/* =========================================
   "SOLICITO"
========================================= */

function adicionarSolicito(
    doc
) {

    doc.setFontSize(
        12
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        'Solicito,',
        20,
        100
    );

}


/* =========================================
   PANORÂMICA
========================================= */

function adicionarConteudoPanoramica(
    doc
) {

    let y =
        112;


    doc.setFontSize(
        12
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        'Radiografia panorâmica para fins diagnósticos.',
        20,
        y
    );


    /* =====================================
       OBSERVAÇÃO
    ====================================== */

    y +=
        25;


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        'Obs:',
        20,
        y
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        'favor enviar para o seguinte e-mail:',
        33,
        y
    );


    if (
        typeof email !==
        'undefined' &&
        email
    ) {

        doc.setFont(
            undefined,
            'bold'
        );


        doc.text(
            email,
            100,
            y
        );

    }

}


/* =========================================
   PERIAPICAL
========================================= */

function adicionarConteudoPeriapical(
    doc
) {

    let y =
        112;


    doc.setFontSize(
        12
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        'Radiografia periapical do(s) dente(s):',
        20,
        y
    );


    y +=
        10;


    itensPedido.forEach(
        item => {


            const texto =
                `• Dente ${item.valor}`;


            const linhas =
                doc.splitTextToSize(
                    texto,
                    170
                );


            doc.text(
                linhas,
                28,
                y
            );


            y +=
                linhas.length *
                6;

        }
    );


    y +=
        7;


    doc.text(
        'Para fins de diagnóstico.',
        20,
        y
    );

}


/* =========================================
   TOMOGRAFIA
========================================= */

function adicionarConteudoTomografia(
    doc
) {

    let y =
        112;


    doc.setFontSize(
        12
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        'Tomografia computadorizada para fins de diagnóstico.',
        20,
        y
    );


    y +=
        10;


    itensPedido.forEach(
        item => {


            const partes =
                [];


            if (
                item.regiao
            ) {

                partes.push(
                    `Região: ${item.regiao}`
                );

            }


            if (
                item.dente
            ) {

                partes.push(
                    `Dente: ${item.dente}`
                );

            }


            const texto =
                `• ${partes.join(' - ')}`;


            const linhas =
                doc.splitTextToSize(
                    texto,
                    170
                );


            doc.text(
                linhas,
                28,
                y
            );


            y +=
                linhas.length *
                6;

        }
    );

}


/* =========================================
   DOCUMENTAÇÃO
========================================= */

function adicionarConteudoDocumentacao(
    doc
) {

    const tipo =
        obterTipoDocumentacao();


    const descricao =
        tipo === 'completa'
            ? 'completa'
            : 'simples';


    let y =
        112;


    doc.setFontSize(
        12
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        `Documentação ortodôntica ${descricao}.`,
        20,
        y
    );


    y +=
        25;


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        'Obs:',
        20,
        y
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        'favor enviar para o seguinte e-mail:',
        33,
        y
    );


    if (
        typeof email !==
        'undefined' &&
        email
    ) {

        doc.setFont(
            undefined,
            'bold'
        );


        doc.text(
            email,
            100,
            y
        );

    }

}


/* =========================================
   SOLICITAÇÃO LIVRE
========================================= */

function adicionarConteudoSolicitacao(
    doc
) {

    const solicitacao =
        solicitacaoInput
            .value
            .trim();


    doc.setFontSize(
        12
    );


    doc.setFont(
        undefined,
        'normal'
    );


    const linhas =
        doc.splitTextToSize(
            solicitacao,
            170
        );


    doc.text(
        linhas,
        20,
        112
    );

}


/* =========================================
   FINALIZAÇÃO DO PDF

   MESMO PADRÃO DO ATESTADO
========================================= */

function finalizarPedidoPDF(
    doc
) {

    /* =====================================
       CARIMBO
    ====================================== */

    if (
        assinaturaInput &&
        assinaturaInput.checked &&
        typeof carimbo !==
        'undefined'
    ) {

        doc.addImage(
            carimbo,
            'PNG',
            135,
            200,
            38,
            38
        );

    }


    /* =====================================
       DATA POR EXTENSO
    ====================================== */

    const dataExtenso =
        obterDataAtualExtenso();


    doc.setFontSize(
        12
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        `São Paulo, ${dataExtenso}`,
        20,
        240
    );


    /* =====================================
       ASSINATURA
    ====================================== */

    doc.setFontSize(
        9
    );


    doc.setFont(
        undefined,
        'normal'
    );


    if (
        typeof ass1 !==
        'undefined'
    ) {

        doc.text(
            ass1,
            120,
            235
        );

    }


    if (
        typeof ass2 !==
        'undefined'
    ) {

        doc.text(
            ass2,
            120,
            240
        );

    }


    if (
        typeof cnpj !==
        'undefined'
    ) {

        doc.text(
            cnpj,
            120,
            245
        );

    }


    /* =====================================
       RODAPÉ
    ====================================== */

    doc.setFontSize(
        9
    );


    if (
        typeof endereco !==
        'undefined'
    ) {

        doc.text(
            endereco,
            50,
            275
        );

    }


    if (
        typeof telefone !==
        'undefined'
    ) {

        doc.text(
            telefone,
            80,
            280
        );

    }

}


/* =========================================
   VALIDAÇÃO
========================================= */

function validarPedido() {

    const paciente =
        pacienteInput
            .value
            .trim();


    const tipo =
        obterTipoPedido();


    if (
        !paciente
    ) {

        alert(
            'Informe o nome do paciente.'
        );


        pacienteInput.focus();


        return false;

    }


    /* =====================================
       PERIAPICAL
    ====================================== */

    if (
        tipo === 'periapical' &&
        itensPedido.length ===
            0
    ) {

        alert(
            'Adicione pelo menos um dente para o pedido periapical.'
        );


        return false;

    }


    /* =====================================
       TOMOGRAFIA
    ====================================== */

    if (
        tipo === 'tomografia' &&
        itensPedido.length ===
            0
    ) {

        alert(
            'Adicione pelo menos uma região ou um dente para a tomografia.'
        );


        return false;

    }


    /* =====================================
       SOLICITAÇÃO LIVRE
    ====================================== */

    if (
        tipo === 'solicitacao' &&
        !solicitacaoInput
            .value
            .trim()
    ) {

        alert(
            'Digite a solicitação.'
        );


        solicitacaoInput.focus();


        return false;

    }


    return true;

}


/* =========================================
   NOME DO ARQUIVO
========================================= */

function obterNomeArquivo(
    tipo,
    paciente
) {

    const nomes = {

        panoramica:
            'Pedido_Panoramica',

        periapical:
            'Pedido_Periapical',

        tomografia:
            'Pedido_Tomografia',

        documentacao:
            'Pedido_Documentacao',

        solicitacao:
            'Pedido'

    };


    return (
        `${nomes[tipo] || 'Pedido'}_${paciente}.pdf`
    );

}


/* =========================================
   GERAR PEDIDO
========================================= */

function gerarPedido() {

    if (
        !validarPedido()
    ) {

        return;

    }


    const paciente =
        pacienteInput
            .value
            .trim();


    const tipo =
        obterTipoPedido();


    /* =====================================
       DOCUMENTO
    ====================================== */

    const doc =
        criarDocumentoBase();


    /* =====================================
       PACIENTE
    ====================================== */

    adicionarPacientePDF(
        doc,
        paciente
    );


    /* =====================================
       TÍTULO
    ====================================== */

    adicionarTituloPedido(
        doc
    );


    /* =====================================
       SOLICITO
    ====================================== */

    adicionarSolicito(
        doc
    );


    /* =====================================
       CONTEÚDO
    ====================================== */

    if (
        tipo === 'panoramica'
    ) {

        adicionarConteudoPanoramica(
            doc
        );

    }


    else if (
        tipo === 'periapical'
    ) {

        adicionarConteudoPeriapical(
            doc
        );

    }


    else if (
        tipo === 'tomografia'
    ) {

        adicionarConteudoTomografia(
            doc
        );

    }


    else if (
        tipo === 'documentacao'
    ) {

        adicionarConteudoDocumentacao(
            doc
        );

    }


    else if (
        tipo === 'solicitacao'
    ) {

        adicionarConteudoSolicitacao(
            doc
        );

    }


    /* =====================================
       DATA / ASSINATURA / RODAPÉ
    ====================================== */

    finalizarPedidoPDF(
        doc
    );


    /* =====================================
       SALVAR
    ====================================== */

    doc.save(
        obterNomeArquivo(
            tipo,
            paciente
        )
    );

}


/* =========================================
   INICIALIZAÇÃO
========================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        atualizarTipoPedido();

    }
);


/* =========================================
   FUNÇÕES GLOBAIS
========================================= */

window.adicionarItemPedido =
    adicionarItemPedido;


window.removerItemPedido =
    removerItemPedido;


window.gerarPedido =
    gerarPedido;