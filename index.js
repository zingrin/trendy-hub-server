require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tkd5xye.mongodb.net/${process.env.DB_NAME}`;

// Mongo Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    //  CONNECT DATABASE
    await client.connect();
    console.log("MongoDB connected successfully!");

    const database = client.db(process.env.DB_NAME);
    const productsCollection = database.collection("products");
    const bestSellerCollection = database.collection("bestSeller");

    // GET ALL PRODUCTS
    app.get("/products", async (req, res) => {
      try {
        const products = await productsCollection.find().toArray();

        if (products.length === 0) {
          return res.status(200).json({
            message: "No products found",
          });
        }

        res.status(200).send(products);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch products" });
      }
    });

    // GET SINGLE PRODUCT BY ID
    app.get("/api/products/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);

        const product = await productsCollection.findOne({ id });

        if (!product) {
          return res.status(404).send({
            message: "Product not found",
          });
        }

        res.status(200).send(product);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch product" });
      }
    });

    //  ADD PRODUCT (POST)
    app.post("/products", async (req, res) => {
      try {
        const newProduct = req.body;

        const result = await productsCollection.insertOne(newProduct);

        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to add product" });
      }
    });

    // ============================
    //  UPDATE PRODUCT (PUT)
    // ============================
    app.put("/products/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const updatedData = req.body;

        const result = await productsCollection.updateOne(
          { id },
          {
            $set: updatedData,
          },
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update product" });
      }
    });

    // ============================
    //  DELETE PRODUCT
    // ============================
    app.delete("/products/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);

        const result = await productsCollection.deleteOne({ id });

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to delete product" });
      }
    });
  } catch (err) {
    console.error(" MongoDB connection error:", err);
  }
}

run().catch(console.dir);

// ROOT ROUTE
app.get("/", (req, res) => {
  res.send(" Backend is running!");
});

// SERVER START
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
