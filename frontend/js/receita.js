// ==========================================
// RECEITUÁRIO
// SIMPLES / CONTROLADA
// ==========================================

console.log(
    'Receituário unificado carregado com sucesso!'
);


// ==========================================
// ELEMENTOS
// ==========================================

const pacienteInput =
    document.getElementById('paciente');


const cpfInput =
    document.getElementById('cpf');


const enderecoInput =
    document.getElementById('endereco');


const medicamentoInput =
    document.getElementById('medicamento');


const sugestoesDiv =
    document.getElementById('sugestoes');


const sugestoesMedDiv =
    document.getElementById('sugestoesMed');


const assinaturaInput =
    document.getElementById('assinatura');


const tituloReceita =
    document.getElementById('tituloReceita');


const cpfObrigatorio =
    document.getElementById('cpfObrigatorio');


const avisoControlada =
    document.getElementById('avisoControlada');


// ==========================================
// TIPO DA RECEITA
// ==========================================

function obterTipoReceita() {

    const selecionado =
        document.querySelector(
            'input[name="tipoReceita"]:checked'
        );


    if (!selecionado) {

        return 'simples';
    }


    return selecionado.value;
}


// ==========================================
// ATUALIZAR TELA
// ==========================================

function atualizarTipoReceita() {

    const tipo =
        obterTipoReceita();


    const controlada =
        tipo === 'controlada';


    // Título

    tituloReceita.textContent =
        controlada
            ? 'Receituário - Controlado'
            : 'Receituário - Simples';


    // CPF obrigatório apenas controlada

    cpfObrigatorio.hidden =
        !controlada;


    // Aviso das duas vias

    avisoControlada.hidden =
        !controlada;

}


// ==========================================
// EVENTO RADIO
// ==========================================

document
    .querySelectorAll(
        'input[name="tipoReceita"]'
    )
    .forEach(
        radio => {

            radio.addEventListener(
                'change',
                atualizarTipoReceita
            );

        }
    );


// ==========================================
// DATA POR EXTENSO
// ==========================================

function obterDataAtualExtenso() {

    const dataAtual =
        new Date();


    return dataAtual
        .toLocaleDateString(
            'pt-BR',
            {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }
        );

}


// ==========================================
// CPF
// ==========================================

function validarCpfReceita(cpf) {

    const numeros =
        String(cpf || '')
            .replace(
                /\D/g,
                ''
            );


    if (
        numeros.length !== 11
    ) {

        return false;
    }


    if (
        /^(\d)\1{10}$/
            .test(numeros)
    ) {

        return false;
    }


    let soma = 0;


    for (
        let i = 0;
        i < 9;
        i++
    ) {

        soma +=
            Number(numeros[i]) *
            (10 - i);
    }


    let digito =
        (soma * 10) % 11;


    if (digito === 10) {

        digito = 0;
    }


    if (
        digito !==
        Number(numeros[9])
    ) {

        return false;
    }


    soma = 0;


    for (
        let i = 0;
        i < 10;
        i++
    ) {

        soma +=
            Number(numeros[i]) *
            (11 - i);
    }


    digito =
        (soma * 10) % 11;


    if (digito === 10) {

        digito = 0;
    }


    return (
        digito ===
        Number(numeros[10])
    );
}


// ==========================================
// GERAR RECEITA
// ==========================================

function gerarReceita() {

    const tipo =
        obterTipoReceita();


    if (
        tipo === 'controlada'
    ) {

        gerarReceitaControlada();

        return;
    }


    gerarReceitaSimples();

}


// ==========================================
// LOGO
// ==========================================

function adicionarLogo(doc) {

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


    const larguraPagina =
        doc.internal
            .pageSize
            .getWidth();


    const posXLogo =
        (
            larguraPagina -
            larguraLogo
        ) /
        2;


    doc.addImage(
        logoBase64,
        'PNG',
        posXLogo,
        10,
        larguraLogo,
        alturaLogo
    );

}


// ==========================================
// IDENTIFICAÇÃO PROFISSIONAL
// ==========================================

function adicionarIdentificacaoProfissional(
    doc
) {

    const inicioY =
        45;


    doc.setDrawColor(
        220,
        216,
        209
    );


    doc.line(
        15,
        inicioY,
        195,
        inicioY
    );


    doc.setFontSize(
        10
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        `Dra. ${cinthia}`,
        20,
        inicioY + 6
    );


    doc.setFontSize(
        9
    );


    doc.text(
        `CRO-SP: ${cro}`,
        130,
        inicioY + 6
    );


    doc.setDrawColor(
        220,
        216,
        209
    );


    doc.line(
        15,
        inicioY + 11,
        195,
        inicioY + 11
    );


    return inicioY;
}


// ==========================================
// PACIENTE
// ==========================================

