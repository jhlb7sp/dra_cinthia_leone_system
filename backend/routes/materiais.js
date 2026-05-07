const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');

const url = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'consultorio';

// Cadastrar novo material
router.post('/materiais', async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const resultado = await db.collection('materiais').insertOne(req.body);
    res.status(201).json({ ...req.body, _id: resultado.insertedId });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao salvar material.' });
  } finally {
    await client.close();
  }
});

// Listar materiais
router.get('/materiais', async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const materiais = await client.db(dbName).collection('materiais').find().toArray();
    res.json(materiais);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar materiais.' });
  } finally {
    await client.close();
  }
});

// Excluir material
router.delete('/materiais/:id', async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    await client.db(dbName).collection('materiais').deleteOne({ _id: new ObjectId(req.params.id) });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao excluir material.' });
  } finally {
    await client.close();
  }
});

module.exports = router;
// add no +1-1 
router.put('/materiais/:id', async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    await client.db(dbName).collection('materiais').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.status(200).json({ message: 'Material atualizado.' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar material.' });
  } finally {
    await client.close();
  }
});
