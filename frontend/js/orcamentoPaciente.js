// orcamentoPaciente.js

const params = new URLSearchParams(window.location.search);
const cpf = params.get('cpf');

const cpfPacienteEl = document.getElementById('cpfPaciente');
const bodyOrcamentos = document.getElementById('bodyOrcamentos');

const totalOrcamentosEl =
  document.getElementById('totalOrcamentos');

const ultimoOrcamentoEl =
  document.getElementById('ultimoOrcamento');

const valorTotalOrcamentosEl =
  document.getElementById('valorTotalOrcamentos');


cpfPacienteEl.textContent =
  `CPF: ${cpf || 'não informado'}`;


// ======================================================
// FORMATAÇÕES
// ======================================================

function formatarData(data) {
  if (!data) return '-';

  const dt = new Date(data);

  if (isNaN(dt.getTime())) {
    return '-';
  }

  return dt.toLocaleDateString('pt-BR');
}


function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL'
    }
  );
}


function escaparHtml(valor) {
  if (valor === null || valor === undefined) {
    return '';
  }

  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


// ======================================================
// STATUS
// ======================================================

function obterStatus(status) {

  const valor =
    String(status || 'gerado')
      .toLowerCase();

  switch (valor) {

    case 'aprovado':
      return {
        texto: 'Aprovado',
        classe: 'status-aprovado'
      };

    case 'concluido':
    case 'concluído':
      return {
        texto: 'Concluído',
        classe: 'status-concluido'
      };

    case 'cancelado':
      return {
        texto: 'Cancelado',
        classe: 'status-cancelado'
      };

    case 'gerado':
    case 'pendente':
    default:
      return {
        texto: 'Gerado',
        classe: 'status-pendente'
      };
  }
}


// ======================================================
// CARREGAR ORÇAMENTOS
// ======================================================

async function carregarOrcamentos() {

  if (!cpf) {

    bodyOrcamentos.innerHTML = `
      <tr>
        <td colspan="5" class="sem-registros">
          CPF não informado.
        </td>
      </tr>
    `;

    return;
  }


  try {

    const response =
      await fetch(
        `http://localhost:3000/api/orcamentos/${cpf}`
      );


    if (!response.ok) {
      throw new Error(
        'Erro ao buscar orçamentos'
      );
    }


    const orcamentos =
      await response.json();


    if (
      !Array.isArray(orcamentos) ||
      orcamentos.length === 0
    ) {

      bodyOrcamentos.innerHTML = `
        <tr>
          <td colspan="5" class="sem-registros">
            Nenhum orçamento encontrado para este paciente.
          </td>
        </tr>
      `;


      if (totalOrcamentosEl) {
        totalOrcamentosEl.textContent = '0';
      }

      if (ultimoOrcamentoEl) {
        ultimoOrcamentoEl.textContent = '-';
      }

      if (valorTotalOrcamentosEl) {
        valorTotalOrcamentosEl.textContent =
          formatarMoeda(0);
      }

      return;
    }


    // ==================================================
    // RESUMO
    // ==================================================

    if (totalOrcamentosEl) {
      totalOrcamentosEl.textContent =
        orcamentos.length;
    }


    if (ultimoOrcamentoEl) {
      ultimoOrcamentoEl.textContent =
        formatarData(
          orcamentos[0].data
        );
    }


    const somaTotal =
      orcamentos.reduce(
        (total, orcamento) => {

          return total +
            Number(
              orcamento.total || 0
            );

        },
        0
      );


    if (valorTotalOrcamentosEl) {

      valorTotalOrcamentosEl.textContent =
        formatarMoeda(somaTotal);
    }


    // ==================================================
    // TABELA
    // ==================================================

    bodyOrcamentos.innerHTML = '';


    orcamentos.forEach(
      orcamento => {

        const status =
          obterStatus(
            orcamento.status
          );


        const tr =
          document.createElement('tr');


        tr.innerHTML = `
          <td>
            ${formatarData(orcamento.data)}
          </td>

          <td>
            <strong>
              ${formatarMoeda(orcamento.total)}
            </strong>
          </td>

          <td>
            ${orcamento.parcelas || 1}x
          </td>

          <td>
            <span class="status-orcamento ${status.classe}">
              ${status.texto}
            </span>
          </td>

          <td>
            <div class="acoes">

              <button
                class="btn-acao btn-ver"
                onclick="verOrcamento('${orcamento._id}')"
              >
                Ver
              </button>

              <button
                class="btn-acao btn-excluir"
                onclick="excluirOrcamento('${orcamento._id}')"
              >
                Excluir
              </button>

            </div>
          </td>
        `;


        bodyOrcamentos.appendChild(tr);

      }
    );


  } catch (error) {

    console.error(
      'Erro ao carregar orçamentos:',
      error
    );


    bodyOrcamentos.innerHTML = `
      <tr>
        <td colspan="5" class="sem-registros">
          Erro ao carregar orçamentos.
        </td>
      </tr>
    `;
  }
}


// ======================================================
// VER ORÇAMENTO
// ======================================================

async function verOrcamento(id) {

  try {

    const response =
      await fetch(
        `http://localhost:3000/api/orcamentos/detalhe/${id}`
      );


    if (!response.ok) {

      throw new Error(
        'Erro ao buscar orçamento'
      );
    }


    const orcamento =
      await response.json();


    abrirModalOrcamento(
      orcamento
    );


  } catch (error) {

    console.error(
      'Erro ao abrir orçamento:',
      error
    );


    alert(
      'Não foi possível abrir o orçamento.'
    );
  }
}


// ======================================================
// MODAL DO ORÇAMENTO
// ======================================================

function abrirModalOrcamento(orcamento) {

  fecharModalOrcamento();


  const status =
    obterStatus(
      orcamento.status
    );


  const overlay =
    document.createElement('div');


  overlay.id =
    'modalOrcamentoOverlay';


  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.58);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 99999;
  `;


  const modal =
    document.createElement('div');


  modal.style.cssText = `
    width: min(900px, 96vw);
    max-height: 90vh;
    overflow-y: auto;
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 22px 60px rgba(0,0,0,.28);
    font-family: Arial, sans-serif;
  `;


  // ====================================================
  // ITENS DO ORÇAMENTO
  // ====================================================

  let itensHtml = '';


  const itens =
    Array.isArray(orcamento.itens)
      ? orcamento.itens
      : [];


  itens.forEach(
    item => {

      let manutencaoHtml = '';


      if (item.manutencao && item.manutencao.nomeProcedimento) {

        manutencaoHtml = `
          <div style="
            margin-top: 7px;
            padding: 8px 10px;
            background: #f7f8fb;
            border-radius: 7px;
            font-size: 12px;
            color: #475569;
          ">

            <strong>Manutenção:</strong>

            ${escaparHtml(
              item.manutencao.nomeProcedimento ||
              'Manutenção'
            )}

            —

            <strong>
              ${formatarMoeda(
                item.manutencao.valorCobrado
              )}
            </strong>

          </div>
        `;
      }


      let observacaoHtml = '';


      if (item.observacao) {

        observacaoHtml = `
          <div style="
            margin-top: 6px;
            font-size: 12px;
            color: #64748b;
          ">
            <strong>Obs.:</strong>
            ${escaparHtml(item.observacao)}
          </div>
        `;
      }


      itensHtml += `
        <div style="
          padding: 13px 0;
          border-bottom: 1px solid #eee8de;
        ">

          <div style="
            display: flex;
            justify-content: space-between;
            gap: 20px;
          ">

            <div style="flex:1;">

              <div style="
                font-size: 14px;
                font-weight: 700;
                color: #1f2937;
              ">
                ${escaparHtml(
                  item.nomeProcedimento ||
                  item.nome ||
                  'Procedimento'
                )}
              </div>


              ${
                item.tipo
                  ? `
                    <div style="
                      font-size: 11px;
                      color: #8a8379;
                      margin-top: 3px;
                    ">
                      ${escaparHtml(item.tipo)}
                      ${
                        item.dente
                          ? ` • Dente ${escaparHtml(item.dente)}`
                          : ''
                      }
                    </div>
                  `
                  : ''
              }

            </div>


            <div style="
              font-size: 14px;
              font-weight: 700;
              color: #173ea5;
              white-space: nowrap;
            ">
              ${formatarMoeda(
                item.valorTotal ??
                (
                  Number(item.valorCobrado || 0) *
                  Number(item.quantidade || 1)
                )
              )}
            </div>

          </div>

          ${manutencaoHtml}

          ${observacaoHtml}

        </div>
      `;
    }
  );


  // ====================================================
  // MODAL
  // ====================================================

  modal.innerHTML = `

    <div style="
      padding: 18px 22px;
      border-bottom: 1px solid #e7dfd2;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      background: #fff;
      z-index: 2;
    ">

      <div>

        <div style="
          font-size: 19px;
          font-weight: 700;
          color: #173ea5;
        ">
          Orçamento
        </div>

        <div style="
          margin-top: 3px;
          font-size: 12px;
          color: #777;
        ">
          ${formatarData(orcamento.data)}
        </div>

      </div>


      <button
        onclick="fecharModalOrcamento()"
        style="
          border: 0;
          background: #f3f4f6;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
          color: #475569;
        "
      >
        ×
      </button>

    </div>


    <div style="
      padding: 20px 22px;
    ">

      <div style="
        display: flex;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 18px;
        flex-wrap: wrap;
      ">

        <div>

          <div style="
            font-size: 11px;
            color: #777;
            text-transform: uppercase;
            font-weight: 700;
          ">
            Paciente
          </div>

          <div style="
            margin-top: 4px;
            font-size: 17px;
            font-weight: 700;
            color: #1f2937;
          ">
            ${escaparHtml(
              orcamento.pacienteNome
            )}
          </div>

          <div style="
            margin-top: 4px;
            font-size: 12px;
            color: #64748b;
          ">
            CPF:
            ${
              escaparHtml(orcamento.cpf) ||
              'Não informado'
            }
          </div>

        </div>


        <div>

          <span
            class="status-orcamento ${status.classe}"
          >
            ${status.texto}
          </span>

        </div>

      </div>


      <div style="
        background: #faf9f7;
        border: 1px solid #e7dfd2;
        border-radius: 10px;
        padding: 0 14px;
      ">

        ${itensHtml || `
          <div style="
            padding: 20px;
            text-align: center;
            color: #777;
          ">
            Nenhum procedimento encontrado.
          </div>
        `}

      </div>


      ${
        orcamento.observacaoGeral
          ? `
            <div style="
              margin-top: 14px;
              padding: 12px;
              background: #faf9f7;
              border-radius: 8px;
              font-size: 13px;
            ">

              <strong>
                Observação geral:
              </strong>

              ${escaparHtml(
                orcamento.observacaoGeral
              )}

            </div>
          `
          : ''
      }


      <div style="
        margin-top: 18px;
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 10px;
      ">

        <div style="
          border: 1px solid #e7dfd2;
          border-radius: 9px;
          padding: 11px 12px;
        ">

          <div style="
            font-size: 10px;
            color: #777;
            text-transform: uppercase;
            font-weight: 700;
          ">
            Desconto (PIX / Dinheiro)
          </div>

          <div style="
            margin-top: 5px;
            font-weight: 700;
          ">
            ${Number(
              orcamento.desconto || 0
            )}%
          </div>

        </div>


        <div style="
          border: 1px solid #e7dfd2;
          border-radius: 9px;
          padding: 11px 12px;
        ">

          <div style="
            font-size: 10px;
            color: #777;
            text-transform: uppercase;
            font-weight: 700;
          ">
            Parcelamento
          </div>

          <div style="
            margin-top: 5px;
            font-weight: 700;
          ">
            ${
              orcamento.parcelas || 1
            }x
          </div>

        </div>


        <div style="
          border: 1px solid #c7d5f5;
          background: #f5f8ff;
          border-radius: 9px;
          padding: 11px 12px;
        ">

          <div style="
            font-size: 10px;
            color: #567;
            text-transform: uppercase;
            font-weight: 700;
          ">
            Total
          </div>

          <div style="
            margin-top: 5px;
            font-size: 18px;
            font-weight: 700;
            color: #173ea5;
          ">
            ${formatarMoeda(
              orcamento.total
            )}
          </div>

        </div>

      </div>


      <div style="
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      ">

        <button
          onclick="fecharModalOrcamento()"
          style="
            border: 1px solid #d8dce5;
            background: #fff;
            color: #475569;
            border-radius: 8px;
            padding: 9px 16px;
            font-weight: 700;
            cursor: pointer;
          "
        >
          Fechar
        </button>

      </div>

    </div>
  `;


  overlay.appendChild(modal);

  document.body.appendChild(
    overlay
  );


  overlay.addEventListener(
    'click',
    event => {

      if (event.target === overlay) {
        fecharModalOrcamento();
      }

    }
  );
}


// ======================================================
// FECHAR MODAL
// ======================================================

function fecharModalOrcamento() {

  const modal =
    document.getElementById(
      'modalOrcamentoOverlay'
    );


  if (modal) {
    modal.remove();
  }
}


// ======================================================
// EXCLUIR ORÇAMENTO
// ======================================================

async function excluirOrcamento(id) {

  const confirmar =
    confirm(
      'Deseja realmente excluir este orçamento?'
    );


  if (!confirmar) {
    return;
  }


  try {

    const response =
      await fetch(
        `http://localhost:3000/api/orcamentos/${id}`,
        {
          method: 'DELETE'
        }
      );


    if (!response.ok) {

      throw new Error(
        'Erro ao excluir orçamento'
      );
    }


    carregarOrcamentos();


  } catch (error) {

    console.error(
      'Erro ao excluir orçamento:',
      error
    );


    alert(
      'Não foi possível excluir o orçamento.'
    );
  }
}


// ======================================================
// INICIAR
// ======================================================

carregarOrcamentos();