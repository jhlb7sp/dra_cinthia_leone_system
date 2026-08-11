// backend/server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();


// ======================================================
// MODELS
// ======================================================

const Orcamento = require('./models/Orcamento');


// ======================================================
// ROTAS EXTERNAS
// ======================================================

const controleFisicoRoutes =
  require('./routes/controleFisicoRoutes');

const controleBiologicoRoutes =
  require('./routes/controleBiologicoRoutes');

const materiaisRoutes =
  require('./routes/materiais');

const pacientesRouter =
  require('./routes/pacientes');

const medicamentosRoute =
  require('./routes/medicamentos');

const procedimentosRoute =
  require('./routes/procedimentos');

const orcamentosRoutes =
  require('./routes/orcamentos');

const historicoRoutes =
  require('./routes/historicoRoutes');

const notasRoutes =
  require('./routes/notasRoutes');

const manutencoesRoutes =
  require('./routes/manutencoes');

const relatorioRoutes =
  require('./routes/relatorio');


// ======================================================
// MIDDLEWARES GLOBAIS
//
// IMPORTANTE:
// express.json() precisa vir ANTES das rotas.
// ======================================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);


// ======================================================
// ARQUIVOS ESTÁTICOS
// ======================================================

app.use(
  express.static(
    path.join(__dirname, '../frontend')
  )
);

app.use(
  '/uploads',
  express.static(
    path.join(__dirname, 'uploads')
  )
);

app.use(
  '/libs',
  express.static(
    path.join(__dirname, '../frontend/libs')
  )
);


// ======================================================
// ROTAS EXTERNAS
// ======================================================

// Notas
app.use(
  '/api/notas',
  notasRoutes
);


// Orçamentos
app.use(
  '/api',
  orcamentosRoutes
);

// Histórico clínico
app.use(
  '/api',
  historicoRoutes
);


// Materiais
app.use(
  '/api',
  materiaisRoutes
);


// Pacientes / autocomplete
app.use(
  '/api',
  pacientesRouter
);


// Medicamentos
app.use(
  '/api/medicamentos',
  medicamentosRoute
);


// Procedimentos
app.use(
  '/api/procedimentos',
  procedimentosRoute
);


// Manutenções
app.use(
  '/api/manutencoes',
  manutencoesRoutes
);


// Autoclave
app.use(
  '/api/controleFisico',
  controleFisicoRoutes
);

app.use(
  '/api/controleBiologico',
  controleBiologicoRoutes
);


// Relatórios
app.use(
  '/relatorio',
  relatorioRoutes
);


// ======================================================
// CONFIGURAÇÃO DO MONGODB
// ======================================================

const url =
  process.env.MONGO_URL ||
  'mongodb://localhost:27017';

const dbName =
  process.env.DB_NAME ||
  'consultorio';


mongoose
  .connect(url, {
    dbName
  })
  .then(() => {
    console.log(
      `MongoDB conectado: ${dbName}`
    );
  })
  .catch(error => {
    console.error(
      'Erro ao conectar no MongoDB:',
      error
    );
  });


// ======================================================
// ROTA PRINCIPAL
// ======================================================

app.get('/', (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      '../frontend/index.html'
    )
  );

});


// ======================================================
// LOGIN
// ======================================================

app.post('/login', async (req, res) => {

  const {
    usuario,
    senha
  } = req.body;


  const client =
    new MongoClient(url);


  try {

    await client.connect();


    const user =
      await client
        .db(dbName)
        .collection('user')
        .findOne({
          username: usuario
        });


    if (
      user &&
      user.password === senha
    ) {

      res.json({
        sucesso: true,
        usuario: user.username
      });

    } else {

      res.json({
        sucesso: false
      });

    }


  } catch (err) {

    console.error(
      'Erro no login:',
      err
    );


    res
      .status(500)
      .send(
        'Erro no servidor'
      );


  } finally {

    await client.close();
  }

});


// ======================================================
// FATURAMENTO - SALVAR
// ======================================================

app.post(
  '/api/faturamento',
  async (req, res) => {

    const {
      data,
      tipo,
      descricao,
      valor,
      pagamento
    } = req.body;


    if (
      !data ||
      !tipo ||
      !descricao ||
      valor == null ||
      !pagamento
    ) {

      return res
        .status(400)
        .json({
          error:
            'Dados incompletos.'
        });

    }


    const client =
      new MongoClient(url);


    try {

      await client.connect();


      const resultado =
        await client
          .db(dbName)
          .collection('faturamento')
          .insertOne({
            data,
            tipo,
            descricao,
            valor,
            pagamento
          });


      res
        .status(201)
        .json({
          sucesso: true,
          id:
            resultado.insertedId
        });


    } catch (err) {

      console.error(
        'Erro ao salvar lançamento:',
        err
      );


      res
        .status(500)
        .send(
          'Erro no servidor'
        );


    } finally {

      await client.close();
    }

  }
);


