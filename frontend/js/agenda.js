console.log('AGENDA carregada com sucesso!');

const CLIENT_ID = '1079160835966-4f99cdqvfvshobaeo55d6a1b4m7jcbmp.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const TOKEN_STORAGE_KEY = 'googleToken';
const DRAFT_MANUTENCAO_KEY = 'rascunhoAgendamentoManutencao';
const API_MANUTENCOES = 'http://localhost:3000/api/manutencoes';

let tokenClient = null;
let gapiReady = false;
let gisReady = false;
let calendarInitialized = false;
let eventosConfigurados = false;
let silentRefreshAttempted = false;
let semanaAtual = new Date();
let pacienteSelecionado = null;
let pendingTokenRequest = null;
let rascunhoManutencao = null;

const elementos = {};

document.addEventListener('DOMContentLoaded', () => {
    mapearElementos();
    configurarEventosTela();
    mostrarEstadoCarregando();
    initializeCalendar();
});

function mapearElementos() {
    elementos.agendaDiv = document.getElementById('agenda');
    elementos.btnLogin = document.getElementById('btn-login');
    elementos.btnLogout = document.getElementById('btn-logout');
    elementos.btnAgendar = document.getElementById('btn-agendar');
    elementos.btnAnterior = document.getElementById('btn-anterior');
    elementos.btnProxima = document.getElementById('btn-proxima');
    elementos.novoAgendamento = document.getElementById('novo-agendamento');
    elementos.controles = document.getElementById('controles');
    elementos.inputPaciente = document.getElementById('paciente');
    elementos.sugestoesPacientes = document.getElementById('sugestoes-pacientes');
    elementos.horaInicio = document.getElementById('hora-inicio');
    elementos.dataAgendamento = document.getElementById('data-agendamento');
}

