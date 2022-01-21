const express = require("express"),
      bodyParser = require("body-parser"),
      path = require("path"),
      { Pool } = require("pg"),
      pool1 = new Pool({
        host: "localhost",
        port: 5432,
        user: "pool1",
        password: "pool1pass",
        database: "discussionboard"
      }),
      passport = require("passport"),
      LocalStrategy = require("passport-local").Strategy,
      flash = require("express-flash"),
      session = require("express-session"),
      port = process.env.PORT || 3000,
      server = express();
// declaring view engine (as ejs)
server.set("view engine", "ejs");
// declaring folder structure
server.use(express.static(path.join(__dirname, "public")));
// declaring bodyParser (e.g. to read data from forms)
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));

server.get("/", async (req, res) => {
    // try {
    //     // const testResults = await pool1.query("SELECT id, pw, fname, lname, utype FROM uni_user;");
    //     // const testResults = await pool1.query("SELECT Crypt('testPass123', gen_salt('md5'));");
    //     // password query: select id, pw from uni_user where pw = Crypt('testPass123', pw);
    //     const testResults = await pool1.query("SELECT dis_title FROM discussion;");
    //     console.log(testResults.rows);
    // }
    // catch (e) {
    //     console.log(e);
    //     throw e;
    // };

    res.redirect("/register");
    // res.render("discussion");
});

server.get("/login", async (req, res) => {
    res.render("login");
});
server.post("/login", async (req, res) => {
    const logCreds = {
        id: req.body.id,
        pw: req.body.pw,
    };
    console.log(logCreds);
});

server.get("/register", async (req, res) => {
    res.render("register");
});
server.post("/register", async (req, res) => {
    const regCreds = {
        id: req.body.id,
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        pw: req.body.pw,
        confpw: req.body.confpw,
        utype: Boolean(req.body.utype)
    },
          regExists = await pool1.query(`SELECT id, email, pw FROM uni_user WHERE id=$1 OR email=pgp_sym_encrypt($2, 'discussKey192192', 'cipher-algo=aes128');`, [regCreds.id, regCreds.email]);
        let regInvalid;

    // SELECT id, pw FROM uni_user WHERE id='u2139948' OR email=pgp_sym_encrypt('jerry.seinfeld@warwick.ac.uk', 'discussKey192192', 'cipher-algo=aes128');
    // SELECT id, pw FROM uni_user WHERE id='u2139948';
    // SELECT id, email FROM uni_user WHERE email=(pgp_sym_encrypt('jerry.seinfeld@warwick.ac.uk', 'discussKey192192', 'cipher-algo=aes128'));
    // SELECT id, pw FROM uni_user WHERE pgp_sym_decrypt(email, 'discussKey192192', 'cipher-algo=aes128')='jerry.seinfeld@warwick.ac.uk';

    console.log(regExists.rows.length);
    // // faster execution than for loop
    // // (don't need to check utype, as this 'selected' by default)
    // if (!regCreds.id || !regCreds.fname || !regCreds.lname || !regCreds.email || !regCreds.pw || !regCreds.confpw) {
    //     regInvalid = {message: "Fill all fields"};
    // }
    // else if (pw !== confpw) {
    //     regInvalid = {message: "Passwords do not match"};
    // };
});

server.post("/logout", (req, res) => {
    // req.logout();
    // res.redirect("/login");
    console.log("LOGOUT");
});

// redirect undefined pages to home page
server.get("*", function(req, res) {
    res.redirect("/");
});




// function passportInit(passport) {

// };
// function userAuth() {

// };





server.listen(port);