// ======================================================
// FATURAMENTO - ATUALIZAR PAGAMENTO
// ======================================================

app.put(
  '/api/faturamento/:id',
  async (req, res) => {

    const id =
      req.params.id;


    const {
      pagamento
    } = req.body;


    if (!pagamento) {

      return res
        .status(400)
        .json({
          error:
            'Campo pagamento obrigatório.'
        });

    }


    const client =
      new MongoClient(url);


    try {

      await client.connect();


      const db =
        client.db(dbName);


      const updateResult =
        await db
          .collection('faturamento')
          .updateOne(
            {
              _id:
                new ObjectId(id)
            },
            {
              $set: {
                pagamento
              }
            }
          );


      if (
        updateResult.matchedCount === 0
      ) {

        return res
          .status(404)
          .json({
            sucesso: false,
            message:
              'Lançamento não encontrado.'
          });

      }


      res
        .status(200)
        .json({
          sucesso: true
        });


    } catch (error) {

      console.error(
        'Erro ao atualizar pagamento:',
        error.message
      );


      res
        .status(500)
        .json({
          error:
            'Erro ao atualizar lançamento.'
        });


    } finally {

      await client.close();
    }

  }
);


// ======================================================
// VALIDAR SENHA
// ======================================================

app.post(
  '/api/validar-senha',
  async (req, res) => {

    const {
      usuario,
      senha
    } = req.body;


    const client =
      new MongoClient(url);


    try {

      await client.connect();


      const user =
        await client
          .db(dbName)
          .collection('user')
          .findOne({
            username: usuario
          });


      if (
        user &&
        user.password === senha
      ) {

        res
          .status(200)
          .json({
            sucesso: true
          });

      } else {

        res
          .status(401)
          .json({
            sucesso: false
          });

      }


    } catch (err) {

      console.error(
        'Erro na validação de senha:',
        err
      );


      res
        .status(500)
        .send(
          'Erro no servidor'
        );


    } finally {

      await client.close();
    }

  }
);


// ======================================================
// PACIENTE - CADASTRAR
// ======================================================

app.post(
  '/api/pacientes',
  async (req, res) => {

    const paciente = {
      ...req.body
    };


    /*
       Mantive a regra antiga,
       mas protegendo caso CPF
       não seja enviado.
    */

    paciente.cpf =
      String(
        paciente.cpf || ''
      )
        .replace(/\D/g, '');


    const client =
      new MongoClient(url);


    try {

      await client.connect();


      const collection =
        client
          .db(dbName)
          .collection('pacientes');


      /*
         Se existir CPF,
         verifica duplicidade.
      */

      if (paciente.cpf) {

        const existente =
          await collection.findOne({
            cpf: paciente.cpf
          });


        if (existente) {

          return res.json({
            sucesso: false,
            mensagem:
              'CPF já cadastrado.'
          });

        }
      }


      const resultado =
        await collection.insertOne(
          paciente
        );


      res.json({
        sucesso: true,
        id:
          resultado.insertedId,
        cpf:
          paciente.cpf
      });


    } catch (err) {

      console.error(
        'Erro ao salvar paciente:',
        err
      );


      res
        .status(500)
        .send(
          'Erro ao salvar paciente'
        );


    } finally {

      await client.close();
    }

  }
);


// ======================================================
// PACIENTE - BUSCAR POR CPF
// ======================================================

app.get(
  '/api/pacientes/cpf/:cpf',
  async (req, res) => {

    const client =
      new MongoClient(url);


    try {

      await client.connect();


      const paciente =
        await client
          .db(dbName)
          .collection('pacientes')
          .findOne({
            cpf:
              req.params.cpf
          });


      if (!paciente) {

        return res
          .status(404)
          .json({
            error:
              'Paciente não encontrado'
          });

      }


      res.json(
        paciente
      );


    } catch (error) {

      console.error(
        'Erro ao buscar paciente:',
        error
      );


      res
        .status(500)
        .json({
          error:
            'Erro ao buscar paciente'
        });


    } finally {

      await client.close();
    }

  }
);


// ======================================================
// CONSULTA MÚLTIPLA DE PACIENTES
// ======================================================

