require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const Product = require("./models/Product");
const Review = require("./models/Review");
const User = require("./models/User");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const multer = require("multer");
const { storage } = require("./Cloudinary/index");
const upload = multer({ storage });
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const { isLoggedIn, isReviewAuthor, isProductAuthor } = require("./middleware");

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const sessionConfig = {
  name: "session",
  secret: "thisshouldbeabettersecret!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure:true,  // jab deploy krenge tab isko uncomment kr skte h ..kyuki localhost http pr rhta h na ki https pr toh jab hum deploy krenge toh vo https pr rhega to humara secure wala part bhi done ho jaayega....agar isko localhost mei true kr dunga toh login krne pr bhi login nhi hoga aur mei khudke account se banaya hua campground,review edit aur delete nhi kr paaunga....
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session()); // isko app.use(session(sessionConfig)); iske baad hi likhna h varna isko pata nhi rhega ki session kya h
passport.use(new LocalStrategy(User.authenticate()));

app.use((req, res, next) => {
  // console.log(req.session) isko consolelog krne pr session mei hum returnTo wala dekh skte h agar vo trigger hua hoga toh
  res.locals.success = req.flash("success"); // ye middleware lagane se mei flash mei jo bhi string pass krunga usko kisi bhi template mei access kr skta hu...for eg mujhe show tempelate ke router mei koi variable pass nhi krana padega ki jisse mei flash wali string ko access kr sku....middleware ki help se direct access ho jaayega
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user; // req.user humei user ka email , username , id(mongoose wali) .... ab mei ise pure project mei kahi bhi use kr skta hu...ab hum login aur register wala option navbar mei tab hi dikhayenge jab currentUser exist nhi krega ..aur agar currentUser exist krega toh hum sirf logout wala option show krenge.... req.user humei passport ki help se mila h ... passport sab kuch behind the scene kr deta h .....
  next();
});
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: GOOGLE_CLIENT_ID,
//       clientSecret: GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://www.example.com/auth/google/callback",
//     },
//     function (accessToken, refreshToken, profile, cb) {
//       User.findOrCreate({ googleId: profile.id }, function (err, user) {
//         return cb(err, user);
//       });
//     }
//   )
// );
passport.serializeUser(User.serializeUser()); // cookie ko bana dega aur store kr lega login krne pr
passport.deserializeUser(User.deserializeUser()); // cookie ko destroy kr dega logout krne pr :)

// description of the website
app.get("/", (req, res) => {
  res.render("home.ejs");
});

// render addProduct form
app.get("/addProduct", isLoggedIn, (req, res) => {
  res.render("Products/addProduct.ejs");
});

app.post("/addProduct", isLoggedIn, upload.array("image"), async (req, res) => {
  //console.log(req.body.Product);
  const product = new Product(req.body.Product);
  product.image = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  product.author = req.user._id;
  await product.save();
  //console.log(product.image);
  res.redirect("/allProducts");
});

// show page for all products
app.get("/allProducts", async (req, res) => {
  const products = await Product.find({});
  //   .populate({
  //     path: "reviews",
  //     populate: {
  //       path: "author",
  //     },
  //   })
  //   .populate("author");
  res.render("Products/allProducts.ejs", { products });
});

// show page for a product
app.get("/showProduct/:id", async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("author");
  res.render("Products/showProduct.ejs", { product });
});

app.get(
  "/showProduct/:id/edit",
  isLoggedIn,
  isProductAuthor,
  async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    res.render("Products/updateProduct.ejs", { product });
  }
);

app.put("/showProduct/:id", isLoggedIn, isProductAuthor, async (req, res) => {
  const { id } = req.params;
  //console.log(req.body.Product);
  const product = await Product.findByIdAndUpdate(id, { ...req.body.Product });
  //console.log(product);
  await product.save();
  res.redirect(`/showProduct/${id}`);
});

app.delete(
  "/showProduct/:id",
  isLoggedIn,
  isProductAuthor,
  async (req, res) => {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    res.redirect("/allProducts");
  }
);

// review routes
app.post("/showProduct/:id/review", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  const review = new Review(req.body.review);
  //console.log(req.body.review);
  review.author = req.user._id;
  product.reviews.push(review);
  await review.save();
  await product.save();
  //console.log(product);
  res.redirect(`/showProduct/${id}`);
});

app.delete(
  "/showProduct/:id/review/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  async (req, res) => {
    const { id, reviewId } = req.params;
    await Product.findByIdAndUpdate(id, { $pull: { review: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review has been deleted successfully");
    res.redirect(`/showProduct/${id}`);
  }
);

// authentication and authorisation routes
app.get("/login", (req, res) => {
  res.render("./users/login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    req.flash("success", `Welcome ${req.user.username}!!`);
    const redirectUrl = req.session.returnTo || "/allProducts"; // agar session mei returnTo h toh uspr redirect krega varna /campground pr(jab koi direct login prr tap krega aur login krega toh returnTo exist nhi krega kyuki vo direct login krne gaya h na ki kahi(kahi matlab ki vo login nhi hoga aur new pr tap kra hoga) se redirect hokr login pr gya)
    delete req.session.returnTo; // session mei se delete denge hum returnTo ko kyuki humne usko redirectUrl mei store kr lia h
    res.redirect(redirectUrl);
  }
);

app.get("/register", (req, res) => {
  res.render("./users/register.ejs");
});

app.post("/register", async (req, res) => {
  try {
    const { email, username, password, contact } = req.body;
    const user = new User({ email, username, contact });
    const registeredUser = await User.register(user, password); // ye password ko salt krke hash bhi kr deta h...pehle user bana lia uss username  aur email ka aur fir baad mei password set kr dia
    req.login(registeredUser, (err) => {
      if (err) return next(err); // next se humare error humare error handler pr chala jaayega... it sounds awkward that if a user is registered successfully in above line then how can an error occur..so anything could go wrong thats why we included err.... ab hum login isliye use kr rhe kyuki agar mei register kr dia... fir mei new campground banaunga toh vo mujhe login page pr le jaayyega which is not a good experience....so to resolve this problem we are writing this code which also log in if we register ass a new user...agar hum register kr liye h toh humei direct login bhi ho jaana chahiye(thats our final aim to write this code)...
      req.flash("success", "Welcome to HelpStudents!!");
      // console.log(registeredUser); isko console log kroge toh humare user mei salt hash wala column khud passport add kr dega... ye (passport) saaraa kaam hidden way mei krta h ..sab kuch piche ki side ho jaata h ...humko bas apne methods sahi se lagane h passport ke
      res.redirect("/allProducts");
    });
  } catch (e) {
    req.flash("error", e.message); // jo error hum flash krwa rhe h vo error passport wagera jo hum use kr rhe vo display krwa rha ki konsa error aaya ..jese agar same username hoga toh vo bolega ki 2 username same nhi ho skte.....
    res.redirect("/register");
  }
});

app.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "Successfully Logged Out!");
  res.redirect("/allProducts");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

// app.get('/auth/google/callback',
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   function(req, res) {
//     // Successful authentication, redirect home.
//     res.redirect('/');
//   });

const port = 3000;

app.listen(port, () => {
  console.log(`You are on Port ${port}!!`);
});
