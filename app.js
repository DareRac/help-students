const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const Product = require("./models/Product");
const Review = require("./models/Review");

const app = express();

mongoose.connect("mongodb://localhost:27017/help-student", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database Connected");
});

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// description of the website
app.get("/", (req, res) => {
  res.render("home.ejs");
});

// render addProduct form
app.get("/addProduct", (req, res) => {
  res.render("Products/addProduct.ejs");
});

app.post("/addProduct", async (req, res) => {
  //console.log(req.body.Product);
  const product = new Product(req.body.Product);
  await product.save();
  res.redirect("/allProducts");
});

// show page for all products
app.get("/allProducts", async (req, res) => {
  const products = await Product.find({});
  res.render("Products/allProducts.ejs", { products });
});

// show page for a product
app.get("/showProduct/:id", async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id).populate("reviews");
  res.render("Products/showProduct.ejs", { product });
});

app.delete("/showProduct/:id", async (req, res) => {
  const { id } = req.params;
  const product = await Product.findByIdAndDelete(id);
  res.redirect("/allProducts");
});

app.get("/showProduct/:id/edit", async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  res.render("Products/updateProduct.ejs", { product });
});

app.put("/showProduct/:id", async (req, res) => {
  const { id } = req.params;
  //console.log(req.body.Product);
  const product = await Product.findByIdAndUpdate(id, { ...req.body.Product });
  //console.log(product);
  await product.save();
  res.redirect(`/showProduct/${id}`);
});

app.post("/showProduct/:id/review", async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  const review = new Review(req.body.review);
  product.reviews.push(review);
  await review.save();
  await product.save();
  console.log(product);
  res.redirect(`/showProduct/${id}`);
});

const port = 3000;

app.listen(port, () => {
  console.log(`You are on Port ${port}!!`);
});