app.get(
  '/pacientes',
  async (req, res) => {

    const client =
      new MongoClient(url);


    try {

      await client.connect();


      const {
        nome,
        cpf,
        status
      } = req.query;


      const filtro = {};


      if (nome) {

        filtro.nome = {
          $regex: nome,
          $options: 'i'
        };

      }


      if (cpf) {
        filtro.cpf = cpf;
      }


      if (
        status &&
        status !== 'Todos'
      ) {

        filtro.status =
          status;

      }


      const resultados =
        await client
          .db(dbName)
          .collection('pacientes')
          .find(filtro)
          .toArray();


      res.json(
        resultados
      );


    } catch (error) {

      console.error(
        'Erro ao consultar pacientes:',
        error
      );


      res
        .status(500)
        .json({
          erro:
            'Erro ao buscar pacientes'
        });


    } finally {

      await client.close();
    }

  }
);


// ======================================================
// PACIENTE - ATUALIZAR
// ======================================================

app.put(
  '/api/pacientes/:cpf',
  async (req, res) => {

    const client =
      new MongoClient(url);


    try {

      await client.connect();


      const resultado =
        await client
          .db(dbName)
          .collection('pacientes')
          .findOneAndUpdate(
            {
              cpf:
                req.params.cpf
            },
            {
              $set:
                req.body
            },
            {
              returnDocument:
                'after'
            }
          );


      /*
         Compatibilidade com diferentes
         versões do driver MongoDB.
      */

      const pacienteAtualizado =
        resultado?.value ||
        resultado;


      if (!pacienteAtualizado) {

        return res
          .status(404)
          .json({
            erro:
              'Paciente não encontrado.'
          });

      }


      res.json({
        mensagem:
          'Paciente atualizado',
        paciente:
          pacienteAtualizado
      });


    } catch (error) {

      console.error(
        'Erro ao atualizar paciente:',
        error
      );


      res
        .status(500)
        .json({
          erro:
            'Erro ao atualizar paciente.'
        });


    } finally {

      await client.close();
    }

  }
);


// ======================================================
// ANAMNESES - CADASTRAR
// ======================================================

app.post(
  '/api/anamneses/cadastrar',
  async (req, res) => {

    const client =
      new MongoClient(url);


    try {

      await client.connect();


      const db =
        client.db(dbName);


      const paciente =
        await db
          .collection('pacientes')
          .findOne({
            cpf:
              req.body.cpf
          });


      if (!paciente) {

        return res
          .status(404)
          .json({
            message:
              'Paciente não encontrado'
          });

      }


      await db
        .collection('anamneses')
        .insertOne(
          req.body
        );


      res
        .status(200)
        .json({
          message:
            'Anamnese salva com sucesso!'
        });


    } catch (err) {

      console.error(
        'Erro ao salvar anamnese:',
        err
      );


      res
        .status(500)
        .json({
          message:
            'Erro ao salvar anamnese'
        });


    } finally {

      await client.close();
    }

  }
);


// ======================================================
// ANAMNESES - CONSULTAR
// ======================================================

app.get(
  '/api/anamneses/cpf/:cpf',
  async (req, res) => {

    const client =
      new MongoClient(url);


    try {

      await client.connect();


      const paciente =
        await client
          .db(dbName)
          .collection('anamneses')
          .findOne({
            cpf:
              req.params.cpf
          });


      if (!paciente) {

        return res
          .status(404)
          .json({
            error:
              'Paciente não encontrado'
          });

      }


      res.json(
        paciente
      );


    } catch (error) {

      console.error(
        'Erro ao buscar anamnese:',
        error
      );


      res
        .status(500)
        .json({
          error:
            'Erro ao buscar paciente'
        });


    } finally {

      await client.close();
    }

  }
);


// ======================================================
// ANAMNESES - ATUALIZAR
// ======================================================

app.put(
  '/api/anamneses/cpf/:cpf',
  async (req, res) => {

    const client =
      new MongoClient(url);


    try {

      await client.connect();


      const result =
        await client
          .db(dbName)
          .collection('anamneses')
          .findOneAndUpdate(
            {
              cpf:
                req.params.cpf
            },
            {
              $set:
                req.body
            },
            {
              returnDocument:
                'after'
            }
          );


      const anamneseAtualizada =
        result?.value ||
        result;


      if (!anamneseAtualizada) {

        return res
          .status(404)
          .json({
            message:
              'Anamnese não encontrada'
          });

      }


      res.json({
        message:
          'Anamnese atualizada',
        anamnese:
          anamneseAtualizada
      });


    } catch (error) {

      console.error(
        'Erro ao atualizar anamnese:',
        error
      );


      res
        .status(500)
        .json({
          message:
            'Erro ao atualizar anamnese'
        });


    } finally {

      await client.close();
    }

  }
);


// ======================================================
// TRATAMENTOS - CONSULTAR
// ======================================================

