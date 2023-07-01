import express from 'express';
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from 'joi';
import dayjs from "dayjs";


const app = express();
app.use(cors());
app.use(express.json())
app.listen(5000, () => console.log("server on"));

dotenv.config()
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()
  .then(() => db = mongoClient.db())
  .catch((err) => console.log(err.message));

const schemaparticipant = joi.object({
  name: joi.string().required(),
})

app.post('/participants', async (req, res) => {
  const { name } = req.body
  console.log(name)
  
  const username = schemaparticipant.validate(req.body, { abortEarly: false })
  if (username.error) return res.status(422).send("Todos os campos são obrigatórios!")

  try {
    const resp = await db.collection('participants').findOne({ name: name })
    if (resp) return res.status(409).send("Usuário já cadastrado!");

    await db.collection('participants').insertOne({ name: name, lastStatus: Date.now() });

    await db.collection('messages').insertOne({
      from: name,
      to: 'Todos',
      text: 'entra na sala...',
      type: 'status',
      time: dayjs().format("HH:mm:ss")
    });
    res.sendStatus(201);
  } catch (error) {
    res.status(500).send(error)
  }

})

app.get('/participants', async (req, res) => {
  let Users = [];
  try {
    Users = await db.collection('participants').find({}).toArray()

    res.status(201).send(Users);
  } catch (error) {
    console.error(error);
    res.status(500).send(error)
  }

})

const schemamessage = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.string().valid("message", "private_message").required(),
})

app.post('/messages', async (req, res) => {
  let { to, text, type } = req.body
  let from = req.headers.user;
  console.log(req.headers.user)
  console.log(from)
  console.log(req.body)
  

  const username = schemamessage.validate({to, text, type}, { abortEarly: false })
  if (username.error) return console.log(username.error) //res.status(422).send("Todos os campos são obrigatórios!")

  try {
    const resp = await db.collection('participants').findOne({ name: from })  
    if (!resp) return res.status(422).send("Usuário não está na sala");

    await db.collection('messages').insertOne({
      from: from,
      to,
      text,
      type,
      time: dayjs().format("HH:mm:ss")
    });
    res.sendStatus(201);
    console.log(from)
  } catch (error) {
    console.log(error)
    res.status(500).send(error)
  }

})
