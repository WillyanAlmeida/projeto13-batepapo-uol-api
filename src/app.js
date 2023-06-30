import express from 'express';
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from 'joi';
import dayjs from "dayjs";

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
  .then(() => db = mongoClient.db())
  .catch((err) => console.log(err.message));

  app.post('/participants', async (req, res) => {
    const {name} = req.body
    console.log(name)
    console.log(dayjs().format("HH:mm:ss"))

    const username = participant.validate(req.body, { abortEarly: false })
    if (username.error) return res.status(422).send("Todos os campos são obrigatórios!")
  
    try {
      const resp = await db.collection('participants').findOne({name: name})
      if (resp) return res.status(409).send("Usuário já cadastrado!");

      await db.collection('participants').insertOne({name: name, lastStatus: Date.now()});
      
      await db.collection('messages').insertOne({
         from: name,
         to: 'Todos',
         text: 'entra na sala...',
         type: 'status',
         time: dayjs().format("HH:mm:ss")
     });
      res.sendStatus(201);
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
   
  })