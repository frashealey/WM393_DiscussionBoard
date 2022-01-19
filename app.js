const express = require("express"),
      path = require("path"),
      { Pool } = require("pg"),
      pool1 = new Pool({
        host: "localhost",
        port: 5432,
        user: "pool1",
        password: "pool1pass",
        database: "discussionboard"
      }),
      port = process.env.PORT || 3000,
      server = express();
// set view engine to ejs
server.set("view engine", "ejs");
server.use(express.static(path.join(__dirname, "public")));

server.get("/", async (req, res) => {
    // res.statusCode = 200;
    // res.writeHead(200, {"Content-Type": "text/html"});

    try {
        // const testResults = await pool1.query("SELECT id, pw, fname, lname, utype FROM uni_user;");
        // const testResults = await pool1.query("SELECT Crypt('testPass123', gen_salt('md5'));");
        // password query: select id, pw from uni_user where pw = Crypt('testPass123', pw);
        const testResults = await pool1.query("SELECT dis_title FROM discussion;");
        console.log(testResults.rows);
    }
    catch (e) {
        console.log(e);
        throw e;
    };

    res.render("login");
    // res.render("home", {x: y});
});

server.post("/login", async (req, res) => {
    console.log("LOGIN");
});

server.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