app.get(
  '/api/tratamentos/:cpf',
  async (req, res) => {

    const client =
      new MongoClient(url);


    try {

      await client.connect();


      const dados =
        await client
          .db(dbName)
          .collection('tratamentos')
          .find({
            cpf:
              req.params.cpf
          })
          .toArray();


      res.json(
        dados
      );


    } catch (error) {

      console.error(
        'Erro ao buscar tratamentos:',
        error
      );


      res
        .status(500)
        .json({
          error:
            'Erro ao buscar tratamentos.'
        });


    } finally {

      await client.close();
    }

  }
);


// ======================================================
// TRATAMENTOS - SALVAR
// ======================================================

app.post(
  '/api/tratamentos/salvar',
  async (req, res) => {

    const client =
      new MongoClient(url);


    try {

      await client.connect();


      const db =
        client.db(dbName);


      const lista =
        Array.isArray(req.body)
          ? req.body
          : [];


      const cpf =
        lista[0]?.cpf;


      if (cpf) {

        await db
          .collection('tratamentos')
          .deleteMany({
            cpf
          });

      }


      if (lista.length) {

        await db
          .collection('tratamentos')
          .insertMany(
            lista
          );

      }


      res
        .status(200)
        .json({
          message:
            'Tratamentos salvos com sucesso.'
        });


    } catch (error) {

      console.error(
        'Erro ao salvar tratamentos:',
        error
      );


      res
        .status(500)
        .json({
          error:
            'Erro ao salvar tratamentos.'
        });


    } finally {

      await client.close();
    }

  }
);


// ======================================================
// ORÇAMENTO - BUSCAR POR ID
//
// Mantive aqui porque essa rota ainda não existe
// no arquivo routes/orcamentos.js que montamos.
// ======================================================

app.get(
  '/api/orcamentos/item/:id',
  async (req, res) => {

    try {

      const {
        id
      } = req.params;


      const orcamento =
        await Orcamento.findById(
          id
        );


      if (!orcamento) {

        return res
          .status(404)
          .json({
            erro:
              'Orçamento não encontrado'
          });

      }


      res.json(
        orcamento
      );


    } catch (error) {

      console.error(
        'Erro ao buscar orçamento por ID:',
        error
      );


      res
        .status(500)
        .json({
          erro:
            'Erro ao buscar orçamento'
        });

    }

  }
);


// ======================================================
// FATURAMENTO - LISTAR TODOS
// ======================================================

app.get(
  '/api/faturamento',
  async (req, res) => {

    const client =
      new MongoClient(url);


    try {

      await client.connect();


      const faturamentos =
        await client
          .db(dbName)
          .collection('faturamento')
          .find()
          .toArray();


      res
        .status(200)
        .json(
          faturamentos
        );


    } catch (error) {

      console.error(
        'Erro ao buscar lançamentos:',
        error
      );


      res
        .status(500)
        .json({
          error:
            'Erro ao buscar lançamentos.'
        });


    } finally {

      await client.close();
    }

  }
);


// ======================================================
// FATURAMENTO - FILTRAR
// ======================================================

app.get(
  '/api/faturamento/filtro',
  async (req, res) => {

    const {
      inicio,
      fim
    } = req.query;


    const filtro = {};


    if (
      inicio &&
      fim
    ) {

      filtro.data = {
        $gte: inicio,
        $lte: fim
      };

    }


    const client =
      new MongoClient(url);


    try {

      await client.connect();


      const registros =
        await client
          .db(dbName)
          .collection('faturamento')
          .find(filtro)
          .toArray();


      res
        .status(200)
        .json(
          registros
        );


    } catch (error) {

      console.error(
        'Erro ao filtrar lançamentos:',
        error
      );


      res
        .status(500)
        .json({
          error:
            'Erro ao filtrar lançamentos.'
        });


    } finally {

      await client.close();
    }

  }
);


// ======================================================
// FATURAMENTO - EXCLUIR
// ======================================================

app.delete(
  '/api/faturamento/:id',
  async (req, res) => {

    const id =
      req.params.id;


    const client =
      new MongoClient(url);


    try {

      await client.connect();


      const db =
        client.db(dbName);


      await db
        .collection('faturamento')
        .deleteOne({
          _id:
            new ObjectId(id)
        });


      res
        .status(200)
        .json({
          message:
            'Lançamento removido.'
        });


    } catch (error) {

      console.error(
        'Erro ao excluir lançamento:',
        error
      );


      res
        .status(500)
        .json({
          error:
            'Erro ao excluir lançamento.'
        });


    } finally {

      await client.close();
    }

  }
);


// ======================================================
// INICIAR SERVIDOR
// ======================================================

const PORT =
  process.env.PORT ||
  3000;


app.listen(
  PORT,
  () => {

    console.log(
      `Servidor rodando em http://localhost:${PORT}`
    );

  }
);