const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    const user = await getUserByEmail(email);
    if (user == null) {
      return done(null, false, { message: "No User with that email" });
    }
    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Wrong password" });
      }
    } catch (error) {
      return done(error, { message: "jagu" });
    }
  };
  passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    done(null, await getUserById(id));
  });
}

module.exports = initialize;
