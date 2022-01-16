/*
npm install pg
npm install express
npm install ejs
*/

const express = require("express"),
      path = require("path"),
    //   { Pool } = require("pg"),
      port = process.env.PORT || 3000,
    //   dbCreds = {
    //                 user: "pool1",
    //                 host: "localhost",
    //                 database: "discussionboard",
    //                 password: "pool1pass",
    //                 port: 5432,
    //             },
      server = express();
// set view engine to ejs
server.set("view engine", "ejs");
server.use(express.static(path.join(__dirname, "public")));

server.get("/", async (req, res) => {
    // res.statusCode = 200;
    // res.writeHead(200, {"Content-Type": "text/html"});
    res.render("home");
});

server.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
