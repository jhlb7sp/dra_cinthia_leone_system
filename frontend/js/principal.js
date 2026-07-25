const sidebar = document.getElementById('sidebar');
const main = document.getElementById('main');
const logoToggle = document.getElementById('logoToggle');
const iframePrincipal = document.getElementById('iframePrincipal') || document.querySelector('iframe[name="iframePrincipal"]');
const lembreteManutencoes = document.getElementById('lembreteManutencoes');
const textoLembreteManutencoes = document.getElementById('textoLembreteManutencoes');

function abrirMenu() {
    sidebar.classList.remove('collapsed');
    main.classList.remove('expanded');
}

function fecharMenu() {
    sidebar.classList.add('collapsed');
    main.classList.add('expanded');

    document.querySelectorAll('.submenu').forEach(submenu => {
        submenu.classList.remove('ativo');
    });
}

function alternarMenu() {
    sidebar.classList.toggle('collapsed');
    main.classList.toggle('expanded');

    if (sidebar.classList.contains('collapsed')) {
        document.querySelectorAll('.submenu').forEach(submenu => {
            submenu.classList.remove('ativo');
        });
    }
}

function toggleSubmenu(event, id) {
    event.preventDefault();

    if (sidebar.classList.contains('collapsed')) {
        abrirMenu();
    }

    const submenu = document.getElementById(id);
    const estaAtivo = submenu.classList.contains('ativo');

    document.querySelectorAll('.submenu').forEach(item => {
        item.classList.remove('ativo');
    });

    if (!estaAtivo) {
        submenu.classList.add('ativo');
    }
}

logoToggle.addEventListener('click', alternarMenu);

/* Fecha o menu ao clicar em links normais e submenu */
document.querySelectorAll('.menu-link[target="iframePrincipal"], .submenu-link[target="iframePrincipal"]').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth > 768) {
            setTimeout(() => {
                fecharMenu();
            }, 150);
        }
    });
});

function exibirMensagemMotivacional() {
    const agora = new Date();
    const hora = agora.getHours();
    const mensagemEl = document.getElementById('mensagemMotivacional');

    const frases = [
        "Acredite no seu talento e vá além!",
        "Cada paciente é uma oportunidade de fazer a diferença.",
        "O sucesso é construído nos detalhes. Capriche!",
        "Sorriso no rosto e foco no propósito!",
        "Deus abençoe seu dia de trabalho!",
        "Pequenas atitudes constroem grandes resultados.",
        "Seja luz no dia de alguém hoje.",
        "Nada resiste a uma mente determinada."
    ];

    let saudacao = "";
    let frase = "";

    if (hora >= 0 && hora < 12) {
        saudacao = "Bom Dia";
        frase = frases[Math.floor(Math.random() * frases.length)];
    } else if (hora >= 12 && hora < 18) {
        saudacao = "Boa Tarde";
        frase = frases[Math.floor(Math.random() * frases.length)];
    } else {
        saudacao = "Boa Noite";
        frase = "Chega por hoje, bora pra casa descansar!";
    }

    mensagemEl.textContent = `${saudacao}, Dra. Cinthia: ${frase}`;
}

exibirMensagemMotivacional();

function sair() {
    sessionStorage.removeItem('logado');
    window.top.location.href = 'index.html';
}

/* começa com menu fechado */
window.addEventListener('load', () => {
    fecharMenu();
});

window.addEventListener('DOMContentLoaded', () => {
    verificarAniversariantes();
    verificarLembretesManutencao();
});

if (lembreteManutencoes) {
    lembreteManutencoes.addEventListener('click', () => {
        if (iframePrincipal) {
            iframePrincipal.src = 'retorno-pacientes.html?filtro=atencao';
        }

        fecharMenu();
    });
}

if (iframePrincipal) {
    iframePrincipal.addEventListener('load', () => {
        verificarLembretesManutencao();
    });
}

async function verificarLembretesManutencao() {
    if (!lembreteManutencoes || !textoLembreteManutencoes) return;

    try {
        const resposta = await fetch('http://localhost:3000/api/manutencoes/lembretes');
        if (!resposta.ok) throw new Error('Erro ao buscar lembretes.');

        const dados = await resposta.json();
        const total = Number(dados.total) || 0;

        if (total <= 0) {
            lembreteManutencoes.hidden = true;
            textoLembreteManutencoes.textContent = '';
            return;
        }

        lembreteManutencoes.hidden = false;
        textoLembreteManutencoes.textContent = total === 1
            ? '1 paciente precisa de contato para manutenção.'
            : `${total} pacientes precisam de contato para manutenção.`;
    } catch (error) {
        console.error('Erro ao verificar manutenções:', error);
        lembreteManutencoes.hidden = true;
    }
}

async function verificarAniversariantes() {
    try {
        const resposta = await fetch('http://localhost:3000/api/pacientes/aniversariantes-hoje');
        const aniversariantes = await resposta.json();

        if (!Array.isArray(aniversariantes) || aniversariantes.length === 0) return;

        aniversariantes.forEach((paciente, index) => {
            criarPopupAniversario(paciente, index);
        });

    } catch (error) {
        console.error('Erro ao verificar aniversariantes:', error);
    }
}

function criarPopupAniversario(paciente, index) {
    const popup = document.createElement('div');
    popup.className = 'popup-aniversario';

    popup.style.top = `${125 + index * 66}px`;

    const primeiroNome = paciente.nome.split(' ')[0];

    popup.innerHTML = `
        <span class="nome-aniversariante">${primeiroNome}</span>
        <span class="emoji-aniversario">🥳</span>
    `;

    popup.addEventListener('click', () => {
        const telefoneLimpo = paciente.telefone ? paciente.telefone.replace(/\D/g, '') : '';

        if (!telefoneLimpo) {
            alert('Esse paciente não possui telefone cadastrado.');
            return;
        }

        const mensagem = encodeURIComponent(
            `Olá, ${primeiroNome}! \n\n` +
            `Passando para te desejar um feliz aniversário.\n` +
            `Que seu novo ciclo seja cheio de saúde, felicidade e muitos motivos para sorrir.\n\n` +
            `E para celebrar esse mês especial, preparei uma condição exclusiva de *20% de desconto* nos tratamentos realizados durante o mês do seu aniversário.\n\n` +
            `Com carinho,\n`+
            `Dra. Cinthia Leone,`
            
        );

        window.open(`https://wa.me/55${telefoneLimpo}?text=${mensagem}`, '_blank');

        popup.remove();
    });

    document.body.appendChild(popup);
}
