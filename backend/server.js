//server.js

require('dotenv').config();

const express = require('express');

const app = express();

const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const { MongoClient, ObjectId } = require('mongodb');

const Orcamento = require('./models/Orcamento');

// Rotas externas
const controleFisicoRoutes = require('./routes/controleFisicoRoutes');
const controleBiologicoRoutes = require('./routes/controleBiologicoRoutes');
const materiaisRoutes = require('./routes/materiais');
const pacientesRouter = require('./routes/pacientes');
const medicamentosRoute = require('./routes/medicamentos');
const procedimentosRoute = require('./routes/procedimentos');
const orcamentosRoutes = require('./routes/orcamentos');
const notasRoutes = require('./routes/notasRoutes');
const manutencoesRoutes = require('./routes/manutencoes');

app.use('/api/notas', notasRoutes);
app.use('/uploads', express.static('uploads'));



// só depois que o app existe
app.use('/api', orcamentosRoutes);

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

//Materiais
app.use('/api', materiaisRoutes);
//PacientesAutoComplete
app.use('/api', pacientesRouter);
//Medicamentos
app.use('/api/medicamentos', medicamentosRoute);
//Procedimentos
app.use('/api/procedimentos', procedimentosRoute);
//Manutenções
app.use('/api/manutencoes', manutencoesRoutes);
//Relatorio
const relatorioRoutes = require('./routes/relatorio');
app.use('/relatorio', relatorioRoutes);

app.use('/libs', express.static(path.join(__dirname, '../frontend/libs')));

// Configuração MongoDB
const url = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'consultorio';

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: dbName
});


// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ROTAS DE LOGIN, PACIENTES, ANAMNESES E TRATAMENTOS
// -------------------------

app.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;
  const client = new MongoClient(url);
  try {
    await client.connect();
    const user = await client.db(dbName).collection('user').findOne({ username: usuario });
    if (user && user.password === senha) {
      res.json({ sucesso: true, usuario: user.username });
    } else {
      res.json({ sucesso: false });
    }
  } catch (err) {
    res.status(500).send('Erro no servidor');
  } finally {
    await client.close();
  }
});
//Salvar faturamento BD
app.post('/api/faturamento', async (req, res) => {
  const { data, tipo, descricao, valor, pagamento } = req.body;

  if (!data || !tipo || !descricao || valor == null || !pagamento) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  const client = new MongoClient(url);
  try {
    await client.connect();
    const resultado = await client.db(dbName).collection('faturamento').insertOne({
      data, tipo, descricao, valor, pagamento
    });

    res.status(201).json({ sucesso: true, id: resultado.insertedId });
  } catch (err) {
    console.error('Erro ao salvar lançamento:', err);
    res.status(500).send('Erro no servidor');
  } finally {
    await client.close();
  }
});
//Atualizar pagamento

// Atualizar pagamento
app.put('/api/faturamento/:id', async (req, res) => {
  const id = req.params.id;
  const { pagamento } = req.body;

  if (!pagamento) {
    return res.status(400).json({ error: 'Campo pagamento obrigatório.' });
  }

  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);

    const updateResult = await db.collection('faturamento').updateOne(
      { _id: new ObjectId(id) },
      { $set: { pagamento } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ sucesso: false, message: 'Lançamento não encontrado.' });
    }

    res.status(200).json({ sucesso: true });

  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar lançamento.' });
  } finally {
    await client.close();
  }
});


// Validar senha para excluir faturamento
app.post('/api/validar-senha', async (req, res) => {
  const { usuario, senha } = req.body;

  const client = new MongoClient(url);
  try {
    await client.connect();
    const user = await client.db(dbName).collection('user').findOne({ username: usuario });

    if (user && user.password === senha) {
      res.status(200).json({ sucesso: true });
    } else {
      res.status(401).json({ sucesso: false });
    }

  } catch (err) {
    console.error('Erro na validação de senha:', err);
    res.status(500).send('Erro no servidor');
  } finally {
    await client.close();
  }
});

