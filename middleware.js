const ExpressError = require("./utils/ExpressError");
const product = require("./models/Product");
const review = require("./models/Review");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl; // original path store kr li session mei..
    req.flash("error", "Please Login or Register first!");
    return res.redirect("/login");
  }
  next();
};

// module.exports.validateProduct = (req, res, next) => {
//   const { error } = querySchema.validate(req.body);
//   if (error) {
//     const msg = error.details.map((el) => el.message).join(",");
//     throw new ExpressError(msg, 400);
//   } else {
//     next();
//   }
// };
// module.exports.validateReview = (req, res, next) => {
//   const { error } = answerSchema.validate(req.body);
//   if (error) {
//     const msg = error.details.map((el) => el.message).join(",");
//     throw new ExpressError(msg, 400);
//   } else {
//     next();
//   }
// };

module.exports.isProductAuthor = async (req, res, next) => {
  const { id } = req.params;
  const prod = await product.findById(id); // ab problem ye h ki humne edit aur delete ke button toh hide kr diye(jo uss campground ka author ya maalik nhi h uske liye hide rhega) pr fir bhi hum upar url mei /edit wagera krke changes kr skte h toh issey resolve krne ke liye humne ye middleware banaya...
  if (!prod.author.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that");
    return res.redirect(`/showProduct/${id}`);
  }
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const rew = await review.findById(reviewId); // ab problem ye h ki humne edit aur delete ke button toh hide kr diye(jo uss review ka author ya maalik nhi h uske liye hide rhega) pr fir bhi hum upar url mei /edit wagera krke changes kr skte h toh issey resolve krne ke liye humne ye middleware banaya...
  console.log(rew);
  if (!rew.author.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that");
    return res.redirect(`/showProduct/${id}`);
  }
  next();
};
