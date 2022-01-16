/*
npm install pg
npm install express
npm install ejs
*/

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
      crypto = require("crypto"),
      port = process.env.PORT || 3000,
      server = express();
// set view engine to ejs
server.set("view engine", "ejs");
server.use(express.static(path.join(__dirname, "public")));

server.get("/", async (req, res) => {
    // res.statusCode = 200;
    // res.writeHead(200, {"Content-Type": "text/html"});
    const testResults = await pool1.query("SELECT id, fname, lname, utype FROM uni_user;");
    // var decipher = crypto.createDecipheriv("bf-cbc", "discKey192");
        // dec = Buffer.concat([decipher.update(testResults.rows[0].fname) , decipher.final()]);
    console.log(testResults.rows);
    res.render("home");
});

server.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
