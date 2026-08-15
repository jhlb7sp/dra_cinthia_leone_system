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

let orcamentoModalAtual = null;


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

  orcamentoModalAtual = orcamento;


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
          onclick="gerarPdfOrcamentoSalvo(this)"
          style="
            border: 1px solid #9A6B3F;
            background: #9A6B3F;
            color: #FFFFFF;
            border-radius: 8px;
            padding: 9px 16px;
            font-weight: 700;
            cursor: pointer;
          "
        >
          Gerar PDF
        </button>

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
// GERAR PDF DO ORÇAMENTO SALVO
// ======================================================

function gerarPdfOrcamentoSalvo(botao = null) {

  const orcamento = orcamentoModalAtual;

  if (!orcamento) {
    alert('Não foi possível identificar o orçamento selecionado.');
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('Não foi possível carregar o gerador de PDF.');
    return;
  }

  if (typeof logoBase64 === 'undefined' || !logoBase64) {
    alert('Não foi possível carregar o logo do documento.');
    return;
  }

  const textoOriginal = botao ? botao.textContent : '';

  if (botao) {
    botao.disabled = true;
    botao.textContent = 'Gerando...';
  }

  try {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const inicioY = 45;

    const croDocumento =
      typeof cro !== 'undefined'
        ? String(cro)
        : '126.543';

    const enderecoDocumento =
      typeof endereco !== 'undefined'
        ? String(endereco)
        : 'Praça Barão de Macaúbas, 31 - Vila Formosa - CEP: 03357-040';

    const telefoneDocumento =
      typeof telefone !== 'undefined'
        ? String(telefone)
        : 'Telefone: (11) 96801-3319';

    const paciente =
      String(orcamento.pacienteNome || 'Paciente').trim();

    const cpfLimpo =
      String(orcamento.cpf || '').replace(/\D/g, '');

    const cpfDocumento =
      cpfLimpo.length === 11
        ? cpfLimpo.replace(
            /(\d{3})(\d{3})(\d{3})(\d{2})/,
            '$1.$2.$3-$4'
          )
        : cpfLimpo;

    const desconto = Number(orcamento.desconto || 0);
    const parcelas = Math.max(
      1,
      parseInt(orcamento.parcelas, 10) || 1
    );
    const total = Number(orcamento.total || 0);
    const totalComDesconto =
      total - (total * (desconto / 100));
    const valorParcela = total / parcelas;
    const itens = Array.isArray(orcamento.itens)
      ? orcamento.itens
      : [];

    const dataDocumento =
      formatarData(orcamento.data) !== '-'
        ? formatarData(orcamento.data)
        : new Date().toLocaleDateString('pt-BR');

    const imgProps = doc.getImageProperties(logoBase64);
    const larguraLogo = 140;
    const alturaLogo =
      (imgProps.height * larguraLogo) / imgProps.width;

    doc.addImage(
      logoBase64,
      'PNG',
      30,
      10,
      larguraLogo,
      alturaLogo
    );

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Dra. Cinthia Leone da Cunha', 15, inicioY + 9);
    doc.line(15, inicioY + 12, 195, inicioY + 12);

    doc.setFont(undefined, 'bold');
    doc.text('CRO:', 75, inicioY + 9);
    doc.setFont(undefined, 'normal');
    doc.text(croDocumento, 90, inicioY + 9);

    doc.setFont(undefined, 'bold');
    doc.text('Data:', 115, inicioY + 9);
    doc.setFont(undefined, 'normal');
    doc.text(dataDocumento, 130, inicioY + 9);

    doc.setFont(undefined, 'bold');
    doc.text('-    São Paulo - SP', 155, inicioY + 9);

    doc.setFontSize(16);
    doc.text('Orçamento Odontológico', 70, inicioY + 25);

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Paciente:', 20, inicioY + 37);
    doc.setFont(undefined, 'normal');
    doc.text(paciente, 45, inicioY + 37);

    if (cpfDocumento) {
      doc.setFont(undefined, 'bold');
      doc.text('CPF:', 130, inicioY + 37);
      doc.setFont(undefined, 'normal');
      doc.text(cpfDocumento, 142, inicioY + 37);
    }

    let y = 95;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Procedimentos:', 20, y);
    y += 10;
    doc.setFont(undefined, 'normal');

    itens.forEach(item => {

      const texto =
        `${item.nomeProcedimento || item.nome || 'Procedimento'}` +
        `${item.tipo ? ' (' + item.tipo + ')' : ''}` +
        `${item.dente ? ' - Dente: ' + item.dente : ''}` +
        `  ${formatarMoeda(item.valorCobrado)}`;

      doc.text(texto, 20, y);
      y += 7;

      if (
        item.manutencao &&
        item.manutencao.nomeProcedimento
      ) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(
          `Manutenção: ${item.manutencao.nomeProcedimento} - ${formatarMoeda(item.manutencao.valorCobrado)}`,
          25,
          y
        );
        y += 6;
        doc.setFontSize(12);
      }

      if (item.observacao) {
        doc.setFontSize(9);
        doc.setTextColor(90, 90, 90);

        const linhasObservacao = doc.splitTextToSize(
          `Obs.: ${item.observacao}`,
          165
        );

        doc.text(linhasObservacao, 25, y);
        y += linhasObservacao.length * 5;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
      }

      y += 2;
    });

    y += 8;

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: ${formatarMoeda(total)}`, 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(
      `Em ${parcelas}x de ${formatarMoeda(valorParcela)} sem juros`,
      20,
      y
    );

    if (desconto > 0) {
      y += 9;
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Desconto de ${desconto}% no Pix ou dinheiro: ${formatarMoeda(totalComDesconto)}.`,
        20,
        y
      );
    }

    y += 10;
    doc.setFontSize(9);
    doc.text('Orçamento válido por 30 dias.', 20, y);
    doc.text(enderecoDocumento, 50, 275);
    doc.text(telefoneDocumento, 80, 280);

    const nomeArquivo =
      paciente
        .replace(/[\\/:*?"<>|]/g, '')
        .trim() || 'paciente';

    doc.save(`orcamento_${nomeArquivo}.pdf`);

  } catch (error) {
    console.error('Erro ao gerar PDF do orçamento salvo:', error);
    alert('Não foi possível gerar o PDF deste orçamento.');
  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = textoOriginal || 'Gerar PDF';
    }
  }
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

  orcamentoModalAtual = null;
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