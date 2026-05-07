const { MongoClient } = require('mongodb');
require('dotenv').config();

const url = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'consultorio';

async function criarIndiceUnico() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    await db.collection('anamneses').createIndex({ cpf: 1 }, { unique: true });
    console.log('Índice único criado para o campo cpf na coleção anamneses.');
  } catch (error) {
    console.error('Erro ao criar índice:', error);
  } finally {
    await client.close();
  }
}

criarIndiceUnico();
