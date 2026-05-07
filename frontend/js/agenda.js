console.log("AGENDA carregada com sucesso!");

const CLIENT_ID = '1079160835966-4f99cdqvfvshobaeo55d6a1b4m7jcbmp.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar';
let tokenClient;
let gapiIniciado = false;
let gisIniciado = false;
let semanaAtual = new Date();

window.addEventListener('DOMContentLoaded', () => {
    const agendaDiv = document.getElementById('agenda');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const btnAgendar = document.getElementById('btn-agendar');
    const btnAnterior = document.getElementById('btn-anterior');
    const btnProxima = document.getElementById('btn-proxima');
    const savedToken = localStorage.getItem('googleToken');

    let pacienteSelecionado = null;

    const inputPaciente = document.getElementById('paciente');
    const sugestoesPacientes = document.getElementById('sugestoes-pacientes');

    inputPaciente.addEventListener('input', async () => {
        const nome = inputPaciente.value.trim();
        pacienteSelecionado = null;

        if (nome.length < 2) {
            sugestoesPacientes.innerHTML = '';
            sugestoesPacientes.style.display = 'none';
            return;
        }

        try {
            const res = await fetch(`/api/pacientes?nome=${encodeURIComponent(nome)}`);
            const pacientes = await res.json();

            sugestoesPacientes.innerHTML = '';

            if (!pacientes.length) {
                sugestoesPacientes.style.display = 'none';
                return;
            }

            pacientes.forEach(paciente => {
                const div = document.createElement('div');
                div.className = 'sugestao-paciente';
                div.textContent = paciente.nome;

                div.addEventListener('click', () => {
                    pacienteSelecionado = paciente;
                    inputPaciente.value = paciente.nome;
                    sugestoesPacientes.innerHTML = '';
                    sugestoesPacientes.style.display = 'none';
                });

                sugestoesPacientes.appendChild(div);
            });

            sugestoesPacientes.style.display = 'block';

        } catch (error) {
            console.error('Erro ao buscar pacientes:', error);
        }
    });

    // Carregar a API Google Client
    function gapiLoad() {
        gapi.load('client', initializeGapiClient);
    }

    async function initializeGapiClient() {
        await gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        });
        gapiIniciado = true;
    }

    // Google Identity Services (OAuth)
    function gisLoad() {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            prompt: 'consent',
            callback: (tokenResponse) => {
                gapi.client.setToken(tokenResponse);
                localStorage.setItem('googleToken', JSON.stringify(tokenResponse));
                carregarAgenda();
                btnLogout.style.display = 'inline-block';
                btnLogin.style.display = 'none';
                document.getElementById('controles').style.display = 'block';
                document.getElementById('novo-agendamento').style.display = 'block';
            },
        });
        gisIniciado = true;
    }

    // Montar grade semanal de horários
    function gerarGradeAgenda(startDate) {
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        let html = `<table class="agenda-table"><thead><tr><th>Horário</th>`;

        // Encontrar o domingo da semana de startDate
        const sunday = new Date(startDate);
        sunday.setDate(sunday.getDate() - sunday.getDay());  // Pula pra domingo

        // Cabeçalho com dia fixo + data
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
        agendaDiv.innerHTML = html;
    }

    //Ocultar Linhas vazias
    function ocultarLinhasVazias() {
        const linhas = document.querySelectorAll(".agenda-table tbody tr");

        linhas.forEach(linha => {
            const celulas = linha.querySelectorAll("td:not(:first-child)");
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


    // Carregar agenda do Google Calendar e preencher tabela
    function carregarAgenda() {
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
            const events = response.result.items;
            if (!events || events.length === 0) {
                return;
            }

            events.forEach(event => {
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
    <span class="nome-agendamento" onclick="abrirWhatsApp('${telefone}', '${paciente}', '${start.toISOString()}')">${paciente}</span>
    <span class="btn-excluir" onclick="excluirEvento('${eventId}')">✖</span>
`;
                        celula.classList.add('ocupado');
                    }
                    horaAtual.setMinutes(horaAtual.getMinutes() + 30);
                }
            });
            ocultarLinhasVazias();

        }, err => {
            console.error('Erro ao carregar compromissos: ', err);
            agendaDiv.innerHTML = 'Erro ao carregar agenda.';
        });
    }



    // Inicialização das APIs
    gapiLoad();
    gisLoad();

    const checkApis = setInterval(() => {
        if (gapiIniciado && gisIniciado) {
            clearInterval(checkApis);
            if (savedToken) {
                const tokenResponse = JSON.parse(savedToken);
                gapi.client.setToken(tokenResponse);
                carregarAgenda();
                btnLogout.style.display = 'inline-block';
                btnLogin.style.display = 'none';
                document.getElementById('controles').style.display = 'block';
                document.getElementById('novo-agendamento').style.display = 'block';
            }
        }
    }, 200);

    // Botão login
    btnLogin.addEventListener('click', () => {
        if (gapiIniciado && gisIniciado) {
            tokenClient.requestAccessToken();
        } else {
            alert('Google API não carregada. Aguarde...');
        }
    });

    // Botão logout
    btnLogout.addEventListener('click', () => {
        google.accounts.oauth2.revoke(gapi.client.getToken().access_token);
        gapi.client.setToken('');
        localStorage.removeItem('googleToken');
        agendaDiv.innerHTML = 'Faça login para ver a agenda.';
        btnLogout.style.display = 'none';
        btnLogin.style.display = 'inline-block';
        document.getElementById('controles').style.display = 'none';
        document.getElementById('novo-agendamento').style.display = 'none';
    });

    // Agendar evento
    btnAgendar.addEventListener('click', () => {
        const paciente = document.getElementById('paciente').value;
        const data = document.getElementById('data-agendamento').value;
        const horaInicio = document.getElementById('hora-inicio').value;
        const horaFim = document.getElementById('hora-fim').value;

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
                        telefone: pacienteSelecionado?.celular || pacienteSelecionado?.telefone || ''
                    }
                }
            }
        }).then(() => {
            alert('Agendamento criado!');
            carregarAgenda();
        }, err => {
            console.error('Erro ao agendar:', err);
            alert('Erro ao agendar.');
        });
    });

    document.getElementById('hora-inicio').addEventListener('change', () => {
        const inicio = document.getElementById('hora-inicio').value;
        if (inicio) {
            const [h, m] = inicio.split(':').map(Number);
            const date = new Date();
            date.setHours(h);
            date.setMinutes(m + 30); // soma 30 min

            const horaFim = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            document.getElementById('hora-fim').value = horaFim;
        }
    });

    // Navegar semanas
    btnAnterior.addEventListener('click', () => {
        semanaAtual.setDate(semanaAtual.getDate() - 7);
        carregarAgenda();
    });

    btnProxima.addEventListener('click', () => {
        semanaAtual.setDate(semanaAtual.getDate() + 7);
        carregarAgenda();
    });

    //Excluir evento
    window.excluirEvento = function (eventId) {
        if (confirm("Deseja realmente excluir este agendamento?")) {
            gapi.client.calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId
            }).then(() => {
                alert("Agendamento excluído com sucesso!");
                carregarAgenda();
            }, err => {
                console.error("Erro ao excluir evento:", err);
                alert("Erro ao excluir o agendamento.");
            });
        }
    }

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

});