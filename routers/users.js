if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const User = require("../models/users");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator");
const {checkAuthenticated, checkNotAuthenticated} = require('../middleware/authenticated')
const router = new express.Router();
const LocalStrategy = require("passport-local").Strategy;


const initializePassport = require("../passport-config");

initializePassport(
  passport,
  async (email) => await User.findOne({ email: email }),
  async (id) => await User.findById(id)
);

router.use(flash());
router.use(
  session({
    // name: "user",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 *60 },
  })
);
router.use(bodyParser.urlencoded({ extended: false }))
router.use(express.urlencoded({ extended: false }));
router.use(passport.initialize());
router.use(passport.session());

router.post(
  "/signup",
  checkNotAuthenticated,
  [
    check("username", "This username must be atleast length of 3")
      .exists()
      .isLength({ min: 3 }),
    check("email", "email is not valid.").isEmail().normalizeEmail(),
    check("password", "Password must be atleast length 7")
      .exists()
      .isLength({ min: 7 }),
    check("password", "password does not match").custom(
      (value, { req }) => value === req.body.confirm_password
    ),
    check("email", "email is already exists").custom(async (value) => {
      if (await User.findOne({ email: value })) {
        throw new Error("Email Already exists.");
      }
    }),
  ],
  async (req, res) => {
    const { username, email, password, confirm_password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const alert = errors.array();
      res.render("signup", { alert });
    } else {
      try {
        const user = new User({ username, email, password });
        await user.save();
        res.redirect("signin");
      } catch (err) {
        res.render("signup");
      }
    }
  }
);

router.post(
  "/signin",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: `/`,
    failureRedirect: "/signin",
    failureFlash: true,
  })
  // (req, res, next) => {
  //   passport.authenticate("local", (err, user, info) => {
  //     if (err) {
  //       req.flash('error', 'Login Failed')
  //       return next(err);
  //     }
  //     if (!user) {
  //       req.flash('error', info.message)
  //       return res.redirect("/signin")
  //     }
  //     req.login(user, (err) => {
  //       if(err) {
  //         req.flash('error', 'Login Failed')
  //         return next(err)}
  //       return res.redirect(`/`)
  //     })
  //   })(req, res, next);
  // }
);

router.post('/enter',(req, res) => {
  roomId = req.body.roomId
  if(roomId.length === 9 ) res.redirect(`/${roomId}`)
  else res.status(401).redirect('/')
  
})

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/signin')
})

module.exports = router;
