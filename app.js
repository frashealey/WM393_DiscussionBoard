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
      flash = require("express-flash"),
      session = require("express-session"),
      port = process.env.PORT || 3000,
      server = express();
// declaring view engine (as ejs), folder structure, and bodyParser
server.set("view engine", "ejs");
server.use(express.static(path.join(__dirname, "public")));
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

    res.redirect("/login");
    // res.render("discussion", {x: y});
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
    };
    console.log(regCreds);
});

// redirect undefined pages to home page
server.get("*", function(req, res) {
    res.redirect("/");
});

server.listen(port);
