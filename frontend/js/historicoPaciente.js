// ======================================================
// HISTÓRICO DO PACIENTE
// ======================================================

const params = new URLSearchParams(window.location.search);
const cpf = params.get('cpf');

const cpfPaciente =
    document.getElementById('cpfPaciente');

const dataHistorico =
    document.getElementById('dataHistorico');

const procedimentoInput =
    document.getElementById('procedimentoHistorico');

const listaProcedimentos =
    document.getElementById('listaProcedimentos');

const observacaoHistorico =
    document.getElementById('observacaoHistorico');

const btnSalvarHistorico =
    document.getElementById('btnSalvarHistorico');

const btnLimparHistorico =
    document.getElementById('btnLimparHistorico');

const bodyHistorico =
    document.getElementById('bodyHistorico');


// ======================================================
// VARIÁVEIS
// ======================================================

let procedimentos = [];

let procedimentosSelecionados = [];


// ======================================================
// INICIAR
// ======================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        cpfPaciente.textContent =
            `CPF: ${cpf || 'Não informado'}`;

        preencherDataHoje();

        carregarProcedimentos();

        criarAreaProcedimentosSelecionados();

    }
);


// ======================================================
// DATA DE HOJE
// ======================================================

function preencherDataHoje() {

    const hoje = new Date();

    const ano =
        hoje.getFullYear();

    const mes =
        String(
            hoje.getMonth() + 1
        ).padStart(2, '0');

    const dia =
        String(
            hoje.getDate()
        ).padStart(2, '0');


    dataHistorico.value =
        `${ano}-${mes}-${dia}`;
}


// ======================================================
// CARREGAR PROCEDIMENTOS
// ======================================================

async function carregarProcedimentos() {

    try {

        const response =
            await fetch(
                'http://localhost:3000/api/procedimentos/listar'
            );


        if (!response.ok) {

            throw new Error(
                'Erro ao carregar procedimentos'
            );

        }


        const dados =
            await response.json();


        if (!Array.isArray(dados)) {

            procedimentos = [];

            console.error(
                'Resposta inválida ao carregar procedimentos:',
                dados
            );

            return;

        }


        procedimentos = dados;


        console.log(
            `${procedimentos.length} procedimentos carregados`
        );


    } catch (erro) {

        console.error(
            'Erro ao carregar procedimentos:',
            erro
        );


        procedimentos = [];

    }

}


// ======================================================
// CRIAR ÁREA DOS PROCEDIMENTOS SELECIONADOS
// ======================================================

function criarAreaProcedimentosSelecionados() {

    if (
        document.getElementById(
            'procedimentosSelecionados'
        )
    ) {
        return;
    }


    const area =
        document.createElement('div');


    area.id =
        'procedimentosSelecionados';


    area.className =
        'procedimentos-selecionados';


    const campoProcedimento =
        procedimentoInput.closest(
            '.campo-procedimento'
        );


    campoProcedimento.appendChild(area);

}


// ======================================================
// AUTOCOMPLETE
// ======================================================

procedimentoInput.addEventListener(
    'input',
    () => {

        const texto =
            procedimentoInput.value
                .trim()
                .toLowerCase();


        if (texto.length < 2) {

            fecharAutocomplete();

            return;

        }


        const encontrados =
            procedimentos
                .filter(procedimento => {

                    const nome =
                        String(
                            procedimento.nome || ''
                        ).toLowerCase();


                    return nome.includes(texto);

                })
                .filter(procedimento => {

                    return !procedimentosSelecionados
                        .some(
                            selecionado =>
                                String(selecionado._id) ===
                                String(procedimento._id)
                        );

                })
                .slice(0, 20);


        montarListaAutocomplete(
            encontrados
        );

    }
);


// ======================================================
// MONTAR AUTOCOMPLETE
// ======================================================