// Cadastro paciente
app.post('/api/pacientes', async (req, res) => {
  const paciente = req.body;
  paciente.cpf = paciente.cpf.replace(/\D/g, '');
  const client = new MongoClient(url);
  try {
    await client.connect();
    const collection = client.db(dbName).collection('pacientes');
    const existente = await collection.findOne({ cpf: paciente.cpf });
    if (existente) return res.json({ sucesso: false, mensagem: 'CPF já cadastrado.' });
    const resultado = await collection.insertOne(paciente);
    res.json({ sucesso: true, id: resultado.insertedId, cpf: paciente.cpf });
  } catch (err) {
    res.status(500).send('Erro ao salvar paciente');
  } finally {
    await client.close();
  }
});

// Buscar paciente por CPF
app.get('/api/pacientes/cpf/:cpf', async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const paciente = await client.db(dbName).collection('pacientes').findOne({ cpf: req.params.cpf });
    if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' });
    res.json(paciente);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar paciente' });
  } finally {
    await client.close();
  }
});
//TESTE TESTE

// Consulta múltipla pacientes
app.get('/pacientes', async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const { nome, cpf, status } = req.query;
    let filtro = {};
    if (nome) filtro.nome = { $regex: nome, $options: 'i' };
    if (cpf) filtro.cpf = cpf;
    if (status && status !== "Todos") filtro.status = status;

    const resultados = await client.db(dbName).collection('pacientes').find(filtro).toArray();
    res.json(resultados);
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar pacientes' });
  } finally {
    await client.close();
  }
});

// Atualizar paciente
app.put('/api/pacientes/:cpf', async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const resultado = await client.db(dbName).collection('pacientes').findOneAndUpdate(
      { cpf: req.params.cpf },
      { $set: req.body },
      { returnDocument: 'after' }
    );
    if (!resultado.value) return res.status(404).json({ erro: 'Paciente não encontrado.' });
    res.json({ mensagem: 'Paciente atualizado', paciente: resultado.value });
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar paciente.' });
  } finally {
    await client.close();
  }
});

// Cadastro e atualização de anamneses
app.post('/api/anamneses/cadastrar', async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const paciente = await db.collection('pacientes').findOne({ cpf: req.body.cpf });
    if (!paciente) return res.status(404).json({ message: 'Paciente não encontrado' });

    await db.collection('anamneses').insertOne(req.body);
    res.status(200).json({ message: 'Anamnese salva com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao salvar anamnese' });
  } finally {
    await client.close();
  }
});

app.get('/api/anamneses/cpf/:cpf', async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const paciente = await client.db(dbName).collection('anamneses').findOne({ cpf: req.params.cpf });
    if (!paciente) return res.status(404).json({ error: 'Paciente não encontrado' });
    res.json(paciente);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar paciente' });
  } finally {
    await client.close();
  }
});

app.put('/api/anamneses/cpf/:cpf', async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const result = await client.db(dbName).collection('anamneses').findOneAndUpdate(
      { cpf: req.params.cpf },
      { $set: req.body },
      { returnDocument: 'after' }
    );
    if (!result.value) return res.status(404).json({ message: 'Anamnese não encontrada' });
    res.json({ message: 'Anamnese atualizada', anamnese: result.value });
  } catch {
    res.status(500).json({ message: 'Erro ao atualizar anamnese' });
  } finally {
    await client.close();
  }
});

// Tratamentos
app.get('/api/tratamentos/:cpf', async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const dados = await client.db(dbName).collection('tratamentos').find({ cpf: req.params.cpf }).toArray();
    res.json(dados);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar tratamentos.' });
  } finally {
    await client.close();
  }
});

