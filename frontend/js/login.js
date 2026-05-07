function fazerLogin() {
  const usuario = document.getElementById('usuario').value;
  const senha = document.getElementById('senha').value;

  fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ usuario, senha })
  })
    .then(response => response.json())
    .then(data => {
      if (data.sucesso) {
        sessionStorage.setItem('logado', 'sim');
        sessionStorage.setItem('usuarioLogado', data.usuario);
        window.location.href = 'drcinthialeone.html';
        console.log('Login com sucesso');
      } else {
        alert('Usuário ou senha incorretos.');
      }
    })
    .catch(error => {
      console.error('Erro:', error);
      alert('Erro ao tentar logar.');
    });
}
function toggleSenha() {
  const input = document.getElementById("senha");

  if (input.type === "password") {
    input.type = "text";
  } else {
    input.type = "password";
  }
}


document.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    fazerLogin();
  }
});