function montarListaAutocomplete(lista) {

    listaProcedimentos.innerHTML = '';


    if (lista.length === 0) {

        listaProcedimentos.innerHTML = `
      <div class="autocomplete-vazio">
        Nenhum procedimento encontrado.
      </div>
    `;


        listaProcedimentos
            .classList
            .add('ativo');


        return;

    }


    lista.forEach(
        procedimento => {

            const item =
                document.createElement('div');


            item.className =
                'autocomplete-item';


            const nome =
                procedimento.nome || 'Procedimento';


            const tipo =
                procedimento.tipo || '';


            const dente =
                procedimento.dente || '';


            item.innerHTML = `
        <strong>
          ${escaparHtml(nome)}
        </strong>

        ${tipo || dente
                    ? `
              <div
                style="
                  margin-top: 2px;
                  font-size: 11px;
                  color: #777;
                "
              >
                ${tipo
                        ? escaparHtml(tipo)
                        : ''
                    }

                ${tipo && dente
                        ? ' • '
                        : ''
                    }

                ${dente
                        ? `Dente ${escaparHtml(dente)}`
                        : ''
                    }
              </div>
            `
                    : ''
                }
      `;


            item.addEventListener(
                'click',
                () => {

                    adicionarProcedimento(
                        procedimento
                    );

                }
            );


            listaProcedimentos
                .appendChild(item);

        }
    );


    listaProcedimentos
        .classList
        .add('ativo');

}


// ======================================================
// ADICIONAR PROCEDIMENTO
// ======================================================

function adicionarProcedimento(
    procedimento
) {

    const jaExiste =
        procedimentosSelecionados
            .some(
                item =>
                    String(item._id) ===
                    String(procedimento._id)
            );


    if (jaExiste) {

        procedimentoInput.value = '';

        fecharAutocomplete();

        return;

    }


    procedimentosSelecionados.push({
        _id:
            procedimento._id,

        nome:
            procedimento.nome,

        tipo:
            procedimento.tipo || '',

        dente:
            procedimento.dente || ''
    });


    procedimentoInput.value = '';


    fecharAutocomplete();


    renderizarProcedimentosSelecionados();


    procedimentoInput.focus();

}


// ======================================================
// RENDERIZAR PROCEDIMENTOS SELECIONADOS
// ======================================================

function renderizarProcedimentosSelecionados() {

    const area =
        document.getElementById(
            'procedimentosSelecionados'
        );


    if (!area) {
        return;
    }


    if (
        procedimentosSelecionados.length === 0
    ) {

        area.innerHTML = '';

        area.style.display = 'none';

        return;

    }


    area.style.display = 'flex';


    area.innerHTML =
        procedimentosSelecionados
            .map(
                procedimento => {

                    return `
            <div class="procedimento-tag">

              <span>
                ${escaparHtml(
                        procedimento.nome
                    )}
              </span>

              <button
                type="button"
                class="remover-procedimento"
                onclick="removerProcedimento(
                  '${procedimento._id}'
                )"
                title="Remover procedimento"
              >
                ×
              </button>

            </div>
          `;

                }
            )
            .join('');

}


// ======================================================
// REMOVER PROCEDIMENTO
// ======================================================

function removerProcedimento(id) {

    procedimentosSelecionados =
        procedimentosSelecionados
            .filter(
                procedimento =>
                    String(procedimento._id) !==
                    String(id)
            );


    renderizarProcedimentosSelecionados();

}


// ======================================================
// FECHAR AUTOCOMPLETE
// ======================================================

function fecharAutocomplete() {

    listaProcedimentos.innerHTML = '';

    listaProcedimentos
        .classList
        .remove('ativo');

}


document.addEventListener(
    'click',
    event => {

        if (
            !event.target.closest(
                '.autocomplete-wrap'
            )
        ) {

            fecharAutocomplete();

        }

    }
);


// ======================================================
// SALVAR
// ======================================================

