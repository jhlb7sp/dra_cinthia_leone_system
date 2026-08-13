// ==========================================
// ATESTADO ODONTOLÓGICO
// HORAS / DIAS
// ==========================================


// ==========================================
// ELEMENTOS
// ==========================================

const pacienteInput =
    document.getElementById('paciente');

const cpfInput =
    document.getElementById('cpf');

const dataInput =
    document.getElementById('data');

const entradaInput =
    document.getElementById('entrada');

const saidaInput =
    document.getElementById('saida');

const diasRepousoInput =
    document.getElementById('diasrepouso');

const permiteCidInput =
    document.getElementById('permiteCid');

const cidInput =
    document.getElementById('cid');

const assinaturaInput =
    document.getElementById('assinatura');

const sugestoesDiv =
    document.getElementById('sugestoes');


// ==========================================
// DATA DE HOJE
// ==========================================

function preencherDataHoje() {

    if (!dataInput) {
        return;
    }


    if (dataInput.value) {
        return;
    }


    const hoje =
        new Date();


    const ano =
        hoje.getFullYear();


    const mes =
        String(
            hoje.getMonth() + 1
        ).padStart(
            2,
            '0'
        );


    const dia =
        String(
            hoje.getDate()
        ).padStart(
            2,
            '0'
        );


    dataInput.value =
        `${ano}-${mes}-${dia}`;

}


// ==========================================
// TIPO DE ATESTADO
// ==========================================

function obterTipoAtestado() {

    const selecionado =
        document.querySelector(
            'input[name="tipoAtestado"]:checked'
        );


    if (!selecionado) {
        return 'horas';
    }


    return selecionado.value;

}


// ==========================================
// HABILITAR / DESABILITAR DIAS
// ==========================================

function atualizarTipoAtestado() {

    const tipo =
        obterTipoAtestado();


    const ehDias =
        tipo === 'dias';


    diasRepousoInput.disabled =
        !ehDias;


    if (!ehDias) {

        diasRepousoInput.value =
            '';

    }

}


// ==========================================
// EVENTOS DO TIPO
// ==========================================

const radiosTipo =
    document.querySelectorAll(
        'input[name="tipoAtestado"]'
    );


radiosTipo.forEach(
    radio => {

        radio.addEventListener(
            'change',
            atualizarTipoAtestado
        );

    }
);


// ==========================================
// PERMISSÃO CID
// ==========================================

permiteCidInput.addEventListener(
    'change',
    () => {


        if (
            permiteCidInput.checked
        ) {

            cidInput.disabled =
                false;

            return;

        }


        cidInput.value =
            '';


        cidInput.disabled =
            true;

    }
);


// ==========================================
// FORMATAR CPF
// ==========================================

function formatarCPF(cpf) {

    if (!cpf) {
        return '';
    }


    const numeros =
        cpf.replace(
            /\D/g,
            ''
        );


    if (
        numeros.length !== 11
    ) {

        return cpf;

    }


    return numeros.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        '$1.$2.$3-$4'
    );

}


// ==========================================
// DATA NUMÉRICA
// ==========================================

function formatarDataNumerica(data) {

    if (!data) {
        return '';
    }


    const partes =
        data.split('-');


    if (
        partes.length !== 3
    ) {

        return data;

    }


    return (
        `${partes[2]}/` +
        `${partes[1]}/` +
        `${partes[0]}`
    );

}


// ==========================================
// DATA POR EXTENSO
// ==========================================

