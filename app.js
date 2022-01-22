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
    // let tempUtype;
    // if (Boolean(req.body.utype)) {
    //     tempUtype = 1
    // }
    // else {

    // }
    const regCreds = {
        id: req.body.id,
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        pw: req.body.pw,
        confpw: req.body.confpw,
        utype: tempUtype
    },
          regExists = await pool1.query(`SELECT id, email, pw FROM uni_user WHERE id=$1 OR email=Encrypt($2, 'discussKey192192', 'aes');`, [regCreds.id, regCreds.email]);
        let regInvalid;
    console.log(regCreds.utype);
    // (don't need to check utype, as this 'selected' by default)
    if (!regCreds.id || !regCreds.fname || !regCreds.lname || !regCreds.email || !regCreds.pw || !regCreds.confpw) {
        regInvalid = {message: "Fill all fields"};
    }
    else if (pw !== confpw) {
        regInvalid = {message: "Passwords do not match"};
    }
    else if (regExists.rows.length > 0) {
        regInvalid = {message: "ID/email already registered"};
    }
//     // register user
//     else {
//         pool1.query(`INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ($1, Crypt($2, gen_salt('md5')), Encrypt($3, 'discussKey192192', 'aes'), Encrypt($4, 'discussKey192192', 'aes'), Encrypt($5, 'discussKey192192', 'aes'), Encrypt($6, 'discussKey192192', 'aes'))`)
// //         INSERT INTO uni_user (id, pw, fname, lname, email, utype)
// // VALUES
// //     ('u2139948', Crypt('testPass123', gen_salt('md5')), Encrypt('John', 'discussKey192192', 'aes'), Encrypt('Smith', 'discussKey192192', 'aes'), Encrypt('john.smith@warwick.ac.uk', 'discussKey192192', 'aes'), Encrypt('t', 'discussKey192192', 'aes'));
//     };
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
