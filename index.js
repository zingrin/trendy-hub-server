require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    const bestSellerCollection = database.collection("bestSellers");
    const reviewsCollection = database.collection("reviews");
    const cartCollection = database.collection("cart");
    const blogsCollection = database.collection("blog");
    const commentsCollection = database.collection("comments");

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
    // GET all blogs
    app.get("/api/blogs", async (req, res) => {
      try {
        const blogs = await blogsCollection.find().toArray();
        res.send(blogs);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch blogs" });
      }
    });

    // GET single blog by id
    app.get("/api/blogs/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const blog = await blogsCollection.findOne({ _id: new ObjectId(id) });
        if (!blog) return res.status(404).send({ error: "Blog not found" });
        res.send(blog);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch blog" });
      }
    });
    // GET comments
    app.get("/api/blogs/:id/comments", async (req, res) => {
      try {
        const blogId = req.params.id;
        const comments = await commentsCollection
          .find({ blogId })
          .sort({ date: -1 })
          .toArray();
        res.send(comments);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch comments" });
      }
    });

    // POST comment for a blog
    app.post("/api/blogs/:id/comments", async (req, res) => {
      try {
        const blogId = req.params.id;
        const { name, email, message } = req.body;

        const comment = {
          blogId,
          name,
          email,
          message,
          date: new Date(),
        };

        const result = await commentsCollection.insertOne(comment);
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to post comment" });
      }
    });

    // --- GET ALL BEST SELLERS ---

    app.get("/api/bestSellers", async (req, res) => {
      try {
        const result = await bestSellerCollection.find().toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to fetch products" });
      }
    });

    //  GET SINGLE PRODUCT
    app.get("/api/bestSellers/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const product = await bestSellerCollection.findOne({
          _id: id,
        });

        if (!product) {
          return res.status(404).send({ message: "Product not found" });
        }

        res.send(product);
      } catch (err) {
        console.error("Error fetching product:", err);
        res.status(500).send({ message: "Server error" });
      }
    });

    //  GET REVIEWS BY PRODUCT ID
    app.get("/api/reviews/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const reviews = await reviewsCollection
          .find({ productId: id })
          .sort({ date: -1 })
          .toArray();

        res.send(reviews);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        res.status(500).send({ message: "Failed to fetch reviews" });
      }
    });

    //  POST REVIEW
    app.post("/api/reviews", async (req, res) => {
      const review = req.body;

      try {
        const result = await reviewsCollection.insertOne(review);
        res.send(result);
      } catch (err) {
        console.error("Error posting review:", err);
        res.status(500).send({ message: "Failed to add review" });
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

    //  UPDATE PRODUCT (PUT)
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

    //  DELETE PRODUCT
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
app.post("/api/cart", async (req, res) => {
  const item = req.body;

  const exists = await cartCollection.findOne({
    productId: item.productId,
  });

  if (exists) {
    await cartCollection.updateOne(
      { productId: item.productId },
      { $inc: { quantity: item.quantity } },
    );
  } else {
    await cartCollection.insertOne(item);
  }

  res.send({ success: true });
});
app.get("/api/cart", async (req, res) => {
  const result = await cartCollection.find().toArray();
  res.send(result);
});
app.patch("/api/cart/:id", async (req, res) => {
  const id = req.params.id;
  const { type } = req.body;

  const update =
    type === "inc" ? { $inc: { quantity: 1 } } : { $inc: { quantity: -1 } };

  await cartCollection.updateOne({ _id: new ObjectId(id) }, update);

  res.send({ success: true });
});

run().catch(console.dir);

// ROOT ROUTE
app.get("/", (req, res) => {
  res.send(" Backend is running!");
});

// SERVER START
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