btnSalvarHistorico.addEventListener(
    'click',
    async () => {

        if (!cpf) {

            alert(
                'CPF do paciente não informado.'
            );

            return;

        }


        if (!dataHistorico.value) {

            alert(
                'Informe a data do atendimento.'
            );

            dataHistorico.focus();

            return;

        }


        if (
            procedimentosSelecionados.length === 0
        ) {

            alert(
                'Selecione pelo menos um procedimento.'
            );

            procedimentoInput.focus();

            return;

        }


        const observacao =
            observacaoHistorico.value.trim();


        if (!observacao) {

            alert(
                'Digite a observação do atendimento.'
            );

            observacaoHistorico.focus();

            return;

        }


        // ================================================
        // PAYLOAD
        // ================================================

        const payload = {

            cpf,

            data:
                dataHistorico.value,

            procedimentos:
                procedimentosSelecionados.map(
                    procedimento => ({
                        procedimentoId:
                            procedimento._id,

                        nomeProcedimento:
                            procedimento.nome
                    })
                ),

            observacao

        };


        console.log(
            'Histórico que será salvo:',
            payload
        );


        // ================================================
        // SALVAR NO BACKEND
        // ================================================

        try {

            btnSalvarHistorico.disabled = true;

            btnSalvarHistorico.textContent =
                'Salvando...';


            const response =
                await fetch(
                    'http://localhost:3000/api/historico',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify(payload)
                    }
                );


            const resultado =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    resultado.erro ||
                    resultado.error ||
                    'Erro ao salvar histórico'
                );

            }


            alert(
                'Atendimento registrado com sucesso!'
            );


            limparFormulario();


            // Quando ligarmos a listagem,
            // ela será atualizada aqui.
            carregarHistorico();


        } catch (erro) {

            console.error(
                'Erro ao salvar histórico:',
                erro
            );


            alert(
                erro.message ||
                'Não foi possível salvar o atendimento.'
            );


        } finally {

            btnSalvarHistorico.disabled = false;

            btnSalvarHistorico.textContent =
                'Salvar';

        }

    }
);


// ======================================================
// LIMPAR
// ======================================================

if (btnLimparHistorico) {

    btnLimparHistorico.addEventListener(
        'click',
        () => {

            limparFormulario();

        }
    );

}


function limparFormulario() {

    procedimentosSelecionados = [];


    procedimentoInput.value = '';


    observacaoHistorico.value = '';


    renderizarProcedimentosSelecionados();


    fecharAutocomplete();


    preencherDataHoje();


    procedimentoInput.focus();

}


// ======================================================
// CARREGAR HISTÓRICO
// ======================================================

async function carregarHistorico() {

    if (!bodyHistorico) {
        return;
    }


    if (!cpf) {

        bodyHistorico.innerHTML = `
      <tr>
        <td
          colspan="4"
          class="sem-registros"
        >
          CPF não informado.
        </td>
      </tr>
    `;

        return;

    }


    try {

        const response =
            await fetch(
                `http://localhost:3000/api/historico/${cpf}`
            );


        if (!response.ok) {

            throw new Error(
                'Erro ao carregar histórico'
            );

        }


        const historico =
            await response.json();


        if (
            !Array.isArray(historico) ||
            historico.length === 0
        ) {

            bodyHistorico.innerHTML = `
        <tr>
          <td
            colspan="4"
            class="sem-registros"
          >
            Nenhum atendimento registrado.
          </td>
        </tr>
      `;

            return;

        }


        bodyHistorico.innerHTML = '';


        historico.forEach(
            registro => {

                const tr =
                    document.createElement('tr');


                const nomesProcedimentos =
                    Array.isArray(
                        registro.procedimentos
                    )
                        ? registro.procedimentos
                            .map(
                                procedimento =>
                                    escaparHtml(
                                        procedimento.nomeProcedimento
                                    )
                            )
                            .join('<br>')
                        : '-';


                tr.innerHTML = `

          <td>
            ${formatarData(
                    registro.data
                )}
          </td>

          <td>
            <div class="lista-procedimentos-historico">
              ${nomesProcedimentos}
            </div>
          </td>

          <td>
            <div
              class="observacao-resumo"
              title="${escaparHtml(
                    registro.observacao
                )}"
            >
              ${escaparHtml(
                    registro.observacao
                )}
            </div>
          </td>

          <td>

            <div class="acoes">

              <button
                type="button"
                class="btn-acao btn-ver"
                onclick="verHistorico(
                  '${registro._id}'
                )"
                title="Visualizar"
              >
                👁
              </button>

              <button
                type="button"
                class="btn-acao btn-whatsapp"
                onclick="enviarWhatsApp(
                  '${registro._id}'
                )"
                title="Enviar mensagem"
              >
                💬
              </button>

              <button
  type="button"
  class="btn-acao btn-excluir"
  onclick="excluirHistorico(
    '${registro._id}'
  )"
  title="Excluir atendimento"
>
  🗑️
</button>

            </div>

          </td>
        `;


                bodyHistorico.appendChild(
                    tr
                );

            }
        );


    } catch (erro) {

        console.error(
            'Erro ao carregar histórico:',
            erro
        );


        bodyHistorico.innerHTML = `
      <tr>

        <td
          colspan="4"
          class="sem-registros"
        >
          Erro ao carregar histórico.
        </td>

      </tr>
    `;

    }

}