function adicionarPaciente(
    doc,
    paciente,
    cpf,
    enderecoPaciente
) {

    const inicioY =
        adicionarIdentificacaoProfissional(
            doc
        );


    const pacienteY =
        inicioY + 20;


    doc.setFontSize(
        11
    );


    // Paciente

    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        'Paciente:',
        20,
        pacienteY
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        paciente,
        42,
        pacienteY
    );


    // CPF

    if (cpf) {

        doc.setFont(
            undefined,
            'bold'
        );


        doc.text(
            'CPF:',
            130,
            pacienteY
        );


        doc.setFont(
            undefined,
            'normal'
        );


        doc.text(
            cpf,
            143,
            pacienteY
        );
    }


    // Endereço

    let enderecoLinhas =
        0;


    if (enderecoPaciente) {

        doc.setFontSize(
            11
        );


        doc.setFont(
            undefined,
            'bold'
        );


        doc.text(
            'Endereço:',
            20,
            pacienteY + 7
        );


        doc.setFontSize(
            10
        );


        doc.setFont(
            undefined,
            'normal'
        );


        const linhasEndereco =
            doc.splitTextToSize(
                enderecoPaciente,
                145
            );


        doc.text(
            linhasEndereco,
            42,
            pacienteY + 7
        );


        enderecoLinhas =
            linhasEndereco.length;
    }


    return {
        pacienteY,
        enderecoLinhas
    };
}


// ==========================================
// MEDICAMENTOS
// ==========================================

function adicionarMedicamentosPDF(
    doc,
    meds,
    yInicial,
    limiteY
) {

    let y =
        yInicial;


    doc.setFont(
        undefined,
        'normal'
    );


    doc.setFontSize(
        11
    );


    meds.forEach(
        m => {


            const item =
                typeof m === 'string'
                    ? {
                        texto: m,
                        obs: ''
                    }
                    : m;


            const partes =
                (
                    item.texto ||
                    ''
                )
                    .split('—');


            const medicamentoTxt =
                (
                    partes[0] ||
                    ''
                )
                    .trim();


            const posologiaTxt =
                (
                    partes[1] ||
                    ''
                )
                    .trim();


            // Medicamento

            const linhasMed =
                doc.splitTextToSize(
                    `- ${medicamentoTxt}`,
                    170
                );


            if (
                y +
                (
                    linhasMed.length *
                    6
                ) >
                limiteY
            ) {

                doc.addPage();

                y = 25;
            }


            doc.setFontSize(
                11
            );


            doc.setFont(
                undefined,
                'normal'
            );


            doc.text(
                linhasMed,
                20,
                y
            );


            y +=
                linhasMed.length *
                6;


            // Posologia

            if (
                posologiaTxt
            ) {

                const linhasPos =
                    doc.splitTextToSize(
                        posologiaTxt,
                        165
                    );


                if (
                    y +
                    (
                        linhasPos.length *
                        6
                    ) >
                    limiteY
                ) {

                    doc.addPage();

                    y = 25;
                }


                doc.text(
                    linhasPos,
                    28,
                    y
                );


                y +=
                    linhasPos.length *
                    6;
            }


            // Observação

            if (
                item.obs
            ) {

                doc.setFontSize(
                    10
                );


                const linhasObs =
                    doc.splitTextToSize(
                        `Obs: ${item.obs}`,
                        165
                    );


                if (
                    y +
                    (
                        linhasObs.length *
                        6
                    ) >
                    limiteY
                ) {

                    doc.addPage();

                    y = 25;
                }


                doc.text(
                    linhasObs,
                    28,
                    y
                );


                y +=
                    linhasObs.length *
                    6;


                doc.setFontSize(
                    11
                );
            }


            y += 2;

        }
    );


    return y;
}


// ==========================================
// RECEITA SIMPLES
// ==========================================

