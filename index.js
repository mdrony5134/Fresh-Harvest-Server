const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
    const db = client.db("productDB");
    const productCollection = db.collection("products");
    const cartCollection = db.collection("cart");
    const usersCollection = db.collection("users");

    // Register Route
    app.post("/register", async (req, res) => {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists!" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user into the database
      try {
        const newUser = { username, email, password: hashedPassword };
        const result = await usersCollection.insertOne(newUser);

        // Generate JWT token
        const token = jwt.sign({ id: result.insertedId }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });

        res.status(201).json({ message: "User registered successfully!", token });
      } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Failed to register user" });
      }
    });

    // Login Route
    app.post("/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await usersCollection.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User not found!" });
      }

      // Check if password is correct
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials!" });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.status(200).json({ message: "Login successful!", token });
    });

    app.get("/products", async (req, res) => {
      const cursor = productCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/products", async (req, res) => {
      const newProdcut = req.body;
      console.log(newProdcut);
      const result = await productCollection.insertOne(newProdcut);
      res.send(result);
    });

    // Single Product API
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const query = { _id: new ObjectId(id) };
        const product = await productCollection.findOne(query);

        if (!product) {
          return res.status(404).send({ message: "Product not found" });
        }

        res.send(product);
      } catch (error) {
        res.status(400).send({ message: "Invalid ID format" });
      }
    });

    // Endpoint to add product to cart
    app.post("/cart", async (req, res) => {
      const cartItem = req.body; // Product details sent from frontend
      try {
        const result = await cartCollection.insertOne(cartItem); // Add to cart collection
        res.send({ success: true, message: "Product added to cart", result });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to add product to cart",
          error,
        });
      }
    });

    // Endpoint to fetch cart items
    app.get("/cart", async (req, res) => {
      try {
        const cartItems = await cartCollection.find().toArray();
        res.send(cartItems);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch cart items",
          error,
        });
      }
    });

    // Delete item from cart
    app.delete("/cart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      try {
        const result = await cartCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .send({ success: false, message: "Item not found in cart" });
        }
        res.send({ success: true, message: "Item deleted from cart" });
      } catch (error) {
        console.error("Error deleting cart item:", error);
        res.status(500).send({
          success: false,
          message: "Failed to delete item from cart",
          error: error.message,
        });
      }
    });

    await client.connect();
    console.log("db connection successfully");
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Fresh harvest grocery server is running...");
});

app.listen(port, () => {
  console.log(`Server is running: http://localhost:${port}`);
});
