const { redirect } = require("express/lib/response");

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
// declaring passport
server.use(flash());
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
server.get("/", isLoggedIn, (req, res) => {
    res.redirect("/discussions");
});
server.post("/discussions", isLoggedIn, (req, res) => {
    res.redirect("/discussions");
});
server.get("/discussions", isLoggedIn, async (req, res) => {
    try {
        let activeDisc = [];
        if (req.user.utype === "t") {
            activeDisc = await pool1.query(`SELECT dis_id, dis_owner, dis_title, archive, COUNT(DISTINCT top_id) AS top_count, COUNT(DISTINCT res_id) AS res_count FROM discussion LEFT JOIN topic ON dis_id=top_dis LEFT JOIN response ON top_id=res_top WHERE archive=false GROUP BY dis_id ORDER BY dis_id DESC, CASE WHEN dis_owner=$1 THEN 1 ELSE 2 END, dis_owner;`, [req.user.id]);
        }
        else if (req.user.utype === "s") {
            activeDisc = await pool1.query(`SELECT dis_id, dis_owner, dis_title, archive, COUNT(DISTINCT top_id) AS top_count, COUNT(DISTINCT res_id) AS res_count FROM discussion LEFT JOIN topic ON dis_id=top_dis LEFT JOIN response ON top_id=res_top INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND lnk_stu_id=$1 GROUP BY dis_id, id ORDER BY dis_id DESC;`, [req.user.id]);
        };
        res.render("discussion", { user: req.user, activeDiscs: activeDisc.rows, message: req.flash("archiveLimit")[0] });
    }
    catch(e) {
        console.log(e);
        res.render("discussion", { user: req.user, activeDiscs: [], message: req.flash("archiveLimit")[0] });
    };
});

// archive
server.post("/archive", isLoggedIn, isTutor, async (req, res) => {
    res.redirect("/archive");
});
server.get("/archive", isLoggedIn, isTutor, async (req, res) => {
    try {
        const archiveDisc = await pool1.query(`SELECT dis_id, dis_owner, dis_title, archive, COUNT(DISTINCT top_id) AS top_count, COUNT(DISTINCT res_id) AS res_count FROM discussion LEFT JOIN topic ON dis_id=top_dis LEFT JOIN response ON top_id=res_top WHERE dis_owner=$1 AND archive=true GROUP BY dis_id ORDER BY dis_id DESC, CASE WHEN dis_owner=$1 THEN 1 ELSE 2 END, dis_owner;`, [req.user.id]);
        res.render("archive", { user: req.user, archiveDiscs: archiveDisc.rows, message: req.flash("activeLimit")[0] });
    }
    catch(e) {
        console.log(e);
        res.render("archive", { user: req.user, archiveDiscs: [], message: req.flash("activeLimit")[0] });
    };
});

// archive discussion
server.post("/archivediscussion", isLoggedIn, isTutor, async (req, res) => {
    const client = await pool1.connect();
    try {
        await client.query("BEGIN");
        // check that user has <=50 archived boards
        const archiveLimit = await client.query(`SELECT COUNT(dis_id) FROM discussion WHERE dis_owner=$1 AND archive=true;`, [req.user.id]);
        if (parseInt(archiveLimit.rows[0].count) >= 50) {
            req.flash("archiveLimit", "Limit of archived discussion boards reached - please delete archived discussion boards to archive more");
        }
        else {
            await client.query(`UPDATE discussion SET archive=true WHERE dis_id=$1;`, [parseInt(req.query.dis_id)]);
            await client.query("COMMIT");
        };
    }
    catch(e) {
        console.log(e);
        await client.query("ROLLBACK");
    }
    finally {
        client.release();
    };
    res.redirect("/discussions");
});

// unarchive discussion
server.post("/unarchivediscussion", isLoggedIn, isTutor, async (req, res) => {
    const client = await pool1.connect();
    try {
        await client.query("BEGIN");
        // check that user has 0 active discussion boards
        const activeLimit = await client.query(`SELECT COUNT(dis_id) FROM discussion WHERE dis_owner=$1 AND archive=false;`, [req.user.id]);
        if (parseInt(activeLimit.rows[0].count) > 0) {
            req.flash("activeLimit", "A discussion board is already active - please archive or delete it to make another active");
        }
        else {
            await client.query(`UPDATE discussion SET archive=false WHERE dis_id=$1;`, [parseInt(req.query.dis_id)]);
            await client.query("COMMIT");
        };
    }
    catch(e) {
        console.log(e);
        await client.query("ROLLBACK");
    }
    finally {
        client.release();
    };
    res.redirect("/archive");
});

