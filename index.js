const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const port = process.env.port || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ajv0g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const productCollection = client.db("visaDB").collection("visa");

    app.get("/visas", async (req, res) => {
      const cursor = productCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/visas", async (req, res) => {
      const newProdcut = req.body;
      console.log(newVisa);
      const result = await productCollection.insertOne(newProdcut);
      res.send(result);
    });

    await client.connect();
    console.log("db connection successfully");
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Fresh harvest gorocery server is running...");
});

app.listen(port, () => {
  console.log(`Server is running: http://localhost:${port}`);
});
