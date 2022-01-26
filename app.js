const { execPath } = require("process"),
      express = require("express"),
      bodyParser = require("body-parser"),
      path = require("path"),
      { Pool } = require("pg"),
      pool1 = new Pool({
        host: "ec2-54-220-14-54.eu-west-1.compute.amazonaws.com",
        port: 5432,
        user: "ncwvkhbstisnwb",
        password: "709e09497df536b208f5fddd1f105e5b7aa05c5555e46d6fc4b0bfb2fa1e9098",
        database: "dvj5v33apq5oj",
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
      }),
    //   { initialize } = require("passport"),
      passport = require("passport"),
      LocalStrategy = require("passport-local").Strategy,
      flash = require("express-flash"),
      session = require("cookie-session"),
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
        // this would normally be placed in .env with .gitignore
        // (but for assessment purposes it is here)
        secret: "discussSession192192",
        resave: false,
        saveUninitialized: false
    })
);
server.use(passport.initialize());
server.use(passport.session());
// prevents browser back button (browser cache) depending on logged-in state
server.use((req, res, next) => {
    res.set("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
    next();
});

// discussion
server.get("/", isNotLoggedIn, (req, res) => {
    res.redirect("/discussions");
});
server.get("/discussions", isNotLoggedIn, async (req, res) => {
    try {
        let activeDisc = [];
        if (req.user.utype === "t") {
            activeDisc = await pool1.query(`SELECT dis_id, dis_owner, Encode(Decrypt(fname, 'discussKey192192', 'aes'), 'escape')::VARCHAR AS fname, Encode(Decrypt(lname, 'discussKey192192', 'aes'), 'escape')::VARCHAR AS lname, dis_title, archive, COUNT(DISTINCT top_id) AS top_count, COUNT(DISTINCT res_id) AS res_count FROM discussion LEFT JOIN topic ON dis_id=top_dis LEFT JOIN response ON top_id=res_top INNER JOIN uni_user ON dis_owner=id WHERE archive=false GROUP BY dis_id, id ORDER BY dis_id DESC, CASE WHEN dis_owner=$1 THEN 1 ELSE 2 END, dis_owner;`, [req.user.id]);
        }
        else if (req.user.utype === "s") {
            activeDisc = await pool1.query(`SELECT dis_id, dis_owner, Encode(Decrypt(uni_user.fname, 'discussKey192192', 'aes'), 'escape')::VARCHAR AS fname, Encode(Decrypt(uni_user.lname, 'discussKey192192', 'aes'), 'escape')::VARCHAR AS lname, dis_title, archive, COUNT(DISTINCT top_id) AS top_count, COUNT(DISTINCT res_id) AS res_count FROM discussion LEFT JOIN topic ON dis_id=top_dis LEFT JOIN response ON top_id=res_top INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND lnk_stu_id=$1 GROUP BY dis_id, id ORDER BY dis_id DESC;`, [req.user.id]);
        };
        res.render("discussion", { user: req.user, activeDiscs: activeDisc.rows });
    }
    catch(e) {
        console.log(e);
        res.render("discussion", { user: req.user, activeDiscs: [] });
    };
});

// topic
server.get("/topics", isNotLoggedIn, async (req, res) => {
    res.render("topic", { user: req.user});
});

// login
server.get("/login", isLoggedIn, (req, res) => {
    res.render("login");
});
server.post("/login", passport.authenticate("local", {
        successRedirect: "/discussion",
        failureRedirect: "/login",
        failureFlash: true
    })
);

// register
server.get("/register", isLoggedIn, (req, res) => {
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
            res.render("register", {message: "Please fill all fields"});
        }
        else if (regCreds.pw !== regCreds.confpw) {
            res.render("register", {message: "Passwords do not match"});
        }
        else if (regExists.rows.length > 0) {
            res.render("register", {message: "ID/email already registered"});
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
                res.render("register", {message: tempInvalidMsg});
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
        res.render("register", {message: "Unknown error - please try again"});
    };
});

// logout
server.post("/logout", (req, res) => {
    req.logout();
    res.redirect("/login");
});

// redirect undefined pages
server.get("*", (req, res) => {
    res.redirect("/");
});

function passportInit(passport) {
    passport.use(new LocalStrategy({ usernameField: "id", passwordField: "pw" }, async (id, pw, done) => {
        try {
            const idCheck = await pool1.query(`SELECT id FROM uni_user WHERE id=$1`, [id]);
            if (idCheck.rows.length) {
                try {
                    const pwCheck = await pool1.query(`SELECT id, pw FROM uni_user WHERE id=$1 AND pw=Crypt($2, pw);`, [id, pw]);
                    if (pwCheck.rows.length === 1) {
                        return done(null, pwCheck.rows[0]);
                    }
                    else {
                        return done(null, false, {message: "Incorrect username/password"});
                    };
                }
                catch(e) {
                    console.log(e);
                    res.render("login", {message: "Unknown error - please try again"});
                };
            }
            else {
                return done(null, false, {message: "Incorrect username/password"}); 
            }
        }
        catch(e) {
            console.log(e);
            res.render("login", {message: "Unknown error - please try again"});
        };
    }));

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        try {
            const findUser = await pool1.query(`SELECT id, pw, Encode(Decrypt(fname, 'discussKey192192', 'aes'), 'escape')::VARCHAR AS fname, Encode(Decrypt(lname, 'discussKey192192', 'aes'), 'escape')::VARCHAR AS lname, Encode(Decrypt(email, 'discussKey192192', 'aes'), 'escape')::VARCHAR AS email, Encode(Decrypt(utype, 'discussKey192192', 'aes'), 'escape')::CHAR(1) AS utype FROM uni_user WHERE id=$1;`, [id]);
            return done(null, findUser.rows[0]);
        }
        catch(e) {
            return done(e);
        };
    });
};

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/discussion");
    };
    next();
};

function isNotLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    };
    res.redirect("/login");
};

server.listen(port);