function gerarReceitaSimples() {

    const { jsPDF } =
        window.jspdf;


    const paciente =
        pacienteInput
            .value
            .trim();


    const cpf =
        cpfInput
            .value
            .trim();


    const enderecoPaciente =
        enderecoInput
            ?.value
            .trim() ||
        '';


    const meds =
        window.medicamentos ||
        [];


    if (
        !paciente ||
        meds.length === 0
    ) {

        alert(
            'Preencha nome e pelo menos um medicamento!'
        );

        return;
    }


    const doc =
        new jsPDF();


    adicionarLogo(
        doc
    );


    const dados =
        adicionarPaciente(
            doc,
            paciente,
            cpf,
            enderecoPaciente
        );


    // ======================================
    // TÍTULO
    // ======================================

    const prescricaoY =
        enderecoPaciente
            ? dados.pacienteY +
              21 +
              Math.max(
                  0,
                  (
                      dados.enderecoLinhas -
                      1
                  ) *
                  4
              )
            : dados.pacienteY +
              17;


    doc.setFontSize(
        14
    );


    doc.setFont(
        undefined,
        'bold'
    );


    doc.text(
        'Prescrição',
        105,
        prescricaoY,
        {
            align: 'center'
        }
    );


    adicionarMedicamentosPDF(
        doc,
        meds,
        prescricaoY + 10,
        215
    );


    // ======================================
    // DATA
    // ======================================

    const dataFormatada =
        obterDataAtualExtenso();


    doc.setFontSize(
        10
    );


    doc.setFont(
        undefined,
        'normal'
    );


    doc.text(
        `São Paulo, ${dataFormatada}`,
        20,
        245
    );


    // ======================================
    // ASSINATURA
    // ======================================

    doc.setFontSize(
        9
    );


    doc.text(
        ass1,
        120,
        240
    );


    doc.text(
        ass2,
        120,
        245
    );


    doc.text(
        cnpj,
        120,
        250
    );


    // ======================================
    // CARIMBO
    // ======================================

    if (
        assinaturaInput &&
        assinaturaInput.checked
    ) {

        doc.addImage(
            carimbo,
            'PNG',
            135,
            205,//AQUI
            38,
            38
        );
    }


    // ======================================
    // RODAPÉ
    // ======================================

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
        `Receita_${paciente}.pdf`
    );
}


// ==========================================
// RECEITA CONTROLADA
// ==========================================

function gerarReceitaControlada() {

    const { jsPDF } =
        window.jspdf;


    const paciente =
        pacienteInput
            .value
            .trim();


    const cpf =
        cpfInput
            .value
            .trim();


    const enderecoPaciente =
        enderecoInput
            ?.value
            .trim() ||
        '';


    const meds =
        window.medicamentos ||
        [];


    // CPF obrigatório

    if (
        !cpf
    ) {

        alert(
            'Informe o CPF do paciente para a receita controlada.'
        );

        cpfInput.focus();

        return;
    }


    if (
        !validarCpfReceita(
            cpf
        )
    ) {

        alert(
            'CPF inválido. Por favor, verifique o número digitado.'
        );

        return;
    }


    if (
        !paciente ||
        meds.length === 0
    ) {

        alert(
            'Preencha nome, CPF e pelo menos um medicamento!'
        );

        return;
    }


    const doc =
        new jsPDF();


    const dataFormatada =
        obterDataAtualExtenso();


    // ======================================
    // DUAS VIAS
    // ======================================

    for (
        let via = 1;
        via <= 2;
        via++
    ) {


        if (
            via > 1
        ) {

            doc.addPage();
        }


        adicionarLogo(
            doc
        );


        // Via

        doc.setFontSize(
            10
        );


        doc.setFont(
            undefined,
            'bold'
        );


        doc.text(
            `${via}ª VIA`,
            180,
            20
        );


        const dados =
            adicionarPaciente(
                doc,
                paciente,
                cpf,
                enderecoPaciente
            );


        // ==================================
        // PRESCRIÇÃO
        // ==================================

        const prescricaoY =
            dados.pacienteY +
            21;


        doc.setFontSize(
            14
        );


        doc.setFont(
            undefined,
            'bold'
        );


        doc.text(
            'Prescrição',
            105,
            prescricaoY,
            {
                align: 'center'
            }
        );


        adicionarMedicamentosPDF(
            doc,
            meds,
            prescricaoY + 10,
            220
        );


        // ==================================
        // COMPRADOR
        // ==================================

        const quadroY =
            232;


        doc.rect(
            14,
            quadroY,
            90,
            40
        );


        doc.setFontSize(
            12
        );


        doc.setFont(
            undefined,
            'bold'
        );


        doc.text(
            'IDENTIFICAÇÃO DO COMPRADOR',
            18,
            quadroY + 7
        );


        doc.setFontSize(
            10
        );


        doc.setFont(
            undefined,
            'normal'
        );


        doc.text(
            "Nome:_____________________________________\n" +
            "Identidade:______________ Org. Emissor: _______\n" +
            "Endereço:__________________________________\n" +
            "Cidade:_____________________________UF:____\n" +
            "Telefone: (___)_______________",
            18,
            quadroY + 15
        );


        // ==================================
        // FORNECEDOR
        // ==================================

        doc.rect(
            108,
            quadroY,
            85,
            40
        );


        doc.setFontSize(
            12
        );


        doc.setFont(
            undefined,
            'bold'
        );


        doc.text(
            'IDENTIFICAÇÃO DO FORNECEDOR',
            112,
            quadroY + 7
        );


        doc.setFontSize(
            10
        );


        doc.setFont(
            undefined,
            'normal'
        );


        doc.text(
            "\n\n\n\n" +
            "Assinatura: ______________________\n" +
            "Data:__/__/_____",
            112,
            quadroY + 15
        );


        // ==================================
        // CARIMBO
        // ==================================

        if (
            assinaturaInput &&
            assinaturaInput.checked
        ) {

            doc.addImage(
                carimbo,
                'PNG',
                135,
                185,
                38,
                38
            );
        }


        // ==================================
        // DATA
        // ==================================

        doc.setFontSize(
            10
        );


        doc.setFont(
            undefined,
            'normal'
        );


        doc.text(
            `São Paulo, ${dataFormatada}`,
            20,
            225
        );


        // ==================================
        // ASSINATURA
        // ==================================

        doc.setFontSize(
            9
        );


        doc.text(
            ass1,
            120,
            220
        );


        doc.text(
            ass2,
            120,
            225
        );


        doc.text(
            cnpj,
            120,
            230
        );


        // ==================================
        // RODAPÉ
        // ==================================

        doc.setFontSize(
            9
        );


        doc.text(
            endereco,
            50,
            277
        );


        doc.text(
            telefone,
            80,
            282
        );

    }


    doc.save(
        `Receita_${paciente}.pdf`
    );
}


