    const params = new URLSearchParams(window.location.search);
    const cpf = params.get('cpf');

    if (!cpf) {
      document.getElementById('dadosPaciente').innerHTML = "<p>CPF não informado.</p>";
    } else {
      fetch(`http://localhost:3000/api/pacientes/cpf/${cpf}`)
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
                  <td><label>Nome:</label></td>
                  <td><input type="text" id="nome" style="width: 350px;" disabled value="${paciente.nome}"></td>
                  <td><label>CPF:</label></td>
                  <td><input type="text" id="cpf" style="width: 120px;" disabled value="${paciente.cpf}"></td>
                  <td><label>Data nasc.:</label></td>
                  <td><input type="text" id="datanascimento" style="width: 200px;" disabled value="${paciente.dataNascimento}"></td>
                </tr>
                <tr>
                  <td><label>E-mail</label></td>
                  <td><input type="text" id="email" style="width: 350px;" disabled value="${paciente.email}"></td>
                  <td><label>Telefone:</label></td>
                  <td><input type="text" id="telefone" style="width: 120px;" disabled value="${paciente.telefone}"></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            <label><h1>Endereço:</h1></label><br>
            <table border="0">
              <tbody>
                <tr>
                  <td><label>Rua:</label></td>
                  <td><input type="text" id="rua" style="width: 350px;" disabled value="${paciente.endereco.rua}"></td>
                  <td><label>Número:</label></td>
                  <td><input type="text" id="numero" style="width: 120px;"disabled value="${paciente.endereco.numero}"></td>
                  <td><label>Bairro:</label></td>
                  <td><input type="text" id="bairro" style="width: 200px;"disabled value="${paciente.endereco.bairro}"></td>
                </tr>
                <tr>
                  <td><label>Cidade:</label></td>
                  <td><input type="text" id="cidade" style="width: 350px;" disabled value="${paciente.endereco.cidade}"></td>
                  <td><label>Estado:</label></td>
                  <td><input type="text" id="estado" style="width: 120px;" disabled value="${paciente.endereco.estado}"></td>
                  <td><label>CEP:</label></td>
                  <td><input type="text" id="cep" style="width: 200px;" disabled value="${paciente.endereco.cep}"></td>
                </tr>
              </tbody>
            </table>

            <label>Como conheceu o consultório?:</label>
            <input type="text" id="origem" disabled value="${paciente.origem}"> <br>
            <label>Status:</label>
            <input type="text" id="status" disabled value="${paciente.status}"> <br>

            <center><button type="button" class="btn_alterar" onclick="alterarPaciente()">Alterar</button>
            <button type="button" class="btn_salvar" onclick="salvarPaciente()">Salvar</button></center>
          `;
        })
        .catch(erro => {
          console.error(erro);
          document.getElementById('dadosPaciente').innerHTML = "<p>Erro ao buscar dados.</p>";
        });
    }

  function alterarPaciente() {
  // Pega todos os inputs dentro da div 'dadosPaciente'
  const inputs = document.querySelectorAll('#dadosPaciente input');

  // Percorre cada input e habilita
  inputs.forEach(input => {
    // Se não for o CPF, habilita
    if (input.id !== 'cpf') {
      input.disabled = false;
    }
  });
}

function salvarPaciente() {
  const cpf = document.getElementById('cpf').value;

  const pacienteAtualizado = {
    nome: document.getElementById('nome').value,
    dataNascimento: document.getElementById('datanascimento').value,
    email: document.getElementById('email').value,
    telefone: document.getElementById('telefone').value,
    endereco: {
      rua: document.getElementById('rua').value,
      numero: document.getElementById('numero').value,
      bairro: document.getElementById('bairro').value,
      cidade: document.getElementById('cidade').value,
      estado: document.getElementById('estado').value,
      cep: document.getElementById('cep').value
    },
    origem: document.getElementById('origem').value,
    status: document.getElementById('status').value
  };

  fetch(`http://localhost:3000/api/pacientes/${cpf}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(pacienteAtualizado)
  })
  .then(response => response.json())
  .then(data => {
    alert('Dados atualizados com sucesso!');
    // Aqui você pode desabilitar os campos novamente se quiser
    const inputs = document.querySelectorAll('#dadosPaciente input');
    inputs.forEach(input => input.disabled = true);
  })
  .catch(error => {
    console.error('Erro ao atualizar paciente:', error);
    alert('Erro ao atualizar os dados do paciente.');
  });
}
