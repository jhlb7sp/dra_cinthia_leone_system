const express = require('express');
const router = express.Router();
const Anamnese = require('../models/Anamnese');

router.post('/cadastrar', async (req, res) => {
    try {
        const anamnese = new Anamnese(req.body);
        await anamnese.save();
        res.status(201).json({ message: 'Anamnese salva com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao salvar anamnese' });
    }
});

module.exports = router;