function configurarEventosTela() {
    if (eventosConfigurados) return;
    eventosConfigurados = true;

    elementos.inputPaciente.addEventListener('input', buscarPacientesAgenda);
    elementos.btnLogin.addEventListener('click', loginGoogle);
    elementos.btnLogout.addEventListener('click', logoutGoogle);
    elementos.btnAgendar.addEventListener('click', agendarEvento);

    elementos.horaInicio.addEventListener('change', () => {
        const inicio = elementos.horaInicio.value;
        if (!inicio) return;

        const [h, m] = inicio.split(':').map(Number);
        const date = new Date();
        date.setHours(h);
        date.setMinutes(m + 30);

        document.getElementById('hora-fim').value =
            `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    });

    elementos.btnAnterior.addEventListener('click', () => {
        semanaAtual.setDate(semanaAtual.getDate() - 7);
        carregarAgenda();
    });

    elementos.btnProxima.addEventListener('click', () => {
        semanaAtual.setDate(semanaAtual.getDate() + 7);
        carregarAgenda();
    });
}

async function initializeCalendar() {
    if (calendarInitialized) {
        console.log('Agenda já inicializada. Ignorando inicialização duplicada.');
        return;
    }

    calendarInitialized = true;

    try {
        await Promise.all([
            initializeGapi(),
            initializeGis()
        ]);

        const tokenSalvo = obterTokenSalvoValido();

        if (tokenSalvo) {
            console.log('Token restaurado.');
            gapi.client.setToken({ access_token: tokenSalvo.access_token });
            mostrarEstadoAutenticado();
            carregarAgenda();
            return;
        }

        const tokenExpirado = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (tokenExpirado) {
            console.log('Token expirado.');
            limparTokenSalvo();
            await tentarNovaAutorizacaoSilenciosa();
            return;
        }

        console.log('Nova autorização necessária.');
        mostrarEstadoNaoAutenticado();
    } catch (error) {
        console.error('Falha ao carregar biblioteca Google:', error);
        calendarInitialized = false;
        mostrarEstadoFalhaBibliotecas();
    }
}

function initializeGapi() {
    if (gapiReady) return Promise.resolve();

    return esperarGlobal(
        () => window.gapi,
        'Google API Client'
    ).then(() => new Promise((resolve, reject) => {
        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
                });

                gapiReady = true;
                console.log('GAPI carregado.');
                resolve();
            } catch (error) {
                console.error('Falha ao inicializar GAPI:', error);
                reject(error);
            }
        });
    }));
}

function initializeGis() {
    if (gisReady && tokenClient) return Promise.resolve();

    return esperarGlobal(
        () => window.google?.accounts?.oauth2,
        'Google Identity Services'
    ).then(() => {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: tratarTokenResponse,
            error_callback: (error) => {
                console.error('Falha no Google Identity Services:', error);

                if (pendingTokenRequest) {
                    pendingTokenRequest.reject(error);
                    pendingTokenRequest = null;
                }
            }
        });

        gisReady = true;
        console.log('Google Identity Services carregado.');
    });
}

function esperarGlobal(verificar, nomeBiblioteca, tentativas = 80) {
    return new Promise((resolve, reject) => {
        let tentativaAtual = 0;

        const timer = setInterval(() => {
            if (verificar()) {
                clearInterval(timer);
                resolve();
                return;
            }

            tentativaAtual++;

            if (tentativaAtual >= tentativas) {
                clearInterval(timer);
                reject(new Error(`${nomeBiblioteca} não carregou dentro do tempo esperado.`));
            }
        }, 100);
    });
}

function tratarTokenResponse(tokenResponse) {
    if (!tokenResponse || tokenResponse.error) {
        const error = tokenResponse?.error || 'Resposta de token inválida.';
        console.error('Erro ao obter token Google:', tokenResponse);

        if (pendingTokenRequest) {
            pendingTokenRequest.reject(new Error(error));
            pendingTokenRequest = null;
        }

        mostrarEstadoNaoAutenticado();
        return;
    }

    const tokenSalvo = salvarToken(tokenResponse);
    gapi.client.setToken({ access_token: tokenSalvo.access_token });
    mostrarEstadoAutenticado();
    carregarAgenda();

    if (pendingTokenRequest) {
        pendingTokenRequest.resolve(tokenSalvo);
        pendingTokenRequest = null;
    }
}

function salvarToken(tokenResponse) {
    const expiresIn = Number(tokenResponse.expires_in) || 3600;
    const tokenSalvo = {
        access_token: tokenResponse.access_token,
        expires_at: Date.now() + expiresIn * 1000,
        scope: tokenResponse.scope || SCOPES,
        token_type: tokenResponse.token_type || 'Bearer'
    };

    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenSalvo));
    return tokenSalvo;
}

function obterTokenSalvoValido() {
    try {
        const bruto = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (!bruto) return null;

        const token = JSON.parse(bruto);
        const expiraEm = Number(token.expires_at) || 0;
        const margemSeguranca = 60 * 1000;

        if (!token.access_token || expiraEm <= Date.now() + margemSeguranca) {
            return null;
        }

        return token;
    } catch (error) {
        console.error('Erro ao ler token salvo:', error);
        limparTokenSalvo();
        return null;
    }
}

function limparTokenSalvo() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function tentarNovaAutorizacaoSilenciosa() {
    if (silentRefreshAttempted) {
        console.log('Tentativa silenciosa já realizada. Exibindo login.');
        mostrarEstadoNaoAutenticado();
        return;
    }

    silentRefreshAttempted = true;

    try {
        console.log('Tentando renovar autorização silenciosamente.');
        await requestAccessTokenSeguro({ prompt: '' });
    } catch (error) {
        console.warn('Nova autorização necessária.', error);
        mostrarEstadoNaoAutenticado();
    }
}

function requestAccessTokenSeguro(options = {}) {
    if (!gisReady || !tokenClient || !window.google?.accounts?.oauth2) {
        return Promise.reject(new Error('Google Identity Services ainda não está pronto.'));
    }

    return new Promise((resolve, reject) => {
        pendingTokenRequest = { resolve, reject };

        try {
            tokenClient.requestAccessToken(options);
        } catch (error) {
            pendingTokenRequest = null;
            reject(error);
        }
    });
}

async function loginGoogle() {
    try {
        elementos.btnLogin.disabled = true;

        if (!gisReady || !tokenClient || !window.google?.accounts?.oauth2) {
            alert('A biblioteca do Google ainda não carregou. Aguarde alguns segundos e tente novamente.');
            console.warn('Login bloqueado: GIS não inicializado.');
            mostrarEstadoNaoAutenticado();
            return;
        }

        await requestAccessTokenSeguro({ prompt: 'consent' });
    } catch (error) {
        console.error('Erro no login Google:', error);
        alert('Não foi possível abrir a autorização do Google. Tente novamente.');
        mostrarEstadoNaoAutenticado();
    }
}

function logoutGoogle() {
    const tokenAtual = gapi.client.getToken();

    if (tokenAtual?.access_token && window.google?.accounts?.oauth2) {
        google.accounts.oauth2.revoke(tokenAtual.access_token, () => {
            console.log('Token Google revogado.');
        });
    }

    gapi.client.setToken(null);
    limparTokenSalvo();
    elementos.agendaDiv.innerHTML = 'Faça login para ver a agenda.';
    mostrarEstadoNaoAutenticado();
}

function mostrarEstadoCarregando() {
    elementos.btnLogin.disabled = true;
    elementos.btnLogin.textContent = 'Carregando Google...';
    elementos.btnLogin.style.display = 'inline-block';
    elementos.btnLogout.style.display = 'none';
    elementos.controles.style.display = 'none';
    elementos.novoAgendamento.style.display = 'none';
    elementos.agendaDiv.innerHTML = 'Carregando integração com Google Calendar...';
}

function mostrarEstadoNaoAutenticado() {
    elementos.btnLogin.disabled = false;
    elementos.btnLogin.textContent = 'Entrar com Google';
    elementos.btnLogin.style.display = 'inline-block';
    elementos.btnLogout.style.display = 'none';
    elementos.controles.style.display = 'none';
    elementos.novoAgendamento.style.display = 'none';
    elementos.agendaDiv.innerHTML = 'Faça login para ver a agenda.';
}

function mostrarEstadoAutenticado() {
    elementos.btnLogin.disabled = false;
    elementos.btnLogin.textContent = 'Entrar com Google';
    elementos.btnLogin.style.display = 'none';
    elementos.btnLogout.style.display = 'inline-block';
    elementos.controles.style.display = 'block';
    elementos.novoAgendamento.style.display = 'flex';
    aplicarRascunhoManutencao();
}

function mostrarEstadoFalhaBibliotecas() {
    elementos.btnLogin.disabled = false;
    elementos.btnLogin.textContent = 'Entrar com Google';
    elementos.btnLogin.style.display = 'inline-block';
    elementos.btnLogout.style.display = 'none';
    elementos.controles.style.display = 'none';
    elementos.novoAgendamento.style.display = 'none';
    elementos.agendaDiv.innerHTML = 'Não foi possível carregar a integração com Google. Verifique a conexão e tente novamente.';
}

function aplicarRascunhoManutencao() {
    if (rascunhoManutencao) return;

    try {
        const bruto = sessionStorage.getItem(DRAFT_MANUTENCAO_KEY);
        if (!bruto) return;

        rascunhoManutencao = JSON.parse(bruto);
        sessionStorage.removeItem(DRAFT_MANUTENCAO_KEY);

        pacienteSelecionado = {
            _id: rascunhoManutencao.pacienteId || '',
            nome: rascunhoManutencao.pacienteNome || '',
            telefone: rascunhoManutencao.telefone || ''
        };

        elementos.inputPaciente.value = rascunhoManutencao.pacienteNome || '';

        if (rascunhoManutencao.dataSugerida && /^\d{4}-\d{2}-\d{2}$/.test(rascunhoManutencao.dataSugerida)) {
            elementos.dataAgendamento.value = rascunhoManutencao.dataSugerida;
            semanaAtual = criarDataLocal(rascunhoManutencao.dataSugerida);
        }

        console.log('Rascunho de manutenção carregado na agenda.');
    } catch (error) {
        console.error('Erro ao carregar rascunho de manutenção:', error);
        rascunhoManutencao = null;
    }
}

async function buscarPacientesAgenda() {
    const nome = elementos.inputPaciente.value.trim();
    pacienteSelecionado = null;

    if (nome.length < 2) {
        elementos.sugestoesPacientes.innerHTML = '';
        elementos.sugestoesPacientes.style.display = 'none';
        return;
    }

    try {
        const res = await fetch(`/api/pacientes?nome=${encodeURIComponent(nome)}`);
        const pacientes = await res.json();

        elementos.sugestoesPacientes.innerHTML = '';

        if (!pacientes.length) {
            elementos.sugestoesPacientes.style.display = 'none';
            return;
        }

        pacientes.forEach(paciente => {
            const div = document.createElement('div');
            div.className = 'sugestao-paciente';
            div.textContent = paciente.nome;

            div.addEventListener('click', () => {
                pacienteSelecionado = paciente;
                elementos.inputPaciente.value = paciente.nome;
                elementos.sugestoesPacientes.innerHTML = '';
                elementos.sugestoesPacientes.style.display = 'none';
            });

            elementos.sugestoesPacientes.appendChild(div);
        });

        elementos.sugestoesPacientes.style.display = 'block';
    } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
    }
}

function gerarGradeAgenda(startDate) {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let html = `<table class="agenda-table"><thead><tr><th>Horário</th>`;

    const sunday = new Date(startDate);
    sunday.setDate(sunday.getDate() - sunday.getDay());

    for (let i = 0; i < 7; i++) {
        const data = new Date(sunday);
        data.setDate(sunday.getDate() + i);
        const dataStr = `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}`;
        html += `<th>${diasSemana[i]}<br><small>${dataStr}</small></th>`;
    }

    html += `</tr></thead><tbody>`;

    for (let h = 8; h <= 20; h++) {
        for (let m = 0; m < 60; m += 30) {
            const horaStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            html += `<tr><td>${horaStr}</td>`;
            for (let d = 0; d < 7; d++) {
                html += `<td data-dia="${d}" data-hora="${horaStr}"></td>`;
            }
            html += `</tr>`;
        }
    }

    html += `</tbody></table>`;
    elementos.agendaDiv.innerHTML = html;
}

function ocultarLinhasVazias() {
    const linhas = document.querySelectorAll('.agenda-table tbody tr');

    linhas.forEach(linha => {
        const celulas = linha.querySelectorAll('td:not(:first-child)');
        let ocupado = false;

        celulas.forEach(celula => {
            if (celula.classList.contains('ocupado')) {
                ocupado = true;
            }
        });

        if (!ocupado) {
            linha.style.display = 'none';
        }
    });
}

function carregarAgenda() {
    const tokenAtual = gapi.client.getToken();
    if (!tokenAtual?.access_token) {
        console.log('Agenda não carregada: token ausente.');
        mostrarEstadoNaoAutenticado();
        return;
    }

    const dataInicio = document.getElementById('data-inicio')?.value;
    const startDate = dataInicio ? new Date(dataInicio) : semanaAtual;

    gerarGradeAgenda(startDate);

    const sunday = new Date(startDate);
    sunday.setDate(sunday.getDate() - sunday.getDay());

    const endDate = new Date(sunday);
    endDate.setDate(sunday.getDate() + 7);

    gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: sunday.toISOString(),
        timeMax: endDate.toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime'
    }).then(response => {
        const events = response.result.items || [];

        events.forEach(event => {
            if (!event.start?.dateTime || !event.end?.dateTime) return;

            const start = new Date(event.start.dateTime);
            const end = new Date(event.end.dateTime);
            const paciente = event.summary || '(Sem descrição)';
            const eventId = event.id;
            const diaSemana = start.getDay();

            let horaAtual = new Date(start);
            while (horaAtual < end) {
                const horaStr = `${horaAtual.getHours().toString().padStart(2, '0')}:${horaAtual.getMinutes().toString().padStart(2, '0')}`;
                const celula = document.querySelector(`td[data-dia="${diaSemana}"][data-hora="${horaStr}"]`);

                if (celula) {
                    const telefone = event.extendedProperties?.private?.telefone || '';
                    celula.innerHTML = `
                        <span class="nome-agendamento" onclick="abrirWhatsApp('${telefone}', '${escapeAtributo(paciente)}', '${start.toISOString()}')">${escapeHtml(paciente)}</span>
                        <span class="btn-excluir" onclick="excluirEvento('${eventId}')">✖</span>
                    `;
                    celula.classList.add('ocupado');
                }

                horaAtual.setMinutes(horaAtual.getMinutes() + 30);
            }
        });

        ocultarLinhasVazias();
        console.log('Eventos carregados.');
    }, err => {
        console.error('Erro ao carregar compromissos:', err);

        if (err?.status === 401 || err?.result?.error?.code === 401) {
            limparTokenSalvo();
            gapi.client.setToken(null);
            tentarNovaAutorizacaoSilenciosa();
            return;
        }

        elementos.agendaDiv.innerHTML = 'Erro ao carregar agenda.';
    });
}

function agendarEvento() {
    const paciente = document.getElementById('paciente').value;
    const data = document.getElementById('data-agendamento').value;
    const horaInicio = document.getElementById('hora-inicio').value;
    const horaFim = document.getElementById('hora-fim').value;

    if (!gapi.client.getToken()?.access_token) {
        alert('Entre com o Google antes de agendar.');
        return;
    }

    if (!paciente || !data || !horaInicio || !horaFim) {
        alert('Preencha todos os campos!');
        return;
    }

    const inicio = new Date(`${data}T${horaInicio}:00`);
    const fim = new Date(`${data}T${horaFim}:00`);

    if (fim <= inicio) {
        alert('A hora de fim deve ser depois da hora de início.');
        return;
    }

    gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: {
            summary: paciente,
            start: { dateTime: inicio.toISOString() },
            end: { dateTime: fim.toISOString() },
            extendedProperties: {
                private: {
                    pacienteId: pacienteSelecionado?._id || '',
                    telefone: pacienteSelecionado?.celular || pacienteSelecionado?.telefone || '',
                    manutencaoId: rascunhoManutencao?.manutencaoId || ''
                }
            }
        }
    }).then(async () => {
        await marcarManutencaoComoAgendada();
        alert('Agendamento criado!');
        carregarAgenda();
    }, err => {
        console.error('Erro ao agendar:', err);
        alert('Erro ao agendar.');
    });
}

async function marcarManutencaoComoAgendada() {
    if (!rascunhoManutencao?.manutencaoId) return;

    try {
        const resposta = await fetch(`${API_MANUTENCOES}/${rascunhoManutencao.manutencaoId}/situacao`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                situacao: 'agendado',
                usuario: sessionStorage.getItem('usuarioLogado') || ''
            })
        });

        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || 'Erro ao marcar manutenção como agendada.');

        console.log('Manutenção marcada como agendada.');
        rascunhoManutencao = null;
    } catch (error) {
        console.error('Agendamento criado, mas não foi possível atualizar a manutenção:', error);
        alert('Agendamento criado, mas não foi possível marcar a manutenção como agendada.');
    }
}

window.excluirEvento = function (eventId) {
    if (confirm('Deseja realmente excluir este agendamento?')) {
        gapi.client.calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId
        }).then(() => {
            alert('Agendamento excluído com sucesso!');
            carregarAgenda();
        }, err => {
            console.error('Erro ao excluir evento:', err);
            alert('Erro ao excluir o agendamento.');
        });
    }
};

window.abrirWhatsApp = function (telefone, paciente, dataISO) {
    if (!telefone) {
        alert('Esse paciente não possui telefone cadastrado nesse agendamento.');
        return;
    }

    const data = new Date(dataISO);

    const dataFormatada = data.toLocaleDateString('pt-BR');
    const horaFormatada = data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const telefoneLimpo = telefone.replace(/\D/g, '');

    const mensagem = `Olá, \n` +
        `tudo bem? \n` +
        `Passando para confirmar seu horário com a Dra. Cinthia Leone no dia de hoje, ${dataFormatada} às ${horaFormatada}. Podemos confirmar sua presença?`;

    const url = `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, '_blank');
};

function escapeHtml(valor) {
    return String(valor || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function escapeAtributo(valor) {
    return String(valor || '')
        .replaceAll('\\', '\\\\')
        .replaceAll("'", "\\'")
        .replaceAll('\n', ' ');
}

function criarDataLocal(dataTexto) {
    const [ano, mes, dia] = dataTexto.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
}
