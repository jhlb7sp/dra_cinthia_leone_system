const params = new URLSearchParams(window.location.search);
const cpf = params.get('cpf');

if (!cpf) {
  document.getElementById('dadosPaciente').innerHTML = "<p>CPF não informado.</p>";
} else {
  fetch(`http://localhost:3000/api/anamneses/cpf/${cpf}`)
    .then(response => response.json())
    .then(paciente => {
      if (!paciente || paciente.erro) {
        document.getElementById('dadosPaciente').innerHTML = "<p>Paciente não encontrado.</p>";
        return;
      }

      document.getElementById('dadosPaciente').innerHTML = `
        <table border="0">
          <tbody>
            <tr>
              <td><label>Queixa Principal</label></td>
              <td><input type="text" id="queixa" disabled value="${paciente.queixa_principal}"></td>
            </tr>
            <tr>
              <td><label>Tem alergia ou já teve reação a medicamento?</label></td>
              <td><input type="text" id="alergia" disabled value="${paciente.alergia}"> </td>
              <td><label>Qual?</label></td>
              <td><input type="text" id="alergia_qual" style="width: 200px;" disabled value="${paciente.alergia_qual}"></td>
            </tr>
            <tr>
              <td><label>Está grávida?</label></td>
              <td><input type="text" id="gravida" disabled value="${paciente.gravida}"> </td>
              <td><label>Quantos meses?</label></td>
              <td><input type="text" id="gravida_meses" style="width: 200px;" disabled value="${paciente.gravida_meses}"></td>
            </tr>
            <tr>
              <td><label>Já passou por cirurgia?</label></td>
              <td><input type="text" id="cirurgia" disabled value="${paciente.cirurgia}"></td>
              <td><label>Qual?</label></td>
              <td><input type="text" id="cirurgia_qual" style="width: 200px;"disabled value="${paciente.cirurgia_qual}"></td>
            </tr>
            <tr>
              <td><label>Está sob algum tratamento médico?</label></td>
              <td><input type="text" id="tratamento" disabled value="${paciente.tratamento}"></td> 
              <td><label>Qual?</label></td>
              <td><input type="text" id="tratamento_qual" style="width: 200px;"disabled value="${paciente.tratamento_qual}"></td>
            </tr>
            <tr>
              <td><label>Usa medicamentos?</label></td>
              <td><input type="text" id="medicamento" disabled value="${paciente.medicamento}"> </td>
              <td><label>Qual?</label></td>
              <td><input type="text" id="medicamento_qual" style="width: 200px;" disabled value="${paciente.medicamento_qual}"></td>
            </tr>
            <tr>
              <td><label>Fuma</label></td>
              <td><input type="text" id="fuma" disabled value="${paciente.fuma}"></td>
            </tr>
          </tbody>
        </table>

        <table>
          <tbody>
            
            <tr><label style="white-space: nowrap;"  >Sofre de alguma dessas enfermidades?</label></tr><br>
            
            <tr id="campo_enfermidades">
                <label><input style="white-space: nowrap;" type="checkbox" class="enfermidade" value="hiv" disabled> HIV</label>
                <label><input style="white-space: nowrap;" type="checkbox" class="enfermidade" value="diabetes" disabled> Diabetes</label>
                <label><input style="white-space: nowrap;" type="checkbox" class="enfermidade" value="tuberculose" disabled> Tuberculose</label>
                <label><input style="white-space: nowrap;" type="checkbox" class="enfermidade" value="artrite" disabled> Artrite</label>
                <label><input style="white-space: nowrap;" type="checkbox" class="enfermidade" value="hepaticos" disabled> Problemas Hepáticos</label>
            </tr>
            <tr>    
                <label><input style="white-space: nowrap;" type="checkbox" class="enfermidade" value="asma" disabled> Asma</label>
                <label><input style="white-space: nowrap;" type="checkbox" class="enfermidade" value="hipertensao" disabled> Hipertensão</label>
                <label><input style="white-space: nowrap;" type="checkbox" class="enfermidade" value="renais" disabled> Problemas Renais</label>
                <label><input style="white-space: nowrap;" type="checkbox" class="enfermidade" value="cardiaco" disabled> Problemas Cardíacos</label>
            </tr>
            <tr>
              <td><label>Outros?</label></td>
              <td><textarea type="text" id="enfermidade_outros" style="width: 470px; height: 70px;" disabled >${paciente.enfermidade_outros}</textarea></td>
            </tr>
            <tr>
              <td><label>Observações gerais</label></td>
              <td><textarea type="text" id="observacoesGerais" style="width: 470px; height: 70px;" disabled >${paciente.observacoesGerais}</textarea></td>
            </tr>
          </tbody>
        </table>

        <center>
        <div class="botoes">
          <button type="button" class="btn_alterar" onclick="alterarAnamneses()">Alterar</button>
          <button type="button" class="btn_salvar" onclick="salvarAnamneses()">Salvar</button>
        </div>
        </center>
      `;

      // Marcar as enfermidades salvas
      const enfermidadesSalvas = paciente.enfermidades || [];
      document.querySelectorAll('.enfermidade').forEach(checkbox => {
        if (enfermidadesSalvas.includes(checkbox.value)) {
          checkbox.checked = true;
        }
      });

    })
    .catch(erro => {
      console.error(erro);
      document.getElementById('dadosPaciente').innerHTML = "<p>Erro ao buscar dados.</p>";
    });
}