app.post('/api/tratamentos/salvar', async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const cpf = req.body[0]?.cpf;
    if (cpf) await db.collection('tratamentos').deleteMany({ cpf });
    if (req.body.length) await db.collection('tratamentos').insertMany(req.body);
    res.status(200).json({ message: 'Tratamentos salvos com sucesso.' });
  } catch {
    res.status(500).json({ error: 'Erro ao salvar tratamentos.' });
  } finally {
    await client.close();
  }
});

//ORCAMENTOS

app.get('/api/orcamentos/item/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orcamento = await Orcamento.findById(id);

    if (!orcamento) {
      return res.status(404).json({ erro: 'Orçamento não encontrado' });
    }

    res.json(orcamento);
  } catch (error) {
    console.error('Erro ao buscar orçamento por ID:', error);
    res.status(500).json({ erro: 'Erro ao buscar orçamento' });
  }
});

// ROTAS AUTCLAVE
app.use('/api/controleFisico', controleFisicoRoutes);
app.use('/api/controleBiologico', controleBiologicoRoutes);


//LISTAR TODOS FATURAMENTO
app.get('/api/faturamento', async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const faturamentos = await client.db(dbName).collection('faturamento').find().toArray();
    res.status(200).json(faturamentos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lançamentos.' });
  } finally {
    await client.close();
  }
});

//CONSULTAR FATURAMENTO
app.get('/api/faturamento/filtro', async (req, res) => {
  const { inicio, fim } = req.query;

  const filtro = {};
  if (inicio && fim) {
    filtro.data = { $gte: inicio, $lte: fim };
  }

  try {
    const registros = await db.collection('faturamento').find(filtro).toArray();
    res.status(200).json(registros);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao filtrar lançamentos.' });
  }
});
//EXCLUIR FATURAMENTO
app.delete('/api/faturamento/:id', async (req, res) => {
  const id = req.params.id;
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    await db.collection('faturamento').deleteOne({ _id: new ObjectId(id) });
    res.status(200).json({ message: 'Lançamento removido.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir lançamento.' });
  } finally {
    await client.close();
  }
});

app.get('/api/orcamentos/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params;

    const orcamentos = await Orcamento.find({ cpf }).sort({ data: -1 });

    res.json(orcamentos);
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    res.status(500).json({ erro: 'Erro ao buscar orçamentos' });
  }
});

app.delete('/api/orcamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await Orcamento.findByIdAndDelete(id);

    res.json({ sucesso: true });
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    res.status(500).json({ erro: 'Erro ao excluir orçamento' });
  }
});

app.post('/api/orcamentos', async (req, res) => {
  try {
    const novoOrcamento = new Orcamento(req.body);
    await novoOrcamento.save();
    res.status(201).json({ sucesso: true, orcamento: novoOrcamento });
  } catch (error) {
    console.error('Erro ao salvar orçamento:', error);
    res.status(500).json({ erro: 'Erro ao salvar orçamento' });
  }
});

app.post('/api/orcamentos', async (req, res) => {
  try {
    const {
      cpf,
      paciente,
      procedimentos,
      desconto,
      parcelas,
      total,
      totalComDesconto
    } = req.body;

    if (!cpf || !paciente || !Array.isArray(procedimentos) || procedimentos.length === 0) {
      return res.status(400).json({ erro: 'Dados do orçamento incompletos.' });
    }

    const novoOrcamento = new Orcamento({
      cpf: String(cpf).replace(/\D/g, ''),
      paciente,
      procedimentos,
      desconto: Number(desconto) || 0,
      parcelas: Number(parcelas) || 1,
      total: Number(total) || 0,
      totalComDesconto: Number(totalComDesconto) || 0,
      data: new Date()
    });

    await novoOrcamento.save();

    res.status(201).json({
      sucesso: true,
      orcamento: novoOrcamento
    });
  } catch (error) {
    console.error('Erro ao salvar orçamento:', error);
    res.status(500).json({ erro: 'Erro ao salvar orçamento' });
  }
});


// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