// ======================================================
// VISUALIZAR
// ======================================================

// ======================================================
// VISUALIZAR ATENDIMENTO
// ======================================================

async function verHistorico(id) {

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/historico/detalhe/${id}`
            );


        if (!response.ok) {

            throw new Error(
                'Erro ao buscar atendimento'
            );

        }


        const registro =
            await response.json();


        abrirModalHistorico(
            registro
        );


    } catch (erro) {

        console.error(
            'Erro ao visualizar atendimento:',
            erro
        );


        alert(
            'Não foi possível abrir o atendimento.'
        );

    }

}


// ======================================================
// MODAL DO ATENDIMENTO
// ======================================================

function abrirModalHistorico(registro) {

    fecharModalHistorico();


    const procedimentos =
        Array.isArray(registro.procedimentos)
            ? registro.procedimentos
            : [];


    const procedimentosHtml =
        procedimentos.length
            ? procedimentos
                .map(
                    procedimento => `
              <div
                style="
                  display: inline-flex;
                  align-items: center;

                  margin:
                    0 5px 6px 0;

                  padding:
                    6px 10px;

                  background:
                    #edf3ff;

                  border:
                    1px solid #c7d6f5;

                  border-radius:
                    999px;

                  color:
                    #173ea5;

                  font-size:
                    12px;

                  font-weight:
                    700;
                "
              >
                ${escaparHtml(
                        procedimento.nomeProcedimento
                    )}
              </div>
            `
                )
                .join('')
            : '-';


    const overlay =
        document.createElement('div');


    overlay.className =
        'modal-overlay';


    overlay.id =
        'modalHistoricoOverlay';


    overlay.innerHTML = `

    <div class="modal-historico">

      <!-- CABEÇALHO -->

      <div class="modal-historico-header">

        <div>

          <h3>
            Atendimento
          </h3>

          <div
            style="
              margin-top: 3px;
              font-size: 12px;
              color: #777;
            "
          >
            ${formatarData(
        registro.data
    )}
          </div>

        </div>


        <button
          type="button"
          class="modal-fechar"
          onclick="fecharModalHistorico()"
        >
          ×
        </button>

      </div>


      <!-- CONTEÚDO -->

      <div class="modal-historico-body">

        <div class="modal-campo">

          <div class="modal-label">
            Procedimentos realizados
          </div>

          <div
            class="modal-valor"
            style="
              margin-top: 7px;
            "
          >
            ${procedimentosHtml}
          </div>

        </div>


        <div class="modal-campo">

          <div class="modal-label">
            Evolução / Observação
          </div>

          <div
            class="modal-valor"
            style="
              margin-top: 7px;

              padding:
                12px 14px;

              background:
                #faf9f7;

              border:
                1px solid #e7dfd2;

              border-radius:
                8px;

              white-space:
                pre-wrap;
            "
          >
            ${escaparHtml(
        registro.observacao || '-'
    )}
          </div>

        </div>


        <div
          style="
            display: flex;
            justify-content: flex-end;

            gap: 8px;

            margin-top: 20px;
          "
        >

          <button
            type="button"
            class="btn-acao btn-whatsapp"
            onclick="enviarWhatsApp('${registro._id}')"
          >
            💬 Enviar mensagem
          </button>

          <button
            type="button"
            class="btn-acao btn-ver"
            onclick="fecharModalHistorico()"
          >
            Fechar
          </button>

        </div>

      </div>

    </div>
  `;


    document.body.appendChild(
        overlay
    );


    overlay.addEventListener(
        'click',
        event => {

            if (
                event.target === overlay
            ) {

                fecharModalHistorico();

            }

        }
    );

}


// ======================================================
// FECHAR MODAL
// ======================================================

function fecharModalHistorico() {

    const modal =
        document.getElementById(
            'modalHistoricoOverlay'
        );


    if (modal) {

        modal.remove();

    }

}


// ======================================================
// WHATSAPP
// ======================================================

async function enviarWhatsApp(id) {

    try {

        // --------------------------------------------------
        // BUSCAR ATENDIMENTO
        // --------------------------------------------------

        const responseHistorico =
            await fetch(
                `http://localhost:3000/api/historico/detalhe/${id}`
            );


        if (!responseHistorico.ok) {

            throw new Error(
                'Erro ao buscar atendimento'
            );

        }


        const registro =
            await responseHistorico.json();


        // --------------------------------------------------
        // BUSCAR PACIENTE
        // --------------------------------------------------

        const responsePaciente =
            await fetch(
                `http://localhost:3000/api/pacientes/cpf/${cpf}`
            );


        if (!responsePaciente.ok) {

            throw new Error(
                'Não foi possível localizar os dados do paciente.'
            );

        }


        const paciente =
            await responsePaciente.json();


        // --------------------------------------------------
        // TELEFONE
        // --------------------------------------------------

        const telefoneOriginal =
            paciente.telefone ||
            paciente.celular ||
            paciente.whatsapp ||
            '';


        let telefone =
            String(telefoneOriginal)
                .replace(/\D/g, '');


        if (!telefone) {

            alert(
                'Este paciente não possui telefone cadastrado.'
            );

            return;

        }


        // Se estiver salvo sem código do Brasil
        if (
            telefone.length === 10 ||
            telefone.length === 11
        ) {

            telefone =
                `55${telefone}`;

        }


        // --------------------------------------------------
        // NOME DO PACIENTE
        // --------------------------------------------------

        const nomePaciente =
            paciente.nome ||
            paciente.nomeCompleto ||
            'Paciente';


        const primeiroNome =
            String(nomePaciente)
                .trim()
                .split(' ')[0];


        // --------------------------------------------------
        // PROCEDIMENTOS
        // --------------------------------------------------

        const procedimentos =
            Array.isArray(
                registro.procedimentos
            )
                ? registro.procedimentos
                : [];


        const listaProcedimentos =
            procedimentos
                .map(
                    procedimento =>
                        `• ${procedimento.nomeProcedimento}`
                )
                .join('\n');


        // --------------------------------------------------
        // MENSAGEM
        // --------------------------------------------------

        const mensagem =

            `Olá, ${primeiroNome}! 😊

Segue um resumo do seu atendimento de hoje com a Dra. Cinthia Leone:

${listaProcedimentos}

Observações do atendimento:
${registro.observacao}

Qualquer dúvida, estamos à disposição. 😊

Dra. Cinthia Leone`;


        // --------------------------------------------------
        // ABRIR WHATSAPP
        // --------------------------------------------------

        const url =
            `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;


        window.open(
            url,
            '_blank'
        );


    } catch (erro) {

        console.error(
            'Erro ao enviar mensagem:',
            erro
        );


        alert(
            erro.message ||
            'Não foi possível preparar a mensagem.'
        );

    }

}

// ======================================================
// EXCLUIR ATENDIMENTO
// ======================================================

async function excluirHistorico(id) {

    const confirmar = confirm(
        'Deseja realmente excluir este atendimento do histórico?'
    );

    if (!confirmar) {
        return;
    }


    try {

        const response =
            await fetch(
                `http://localhost:3000/api/historico/${id}`,
                {
                    method: 'DELETE'
                }
            );


        const resultado =
            await response.json();


        if (!response.ok) {

            throw new Error(
                resultado.erro ||
                'Erro ao excluir atendimento'
            );

        }


        await carregarHistorico();


    } catch (erro) {

        console.error(
            'Erro ao excluir atendimento:',
            erro
        );


        alert(
            'Não foi possível excluir o atendimento.'
        );

    }

}

// ======================================================
// FORMATAR DATA
// ======================================================

function formatarData(data) {

    if (!data) {
        return '-';
    }


    const dt =
        new Date(data);


    if (
        Number.isNaN(
            dt.getTime()
        )
    ) {

        return '-';

    }


    return dt.toLocaleDateString(
        'pt-BR',
        {
            timeZone: 'UTC'
        }
    );

}


// ======================================================
// SEGURANÇA HTML
// ======================================================

function escaparHtml(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return '';

    }


    return String(valor)

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


// ======================================================
// CARREGAR HISTÓRICO AO ABRIR
// ======================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        carregarHistorico();

    }
);