function alterarAnamneses() {
  const inputs = document.querySelectorAll('#dadosPaciente input, #dadosPaciente textarea');
  inputs.forEach(input => {
    input.disabled = false;
  });
}

function salvarAnamneses() {
  const cpf = new URLSearchParams(window.location.search).get('cpf');
  if (!cpf) {
    alert("CPF não informado.");
    return;
  }

  // Captura os valores dos inputs
  const queixa_principal = document.getElementById('queixa').value;
  const alergia = document.getElementById('alergia').value;
  const alergia_qual = document.getElementById('alergia_qual').value;
  const gravida = document.getElementById('gravida').value;
  const gravida_meses = document.getElementById('gravida_meses').value;
  const cirurgia = document.getElementById('cirurgia').value;
  const cirurgia_qual = document.getElementById('cirurgia_qual').value;
  const tratamento = document.getElementById('tratamento').value;
  const tratamento_qual = document.getElementById('tratamento_qual').value;
  const medicamento = document.getElementById('medicamento').value;
  const medicamento_qual = document.getElementById('medicamento_qual').value;
  const fuma = document.getElementById('fuma').value;
  const observacoesGerais = document.getElementById('observacoesGerais').value;
  
  // Pega as enfermidades marcadas
  const enfermidades = [];
  document.querySelectorAll('.enfermidade:checked').forEach(cb => {
    enfermidades.push(cb.value.toLowerCase());
  });

  const enfermidade_outros = document.getElementById('enfermidade_outros').value;

  // Monta o objeto com os dados
  const dados = {
    cpf,
    queixa_principal,
    alergia,
    alergia_qual,
    gravida,
    gravida_meses,
    cirurgia,
    cirurgia_qual,
    tratamento,
    tratamento_qual,
    medicamento,
    medicamento_qual,
    fuma,
    enfermidades,
    enfermidade_outros,
    observacoesGerais
  };

  // Envia pro backend
  fetch(`http://localhost:3000/api/anamneses/cpf/${cpf}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dados)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Erro ao salvar anamneses");
      }
      return response.json();
    })
    .then(result => {
      alert("Anamnese atualizada com sucesso!");
      window.location.reload();  // ou redireciona pra outra tela se quiser
    })
    .catch(erro => {
      console.error(erro);
      alert("Erro ao salvar anamnese.");
    });
}