function formatarDataExtenso(data) {

    if (!data) {
        return '';
    }


    const partes =
        data.split('-');


    if (
        partes.length !== 3
    ) {

        return data;

    }


    const ano =
        partes[0];


    const mesNumero =
        Number(
            partes[1]
        );


    const dia =
        Number(
            partes[2]
        );


    const meses = [
        '',
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


// ==========================================
// GERAR ATESTADO
// ==========================================

function gerarAtestado() {

    const tipo =
        obterTipoAtestado();


    if (
        tipo === 'dias'
    ) {

        gerarAtestadoDias();

        return;

    }


    gerarAtestadoHoras();

}


// ==========================================
// DOCUMENTO BASE
// ==========================================

function criarDocumentoBase() {

    const { jsPDF } =
        window.jspdf;


    const doc =
        new jsPDF();


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


// ==========================================
// PACIENTE NO PDF
// ==========================================

function adicionarPacientePDF(
    doc,
    paciente,
    cpf
) {

    const inicioY =
        60;


    doc.setFontSize(12);


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        'Paciente:',
        20,
        inicioY
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        paciente,
        45,
        inicioY
    );


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        'CPF:',
        120,
        inicioY
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        cpf || '',
        135,
        inicioY
    );


    return inicioY;

}


// ==========================================
// ATESTADO DE HORAS
// ==========================================

function gerarAtestadoHoras() {

    const paciente =
        pacienteInput
            .value
            .trim();


    const cpf =
        cpfInput
            .value
            .trim();


    const data =
        dataInput.value;


    const entrada =
        entradaInput.value;


    const saida =
        saidaInput.value;


    const cid =
        cidInput.value;


    // ======================================
    // VALIDAÇÃO
    // ======================================

    if (
        paciente === '' ||
        data === '' ||
        entrada === '' ||
        saida === ''
    ) {

        alert(
            'Por favor, preencha o paciente, a data e os horários.'
        );

        return;

    }


    if (
        saida < entrada
    ) {

        alert(
            'O horário de saída não pode ser menor que o horário de chegada.'
        );

        return;

    }


    // ======================================
    // DOCUMENTO
    // ======================================

    const doc =
        criarDocumentoBase();


    const inicioY =
        adicionarPacientePDF(
            doc,
            paciente,
            cpf
        );


    let y =
        80;


    // ======================================
    // TÍTULO
    // ======================================

    doc.setFontSize(16);


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        'Atestado de Comparecimento',
        105,
        y,
        {
            align: 'center'
        }
    );


    // ======================================
    // TEXTO
    // ======================================

    y += 20;


    doc.setFontSize(12);


    doc.setFont(
        undefined,
        'normal'
    );


    const textoInicial =
        'Atesto, para os devidos fins, que o(a) paciente ';


    doc.text(
        textoInicial,
        20,
        y
    );


    const pacienteX =
        20 +
        doc.getTextWidth(
            textoInicial
        );


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        paciente,
        pacienteX,
        y
    );


    const virgulaX =
        pacienteX +
        doc.getTextWidth(
            paciente
        ) +
        2;


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        ',',
        virgulaX,
        y
    );


    // ======================================
    // HORÁRIO
    // ======================================

    y += 7;


    const textoPeriodo =
        'esteve em consulta odontológica nesta data, no período das ';


    doc.text(
        textoPeriodo,
        20,
        y
    );


    const entradaX =
        20 +
        doc.getTextWidth(
            textoPeriodo
        );


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        entrada,
        entradaX,
        y
    );


    const asX =
        entradaX +
        doc.getTextWidth(
            entrada
        ) +
        2;


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        ' às ',
        asX,
        y
    );


    const saidaX =
        asX +
        doc.getTextWidth(
            ' às '
        );


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        saida,
        saidaX,
        y
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        '.',
        saidaX +
        doc.getTextWidth(
            saida
        ) +
        2,
        y
    );


    // ======================================
    // FINAL
    // ======================================

    finalizarPDF(
        doc,
        inicioY,
        data,
        cid
    );


    doc.save(
        `Atestado_${paciente}.pdf`
    );

}


// ==========================================
// ATESTADO DE DIAS
// ==========================================

