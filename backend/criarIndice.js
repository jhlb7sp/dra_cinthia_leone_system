const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'consultorio';

async function criarIndiceUnico() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('pacientes');

    await collection.createIndex({ cpf: 1 }, { unique: true });
    console.log('Índice de CPF único criado com sucesso!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

criarIndiceUnico();