// ==========================================
// AUTOCOMPLETE PACIENTES
// ==========================================

pacienteInput?.addEventListener(
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


                            enderecoInput.value =
                                '';


                            if (
                                p.endereco &&
                                typeof p.endereco ===
                                'object'
                            ) {

                                const e =
                                    p.endereco;


                                const enderecoFormatado =
                                    `${e.rua || ''}, ` +
                                    `${e.numero || ''} - ` +
                                    `${e.bairro || ''} - ` +
                                    `${e.cep || ''}` +
                                    `${
                                        e.cidade
                                            ? `, ${e.cidade}`
                                            : ''
                                    }` +
                                    `${
                                        e.estado
                                            ? ` - ${e.estado}`
                                            : ''
                                    }`;


                                enderecoInput.value =
                                    enderecoFormatado
                                        .trim();
                            }


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


// ==========================================
// AUTOCOMPLETE MEDICAMENTOS
// ==========================================

medicamentoInput?.addEventListener(
    'input',
    async () => {


        const termo =
            medicamentoInput
                .value
                .trim();


        if (
            termo.length < 2
        ) {

            sugestoesMedDiv.innerHTML =
                '';

            return;
        }


        try {


            const response =
                await fetch(
                    `http://localhost:3000/api/medicamentos?nome=${encodeURIComponent(termo)}`
                );


            const medsAPI =
                await response.json();


            sugestoesMedDiv.innerHTML =
                '';


            medsAPI.forEach(
                med => {


                    const sugestao =
                        document.createElement(
                            'div'
                        );


                    const descricao =
                        med.mg
                            ? `${med.nome} ------------------------------------- ${med.mg}`
                            : med.nome;


                    sugestao.textContent =
                        descricao;


                    sugestao.addEventListener(
                        'click',
                        () => {


                            medicamentoInput.value =
                                descricao;


                            sugestoesMedDiv.innerHTML =
                                '';

                        }
                    );


                    sugestoesMedDiv.appendChild(
                        sugestao
                    );

                }
            );


        } catch (
            error
        ) {


            console.error(
                'Erro ao buscar medicamentos:',
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
            pacienteInput &&
            event.target !==
            pacienteInput
        ) {

            sugestoesDiv.innerHTML =
                '';
        }


        if (
            medicamentoInput &&
            event.target !==
            medicamentoInput
        ) {

            sugestoesMedDiv.innerHTML =
                '';
        }

    }
);


// ==========================================
// PREENCHER HORAS
// ==========================================

function preencherHoras() {

    const intervaloSelect =
        document.getElementById(
            'intervalo'
        );


    const horasSelect =
        document.getElementById(
            'horas'
        );


    if (
        !intervaloSelect ||
        !horasSelect
    ) {

        return;
    }


    horasSelect.innerHTML =
        '';


    for (
        let i = 0;
        i <
        intervaloSelect.options.length;
        i++
    ) {


        const option =
            intervaloSelect.options[i];


        const newOption =
            document.createElement(
                'option'
            );


        newOption.value =
            option.value;


        newOption.text =
            option.text;


        horasSelect.appendChild(
            newOption
        );

    }


    horasSelect.value =
        intervaloSelect.value;

}


// ==========================================
// INTERVALO
// ==========================================

document
    .getElementById(
        'intervalo'
    )
    ?.addEventListener(
        'change',
        () => {


            const intervalo =
                document.getElementById(
                    'intervalo'
                );


            const horas =
                document.getElementById(
                    'horas'
                );


            if (
                intervalo &&
                horas
            ) {

                horas.value =
                    intervalo.value;

            }

        }
    );


// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    () => {


        preencherHoras();


        atualizarTipoReceita();

    }
);


// ==========================================
// FUNÇÃO GLOBAL
// ==========================================

window.gerarReceita =
    gerarReceita;