function gerarAtestadoDias() {

    const paciente =
        pacienteInput
            .value
            .trim();


    const cpf =
        cpfInput
            .value
            .trim();


    const data =
        dataInput.value;


    const entrada =
        entradaInput.value;


    const saida =
        saidaInput.value;


    const diasRepouso =
        diasRepousoInput.value;


    const cid =
        cidInput.value;


    // ======================================
    // VALIDAÇÃO
    // ======================================

    if (
        paciente === '' ||
        data === '' ||
        diasRepouso === ''
    ) {

        alert(
            'Por favor, preencha o paciente, a data e os dias de repouso.'
        );

        return;

    }


    if (
        entrada &&
        saida &&
        saida < entrada
    ) {

        alert(
            'O horário de saída não pode ser menor que o horário de chegada.'
        );

        return;

    }


    const diasFormatado =
        diasRepouso
            .toString()
            .padStart(
                2,
                '0'
            );


    const dataFormatada =
        formatarDataNumerica(
            data
        );


    // ======================================
    // DOCUMENTO
    // ======================================

    const doc =
        criarDocumentoBase();


    const inicioY =
        adicionarPacientePDF(
            doc,
            paciente,
            cpf
        );


    let y =
        80;


    // ======================================
    // TÍTULO
    // ======================================

    doc.setFontSize(16);


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        'Atestado Odontológico',
        105,
        y,
        {
            align: 'center'
        }
    );


    // ======================================
    // TEXTO
    // ======================================

    y += 20;


    doc.setFontSize(12);


    doc.setFont(
        undefined,
        'normal'
    );


    const textoInicial =
        'Atesto, para os devidos fins, que o(a) paciente ';


    doc.text(
        textoInicial,
        20,
        y
    );


    const pacienteX =
        20 +
        doc.getTextWidth(
            textoInicial
        );


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        paciente,
        pacienteX,
        y
    );


    const virgulaX =
        pacienteX +
        doc.getTextWidth(
            paciente
        ) +
        2;


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        ',',
        virgulaX,
        y
    );


    // ======================================
    // CONSULTA
    // ======================================

    y += 10;


    let textoConsulta =
        `esteve em consulta odontológica nesta data, ${dataFormatada}`;


    if (
        entrada &&
        saida
    ) {

        textoConsulta +=
            ` no período das ${entrada} às ${saida}`;

    }


    doc.text(
        textoConsulta,
        20,
        y
    );


    // ======================================
    // REPOUSO
    // ======================================

    y += 10;


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        'e deverá permanecer em repouso por',
        20,
        y
    );


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        `${diasFormatado} dias`,
        94,
        y
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        'a contar de hoje.',
        113,
        y
    );


    // ======================================
    // FINAL
    // ======================================

    finalizarPDF(
        doc,
        inicioY,
        data,
        cid
    );


    doc.save(
        `Atestado_${paciente}.pdf`
    );

}


// ==========================================
// FINALIZAÇÃO DO PDF
// ==========================================

function finalizarPDF(
    doc,
    inicioY,
    data,
    cid
) {


    // ======================================
    // CID
    // ======================================

    if (
        permiteCidInput.checked &&
        cid
    ) {

        doc.setFontSize(12);


        doc.setFont(
            undefined,
            'normal'
        );


        doc.text(
            `CID: ${cid}`,
            20,
            200
        );

    }


    // ======================================
    // CARIMBO
    // ======================================

    if (
        assinaturaInput.checked
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


    // ======================================
    // DATA POR EXTENSO
    // ======================================

    const dataExtenso =
        formatarDataExtenso(
            data
        );


    doc.setFontSize(12);


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        `São Paulo, ${dataExtenso}`,
        20,
        inicioY + 180
    );


    // ======================================
    // ASSINATURA
    // ======================================

    doc.setFontSize(9);


    doc.text(
        ass1,
        120,
        inicioY + 175
    );


    doc.text(
        ass2,
        120,
        inicioY + 180
    );


    doc.text(
        cnpj,
        120,
        inicioY + 185
    );


    // ======================================
    // RODAPÉ
    // ======================================

    doc.setFontSize(9);


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

}


// ==========================================
// AUTOCOMPLETE
// ==========================================

pacienteInput.addEventListener(
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


                            cpfInput.value =
                                formatarCPF(
                                    paciente.cpf || ''
                                );


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

        }

    }
);


// ==========================================
// FECHAR AUTOCOMPLETE
// ==========================================

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


// ==========================================
// INICIALIZAÇÃO
// ==========================================

preencherDataHoje();

atualizarTipoAtestado();

cidInput.disabled =
    !permiteCidInput.checked;


// ==========================================
// GLOBAL
// ==========================================

window.gerarAtestado =
    gerarAtestado;