// delete discussion
server.post("/deletediscussion", isLoggedIn, isTutor, async (req, res) => {
    const client = await pool1.connect();
    try {
        await client.query("BEGIN");
        await client.query(`DELETE FROM discussion WHERE dis_id=$1;`, [parseInt(req.query.dis_id)]);
        await client.query("COMMIT");
    }
    catch(e) {
        console.log(e);
        await client.query("ROLLBACK");
    }
    finally {
        client.release();
    };
    res.redirect("back");
});

// new discussion
server.post("/newdiscussion", isLoggedIn, isTutor, (req, res) => {
    res.redirect("/newdiscussion");
});
server.get("/newdiscussion", isLoggedIn, isTutor, (req, res) => {
    // check that user has 0 active discussion boards
    res.render("newdiscussion", { user: req.user, message: req.flash("createDiscError")});
});
server.post("/creatediscussion", isLoggedIn, isTutor, (req, res) => {
    // try {
    //     const newDiscCreds = {
    //         discussionname: req.body.discussionname,
    //         createasarchived: Boolean(req.body.createasarchived)
    //     },
    //           activeLimit = await pool1.query;
    // }
    // catch(e) {
    //     console.log(e);
    //     req.flash("createDiscError", "Unknown error - please try again");
    //     res.redirect("/newdiscussion"); 
    // }
    // const newDiscCreds = {
    //     discussionname: req.body.discussionname,
    //     createasarchived: Boolean(req.body.createasarchived)
    // };
    // // (don't need to check createasarchived, as this 'selected' by default)
    // if (!newDiscCreds.discussionname) {
    //     req.flash("createDiscError", "Please fill all fields");
    //     res.redirect("/newdiscussion");
    // }
    // // else if (newDiscCreds.createasarchived )
    // else {
    //     console.log(newDiscCreds.discussionname, newDiscCreds.createasarchived);
    //     res.redirect("/discussions");
    // };
});

// topic
server.get("/topics", isLoggedIn, (req, res) => {
    // check that user has <=50 topics
    res.render("topic", { user: req.user});
});

// login
server.get("/login", isNotLoggedIn, (req, res) => {
    res.render("login");
});
server.post("/login", passport.authenticate("local", {
        successRedirect: "/discussions",
        failureRedirect: "/login",
        failureFlash: true
    })
);

// register
server.get("/register", isNotLoggedIn, (req, res) => {
    res.render("register", { message: req.flash("registerError")[0] });
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
            req.flash("registerError", "Please fill all fields");
            res.redirect("/register");
        }
        else if (regCreds.pw !== regCreds.confpw) {
            req.flash("registerError", "Passwords do not match");
            res.redirect("/register");
        }
        else if (regExists.rows.length > 0) {
            req.flash("registerError", "ID/email already registered");
            res.redirect("/register");
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
                req.flash("registerError", tempInvalidMsg);
                res.redirect("/register");
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
        req.flash("registerError", "Unknown error - please try again");
        res.redirect("/register");
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
                const pwCheck = await pool1.query(`SELECT id, pw FROM uni_user WHERE id=$1 AND pw=Crypt($2, pw);`, [id, pw]);
                if (pwCheck.rows.length === 1) {
                    return done(null, pwCheck.rows[0]);
                }
                else {
                    return done(null, false, { message: "Incorrect username/password" });
                };
            }
            else {
                return done(null, false, { message: "Incorrect username/password" }); 
            }
        }
        catch(e) {
            console.log(e);
            return done(e, false, { message: "Unknown error - please try again" });
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
        return next();
    };
    return res.redirect("/login");
};

function isNotLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/")
    };
    return next();
};

function isTutor(req, res, next) {
    if (req.user.utype === "t") {
        return next();
    }
    return res.redirect("/discussions");
};

server.listen(port);
