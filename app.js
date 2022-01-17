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
      bcrypt = require("bcrypt"),
      port = process.env.PORT || 3000,
      server = express();
// set view engine to ejs
server.set("view engine", "ejs");
server.use(express.static(path.join(__dirname, "public")));

server.get("/", async (req, res) => {
    // res.statusCode = 200;
    // res.writeHead(200, {"Content-Type": "text/html"});
    // const testResults = await pool1.query("SELECT id, pw, fname, lname, utype FROM uni_user;");
    // const hash1 = await bcrypt.hashSync("testPass123", bcrypt.genSaltSync(8));
    // const result = await bcrypt.compare("testPass123", hash1);


    const cipher = await crypto.createCipheriv("aes256", "discKey192discKey192discKey19219", "0000000000000000");
    const encryptedData = cipher.update("testEncrypt", "utf8", "base64") + cipher.final("base64");

    // const decipher = await crypto.createDecipheriv("aes128", "discusKey1928864", "0000000000000000");
    // const decryptedData = decipher.update("1826f9d600f3d512b767e9c2b5a9759d".toString("ascii"), "base64", "utf8") + decipher.final("utf8");
    // console.log(encryptedData);
    // console.log(decryptedData);

    // select encrypt_iv('testEncrypt', 'discusKey192', '0000000000000000', 'aes');
    // select encode(decrypt_iv('\x1826f9d600f3d512b767e9c2b5a9759d', 'discusKey192', '0000000000000000', 'aes'), 'escape');
    // select decrypt_iv('\x18&\371\326\000\363\325\x12\267g\351\302\265\251u\235', 'discusKey192', '0000000000000000', 'aes');

    // select encode(encrypt_iv('testEncrypt', 'discusKey192', '0000000000000000', 'aes'), 'escape');

    console.log(encryptedData);

    // console.log(testResults.rows);
    res.render("home");
});

server.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
