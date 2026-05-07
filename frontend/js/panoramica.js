function gerarPedidoPanoramica() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const paciente = document.getElementById('paciente').value;


    for (let via = 1; via < 2; via++) {
        if (via > 1) doc.addPage();


        // Marca d'água no centro da página
        doc.addImage(logoBase642, 'PNG', 30, 90, 150, 150);
        // Adiciona logo no topo
        doc.addImage(logoBase64, 'PNG', 30, 10, 150, 23);

        // Caixa de identificação do eminente (ajustada pra descer)
        doc.setFontSize(10);
        const inicioY = 45; // nova posição abaixo do logo
        //cnpj
        doc.setFont(undefined, 'normal');
        doc.text(cnpj, 155, 44);

        doc.setFontSize(12);
        doc.rect(15, inicioY, 180, 30);
        doc.setFont(undefined, 'bold');
        doc.text(idEminente, 70, inicioY + 7);
        doc.line(15, inicioY + 9, 195, inicioY + 9);
        doc.line(15, inicioY + 9, 195, inicioY + 9);

        doc.setFont(undefined, 'bold');
        doc.text("Nome:", 20, inicioY + 15);

        doc.setFont(undefined, 'normal');
        doc.text(cinthia, 35, inicioY + 15);

        doc.setFont(undefined, 'bold');
        doc.text("CRO:", 85, inicioY + 15);

        doc.setFont(undefined, 'normal');
        doc.text(cro, 100, inicioY + 15);

        doc.setFont(undefined, 'bold');
        doc.text("Data:", 20, inicioY + 23);

        doc.setFont(undefined, 'normal');
        doc.text(new Date().toLocaleDateString(), 35, inicioY + 23);

        doc.setFont(undefined, 'bold');
        doc.text("-    São Paulo - SP", 60, inicioY + 23);

        // Palavra "Paciente:" em negrito
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Paciente:', 20, inicioY + 37);

        // Nome do paciente normal, logo depois
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.text(paciente, 45, inicioY + 37); // 50 é a posição X ajustada para ficar depois de "Paciente:"


        // Título Prescrição
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.text("Solicito,", 20, inicioY + 57, { align: 'left' });

        // Lista de medicamentos
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text("Radiografia panorâmica para fins diagnósticos.", 20, inicioY + 67);

        doc.setFont(undefined, 'bold');
        doc.text('Obs:', 20, inicioY + 97);

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text("favor enviar para o seguinte e-mail:", 33, inicioY + 97);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(email, 100, inicioY + 97);


        // Ass se houver
        if (assinatura.checked) {
            y = 200;
            doc.addImage(carimbo, 'PNG', 135, 215, 38, 38);
        }
        //Assinatura
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(ass1, 130, inicioY + 205);
        doc.text(ass2, 130, inicioY + 210);

        // Rodapé
        doc.setFontSize(9);
        doc.text(endereco, 50, 275);
        doc.text(telefone, 80, 280);
    }

    doc.save(`Solicitação_Panoramica_${paciente}.pdf`);
}