// frontend/js/procedimentos.js


// ======================================================
// FILTRO
// ======================================================
let procedimentoEmEdicao = null;

function filtrarProcedimentos() {
  const filtro = document
    .getElementById('filtro')
    .value
    .toLowerCase();

  const linhas = document.querySelectorAll(
    '#tabelaProcedimentos tr'
  );

  linhas.forEach(linha => {
    const nome = linha.cells[0]
      .innerText
      .toLowerCase();

    linha.style.display =
      nome.includes(filtro) ? '' : 'none';
  });
}


// ======================================================
// CONVERTER VALOR
// ======================================================

function converterValor(valor) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ''
  ) {
    return 0;
  }

  if (typeof valor === 'number') {
    return valor;
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


// ======================================================
// FORMATAR DINHEIRO
// ======================================================

function formatarMoeda(valor) {
  const numero = converterValor(valor);

  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}


// ======================================================
// ADICIONAR PROCEDIMENTO
// ======================================================

async function adicionarProcedimentos() {
  const nome =
    document.getElementById('nome').value.trim();

  const tipo =
    document.getElementById('tipo').value.trim();

  const dente =
    document.getElementById('dente').value.trim();

  const valorPrincipal =
    document.getElementById('valorPrincipal').value.trim();

  const valorDesconto =
    document.getElementById('valorDesconto').value.trim();

  const valorFamilia =
    document.getElementById('valorFamilia').value.trim();


  if (!nome || !valorPrincipal) {
    alert('Preencha o nome e o valor principal!');
    return;
  }


  const dados = {
    nome,
    tipo,
    dente,

    precos: {
      padrao: valorPrincipal,
      especial1: valorDesconto,
      especial2: valorFamilia
    }
  };


  try {

    let url =
      '/api/procedimentos/adicionar';

    let metodo =
      'POST';


    if (procedimentoEmEdicao) {
      url =
        `/api/procedimentos/editar/${procedimentoEmEdicao}`;

      metodo =
        'PUT';
    }


    const resposta = await fetch(url, {
      method: metodo,

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify(dados)
    });


    const resultado =
      await resposta.json();


    if (!resposta.ok) {
      throw new Error(
        resultado.error ||
        'Erro ao salvar procedimento'
      );
    }


    alert(resultado.message);


    limparFormulario();

    carregarProcedimentos();


  } catch (err) {

    console.error(err);

    alert(err.message);
  }
}
async function editarProcedimento(id) {

  try {

    const resposta =
      await fetch('/api/procedimentos/listar');

    const lista =
      await resposta.json();


    const proc =
      lista.find(
        item =>
          String(item._id) === String(id)
      );


    if (!proc) {
      alert('Procedimento não encontrado.');
      return;
    }


    procedimentoEmEdicao = proc._id;


    document.getElementById('nome').value =
      proc.nome || '';

    document.getElementById('tipo').value =
      proc.tipo || '';

    document.getElementById('dente').value =
      proc.dente || '';


    document.getElementById('valorPrincipal').value =
      proc.precos?.padrao ??
      proc.valor ??
      '';


    document.getElementById('valorDesconto').value =
      proc.precos?.especial1 ??
      '';


    document.getElementById('valorFamilia').value =
      proc.precos?.especial2 ??
      '';


    document.getElementById('btnSalvar').innerText = 'Salvar';
    document.getElementById("btnCancelar").style.display = "flex";


    document.getElementById('nome').focus();


  } catch (err) {

    console.error(err);

    alert(
      'Erro ao carregar procedimento.'
    );
  }
}
async function abrirHistorico(id) {

  try {

    const resposta =
      await fetch(
        `/api/procedimentos/historico/${id}`
      );


    const dados =
      await resposta.json();


    if (!resposta.ok) {
      throw new Error(
        dados.error ||
        'Erro ao carregar histórico'
      );
    }


    document.getElementById(
      'historicoNome'
    ).innerText =
      dados.nome;


    const historico =
      dados.historicoPrecos || [];


    let html = `

      <div class="historico-atual">

        <div class="historico-titulo-atual">
          Valores atuais
        </div>

        <div class="historico-valores">

          <div>
            <span>Principal</span>
            <strong>
              ${formatarMoeda(
      dados.precos.padrao
    )}
            </strong>
          </div>

          <div>
            <span>Desconto</span>
            <strong>
              ${formatarMoeda(
      dados.precos.especial1
    )}
            </strong>
          </div>

          <div>
            <span>Família</span>
            <strong>
              ${formatarMoeda(
      dados.precos.especial2
    )}
            </strong>
          </div>

        </div>

      </div>
    `;


    if (historico.length === 0) {

      html += `
        <div class="historico-vazio">
          Este procedimento ainda não possui
          alterações de preço.
        </div>
      `;

    } else {

      html += `
        <div class="historico-lista">
      `;


      historico.forEach(item => {

        const data =
          new Date(
            item.alteradoEm
          );


        const dataFormatada =
          data.toLocaleDateString(
            'pt-BR'
          );


        const horaFormatada =
          data.toLocaleTimeString(
            'pt-BR',
            {
              hour: '2-digit',
              minute: '2-digit'
            }
          );


        const origem =
          item.origem === 'importacao'
            ? 'Importação'
            : 'Alteração manual';


        html += `

          <div class="historico-item">

            <div class="historico-data">

              <strong>
                ${dataFormatada}
              </strong>

              <span>
                ${horaFormatada}
              </span>

              <small>
                ${origem}
              </small>

            </div>


            <div class="historico-valores">

              <div>
                <span>Principal</span>

                <strong>
                  ${formatarMoeda(
          item.padrao
        )}
                </strong>
              </div>


              <div>
                <span>Desconto</span>

                <strong>
                  ${formatarMoeda(
          item.especial1
        )}
                </strong>
              </div>


              <div>
                <span>Família</span>

                <strong>
                  ${formatarMoeda(
          item.especial2
        )}
                </strong>
              </div>

            </div>

          </div>
        `;
      });


      html += `
        </div>
      `;
    }


    document.getElementById(
      'historicoConteudo'
    ).innerHTML =
      html;


    document.getElementById(
      'modalHistorico'
    ).classList.add(
      'ativo'
    );


  } catch (err) {

    console.error(err);

    alert(err.message);
  }
}


function fecharHistorico() {

  document.getElementById(
    'modalHistorico'
  ).classList.remove(
    'ativo'
  );
}


function limparFormulario() {

  procedimentoEmEdicao = null;


  document.getElementById('nome').value = '';
  document.getElementById('tipo').value = '';
  document.getElementById('dente').value = '';

  document.getElementById('valorPrincipal').value = '';
  document.getElementById('valorDesconto').value = '';
  document.getElementById('valorFamilia').value = '';


  document.getElementById('btnSalvar').innerText = 'Adicionar';
  document.getElementById('btnCancelar').style.display = 'none';
}

// ======================================================
// CARREGAR PROCEDIMENTOS
// ======================================================

function carregarProcedimentos() {

  fetch('/api/procedimentos/listar')

    .then(r => r.json())

    .then(lista => {

      const tabela =
        document.getElementById(
          'tabelaProcedimentos'
        );

      tabela.innerHTML = '';


      lista.forEach(proc => {

        const row = tabela.insertRow();


        row.insertCell(0).innerText =
          proc.nome || '';

        row.insertCell(1).innerText =
          proc.tipo || '';

        row.insertCell(2).innerText =
          proc.dente || '';


        const principal =
          proc.precos?.padrao ??
          proc.valor ??
          0;

        const desconto =
          proc.precos?.especial1 ??
          0;

        const familia =
          proc.precos?.especial2 ??
          0;


        row.insertCell(3).innerText =
          formatarMoeda(principal);

        row.insertCell(4).innerText =
          formatarMoeda(desconto);

        row.insertCell(5).innerText =
          formatarMoeda(familia);


        row.insertCell(6).innerHTML = `
  <div class="acoes-tabela">

    <button
      type="button"
      class="btn-acao btn-editar"
      title="Editar procedimento"
      onclick="editarProcedimento('${proc._id}')">
      ✎
    </button>

    <button
      type="button"
      class="btn-acao btn-historico"
      title="Histórico de preços"
      onclick="abrirHistorico('${proc._id}')">
      ◷
    </button>

    <button
      type="button"
      class="btn-acao btn-excluir"
      title="Excluir procedimento"
      onclick="excluirProcedimentos('${proc._id}')">
      ×
    </button>

  </div>
`;
      });


      filtrarProcedimentos();
    })

    .catch(err => {
      console.error(
        'Erro ao carregar procedimentos:',
        err
      );
    });
}


// ======================================================
// EXCLUIR
// ======================================================

function excluirProcedimentos(id) {

  const confirmar = confirm(
    'Deseja realmente excluir este procedimento?'
  );

  if (!confirmar) {
    return;
  }


  fetch(
    `/api/procedimentos/excluir/${id}`,
    {
      method: 'DELETE'
    }
  )

    .then(r => r.json())

    .then(data => {

      alert(
        data.message ||
        'Procedimento excluído!'
      );

      carregarProcedimentos();
    })

    .catch(err => {
      console.error(err);
      alert('Erro ao excluir procedimento.');
    });
}


// ======================================================
// EXPORTAR EXCEL
// ======================================================

async function exportarProcedimentosExcel() {

  try {

    const resposta =
      await fetch('/api/procedimentos/listar');

    const lista =
      await resposta.json();


    if (!Array.isArray(lista) || lista.length === 0) {

      alert(
        'Não existem procedimentos para exportar.'
      );

      return;
    }


    const dadosExcel = lista.map(proc => {

      const principal =
        proc.precos?.padrao ??
        proc.valor ??
        0;

      const desconto =
        proc.precos?.especial1 ??
        0;

      const familia =
        proc.precos?.especial2 ??
        0;


      return {
        ID: proc._id,

        Procedimento:
          proc.nome || '',

        Tipo:
          proc.tipo || '',

        Dente:
          proc.dente || '',

        'Valor Principal':
          principal,

        'Valor Desconto':
          desconto,

        'Valor Familia':
          familia
      };
    });


    const planilha =
      XLSX.utils.json_to_sheet(
        dadosExcel
      );


    // Largura das colunas
    planilha['!cols'] = [
      { wch: 26 }, // ID
      { wch: 32 }, // Procedimento
      { wch: 10 }, // Tipo
      { wch: 10 }, // Dente
      { wch: 16 }, // Principal
      { wch: 16 }, // Desconto
      { wch: 16 }  // Família
    ];


    const arquivo =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      arquivo,
      planilha,
      'Procedimentos'
    );


    const data =
      new Date()
        .toLocaleDateString('pt-BR')
        .replace(/\//g, '-');


    XLSX.writeFile(
      arquivo,
      `procedimentos-${data}.xlsx`
    );

  } catch (err) {

    console.error(
      'Erro ao exportar Excel:',
      err
    );

    alert(
      'Não foi possível exportar a planilha.'
    );
  }
}


// ======================================================
// ABRIR SELETOR DE ARQUIVO
// ======================================================

function abrirImportacaoExcel() {

  const input =
    document.getElementById(
      'arquivoImportacao'
    );

  input.value = '';

  input.click();
}


// ======================================================
// NORMALIZAR CABEÇALHO
// ======================================================

function normalizarTexto(texto) {

  return String(texto || '')

    .normalize('NFD')

    .replace(
      /[\u0300-\u036f]/g,
      ''
    )

    .trim()

    .toLowerCase()

    .replace(/\s+/g, '');
}


// ======================================================
// IMPORTAR EXCEL
// ======================================================

async function importarProcedimentosExcel(event) {

  const arquivo =
    event.target.files[0];


  if (!arquivo) {
    return;
  }


  try {

    const buffer =
      await arquivo.arrayBuffer();


    const workbook =
      XLSX.read(buffer, {
        type: 'array'
      });


    const primeiraAba =
      workbook.SheetNames[0];


    const worksheet =
      workbook.Sheets[primeiraAba];


    const linhas =
      XLSX.utils.sheet_to_json(
        worksheet,
        {
          defval: ''
        }
      );


    if (linhas.length === 0) {

      alert(
        'A planilha está vazia.'
      );

      return;
    }


    const procedimentos =
      linhas.map(linha => {

        const colunas = {};


        Object.keys(linha).forEach(chave => {

          colunas[
            normalizarTexto(chave)
          ] = linha[chave];

        });


        return {

          id:
            colunas.id ||
            colunas._id ||
            '',

          nome:
            colunas.procedimento ||
            colunas.nome ||
            '',

          tipo:
            colunas.tipo ||
            '',

          dente:
            colunas.dente ||
            '',

          valorPrincipal:
            converterValor(
              colunas.valorprincipal ??
              colunas.principal
            ),

          valorDesconto:
            converterValor(
              colunas.valordesconto ??
              colunas.desconto
            ),

          valorFamilia:
            converterValor(
              colunas.valorfamilia ??
              colunas.familia
            )
        };

      })

        .filter(item =>
          String(item.nome).trim() !== ''
        );


    if (
      procedimentos.length === 0
    ) {

      alert(
        'Nenhum procedimento válido foi encontrado na planilha.'
      );

      return;
    }


    // ==================================================
    // COMPARAR COM BANCO ANTES DE IMPORTAR
    // ==================================================

    const respostaAtual =
      await fetch(
        '/api/procedimentos/listar'
      );


    const atuais =
      await respostaAtual.json();


    let novos = 0;
    let alterados = 0;
    let semAlteracao = 0;


    procedimentos.forEach(item => {

      let atual = null;


      // Procura primeiro pelo ID
      if (item.id) {

        atual = atuais.find(
          proc =>
            String(proc._id) ===
            String(item.id)
        );
      }


      // Fallback: nome + tipo + dente
      if (!atual) {

        atual = atuais.find(proc =>

          String(proc.nome || '')
            .trim()
            .toLowerCase()
          ===
          String(item.nome || '')
            .trim()
            .toLowerCase()

          &&

          String(proc.tipo || '')
            .trim()
            .toLowerCase()
          ===
          String(item.tipo || '')
            .trim()
            .toLowerCase()

          &&

          String(proc.dente || '')
            .trim()
            .toLowerCase()
          ===
          String(item.dente || '')
            .trim()
            .toLowerCase()

        );
      }


      if (!atual) {

        novos++;

        return;
      }


      const principalAtual =
        converterValor(
          atual.precos?.padrao ??
          atual.valor
        );

      const descontoAtual =
        converterValor(
          atual.precos?.especial1
        );

      const familiaAtual =
        converterValor(
          atual.precos?.especial2
        );


      const mudou =
        principalAtual !==
        item.valorPrincipal

        ||

        descontoAtual !==
        item.valorDesconto

        ||

        familiaAtual !==
        item.valorFamilia;


      if (mudou) {
        alterados++;
      } else {
        semAlteracao++;
      }

    });


    // ==================================================
    // CONFIRMAÇÃO
    // ==================================================

    const confirmar =
      confirm(
        `Importação de procedimentos

${procedimentos.length} procedimentos encontrados.

${alterados} serão atualizados.
${novos} serão cadastrados.
${semAlteracao} não tiveram alteração.

Os preços atuais dos procedimentos alterados serão guardados no histórico.

Deseja continuar?`
      );


    if (!confirmar) {
      return;
    }


    // ==================================================
    // ENVIAR AO BACKEND
    // ==================================================

    const resposta =
      await fetch(
        '/api/procedimentos/importar',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            procedimentos
          })
        }
      );


    const resultado =
      await resposta.json();


    if (!resposta.ok) {

      throw new Error(
        resultado.error ||
        'Erro ao importar procedimentos'
      );
    }


    const resumo =
      resultado.resultado || {};


    alert(
      `Importação concluída!

Atualizados: ${resumo.atualizados || 0}
Cadastrados: ${resumo.cadastrados || 0}
Sem alteração: ${resumo.ignorados || 0}
Erros: ${resumo.erros || 0}`
    );


    carregarProcedimentos();


  } catch (err) {

    console.error(
      'Erro ao importar planilha:',
      err
    );


    alert(
      'Não foi possível importar a planilha.\n\n' +
      err.message
    );
  }


  event.target.value = '';
}


// ======================================================
// INICIALIZAÇÃO
// ======================================================

window.onload =
  carregarProcedimentos;