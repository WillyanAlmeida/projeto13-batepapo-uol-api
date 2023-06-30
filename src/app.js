import express from 'express';
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from 'joi';

const participant = joi.object({
  name: joi.string().required(),
  })

const app = express();
app.use(cors());
app.use(express.json())
app.listen(5000, ()=> console.log("server on"));

dotenv.config()
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()
  .then(() => db = mongoClient.db("batePapoUol"))
  .catch((err) => console.log(err.message));

  app.post('/participants', async (req, res) => {
    const {nome} = req.body

    const username = participant.username(req.body, { abortEarly: false })
    if (username.error) return res.status(422).send("Todos os campos são obrigatórios!")
  
    try {
      const resp = await db.collection('/participants').findOne({nome: nome})
      if (resp) return res.status(409).send("Usuário já cadastrado!");

      await db.collection('/participants').insertOne({name: nome, lastStatus: Date.now()});
      await db.collection('/messages').insertOne({
        from: nome,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: 'HH:mm:ss'
    });
      return res.sendStatus(201);
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
   
  })