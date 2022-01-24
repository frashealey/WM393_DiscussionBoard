const { initialize } = require("passport");
const { execPath } = require("process");

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
server.use(flash());




// declaring passport
passportInit(passport);
server.use(
    session({
        // this would normally be placed in .env with .gitignore,
        // but for purposes of assessment it is here
        secret: "discussSession192192",
        resave: false,
        saveUninitialized: false
    })
);
server.use(passport.initialize());
server.use(passport.session());





server.get("/", checkNotAuthenticated, async (req, res) => {
    // try {
    //     // const testResults = await pool1.query("SELECT id, pw, fname, lname, utype FROM uni_user;");
    //     // const testResults = await pool1.query("SELECT Crypt('testPass123', gen_salt('md5'));");
    //     // password query: select id, pw from uni_user where pw = Crypt('testPass123', pw);
    //     const testResults = await pool1.query("SELECT dis_title FROM discussion;");
    //     console.log(testResults.rows);
    // }
    // catch(e) {
    //     console.log(e);
    //     throw e;
    // };

    console.log(req.user);
    res.render("discussion");
});

server.get("/login", checkAuthenticated, async (req, res) => {
    res.render("login");
});
// server.post("/login", async (req, res) => {
//     const logCreds = {
//         id: req.body.id,
//         pw: req.body.pw,
//     };
//     console.log(logCreds);
// });
server.post("/login", passport.authenticate("local", {
        successRedirect: "/discussion",
        failureRedirect: "/login",
        failureFlash: true
    })
);

server.get("/register", checkAuthenticated, async (req, res) => {
    res.render("register");
});
server.post("/register", async (req, res) => {
    try {
        const regCreds = {
            id: req.body.id,
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            pw: req.body.pw,
            confpw: req.body.confpw,
            ...(Boolean(req.body.utype) ? { utype: "s" } : { utype: "t" })
        },
              regExists = await pool1.query(`SELECT id, email, pw FROM uni_user WHERE id=$1 OR email=Encrypt($2, 'discussKey192192', 'aes');`, [regCreds.id, regCreds.email]);

        // (don't need to check utype, as this 'selected' by default)
        if (!regCreds.id || !regCreds.fname || !regCreds.lname || !regCreds.email || !regCreds.pw || !regCreds.confpw) {
            res.render("register", {invalidMsg: "Please fill all fields"});
        }
        else if (regCreds.pw !== regCreds.confpw) {
            res.render("register", {invalidMsg: "Passwords do not match"});
        }
        else if (regExists.rows.length > 0) {
            res.render("register", {invalidMsg: "ID/email already registered"});
        }
        // register user
        else {
            const client = await pool1.connect();
            let regSuccess = false;
            try {
                await client.query("BEGIN");
                await client.query(`INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ($1, Crypt($2, gen_salt('md5')), Encrypt($3, 'discussKey192192', 'aes'), Encrypt($4, 'discussKey192192', 'aes'), Encrypt($5, 'discussKey192192', 'aes'), Encrypt($6, 'discussKey192192', 'aes'));`,
                                   [regCreds.id, regCreds.pw, regCreds.fname, regCreds.lname, regCreds.email, regCreds.utype]);
                await client.query("COMMIT");
                regSuccess = true;
            }
            catch(e) {
                let tempInvalidMsg;
                // do not need to clarify for utype constraint, as input is checkbox
                if (e.code === "23514" && e.constraint === "uni_user_id_check") {
                    tempInvalidMsg = "Invalid university ID";
                }
                else if (e.code === "23514" && e.constraint === "uni_user_email_check") {
                    tempInvalidMsg = "Invalid university email";
                }
                else {
                    tempInvalidMsg = "Unknown error - please try again";
                    console.log(e);
                };
                await client.query("ROLLBACK");
                res.render("register", {invalidMsg: tempInvalidMsg});
            }
            finally {
                client.release();
                if (regSuccess) { res.redirect("/login") };
            };
        };
    }
    // regExists or bodyParser error
    catch(e) {
        console.log(e);
        res.render("register", {invalidMsg: "Unknown error - please try again"});
    };
});

server.post("/logout", (req, res) => {
    console.log("LOGOUT");
    // req.logout();
    // res.redirect("/login");
});

// redirect undefined pages to home page
server.get("*", function(req, res) {
    res.redirect("/");
});





function passportInit(passport) {
    passport.use(new LocalStrategy({ usernameField: "id", passwordField: "pw" }, userAuth));

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        try {
            const findUser = pool1.query(`SELECT id, pw, fname, lname, email, utype FROM users WHERE id=$1;`, [id]);
            return done(null, findUser.rows[0]);
        }
        catch(e) {
            return done(e);
        };
    });
};

async function userAuth(id, pw, done) {
    console.log(id, pw);
    // const pwCheck = await pool1.query(`SELECT * FROM uni_user WHERE id=$1::VARCHAR;` [id]);
    // console.log(pwCheck.rows);







    // try {
    //     const idCheck = await pool1.query(`SELECT id FROM uni_user WHERE id=$1;` [id]);
    //     // password check
    //     if (idCheck.rows.length === 1) {
    //         try {
    //             const pwCheck = await pool1.query(`SELECT id, pw FROM uni_user WHERE id=$1 AND pw=Crypt($2, pw);` [id, pw]);
    //             if (pwCheck.rows.length === 1) {
    //                 console.log("SUCCESS");
    //                 return done(null, pwCheck.rows[0]);
    //             }
    //             else {
    //                 console.log("Password incorrect");
    //                 return done(null, false, {message: "Password is incorrect"});
    //             };
    //         }
    //         catch(e) {
    //             console.log(e);
    //             res.render("login", {message: "Unknown error - please try again"});
    //         };
    //     }
    //     // no user found
    //     else {
    //         console.log("No user with that ID");
    //         return done(null, false, {message: "No user with that ID found"});
    //     };
    // }
    // // idCheck error
    // catch(e) {
    //     console.log(e);
    //     res.render("login", {message: "Unknown error - please try again"});
    // };
};




function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/discussion");
    };
    next();
};

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    };
    res.redirect("/login");
};




server.listen(port);
