const e = require("express");
const res = require("express/lib/response");
const { runInNewContext } = require("vm");

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
            activeDisc = await pool1.query(`SELECT dis_id, dis_owner, dis_title, archive, COUNT(DISTINCT top_id) AS top_count, COUNT(DISTINCT res_id) AS res_count FROM discussion LEFT JOIN topic ON dis_id=top_dis LEFT JOIN response ON top_id=res_top WHERE archive=false GROUP BY dis_id ORDER BY CASE WHEN dis_owner=$1 THEN 1 ELSE 2 END, dis_owner, dis_id DESC;`, [req.user.id]);
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
server.post("/archive", isLoggedIn, (req, res) => {
    res.redirect("/archive");
});
server.get("/archive", isLoggedIn, isTutor, async (req, res) => {
    try {
        const archiveDisc = await pool1.query(`SELECT dis_id, dis_owner, dis_title, archive, COUNT(DISTINCT top_id) AS top_count, COUNT(DISTINCT res_id) AS res_count FROM discussion LEFT JOIN topic ON dis_id=top_dis LEFT JOIN response ON top_id=res_top WHERE dis_owner=$1 AND archive=true GROUP BY dis_id ORDER BY dis_id DESC;`, [req.user.id]);
        res.render("archive", { user: req.user, archiveDiscs: archiveDisc.rows, message: req.flash("activeLimit")[0] });
    }
    catch(e) {
        console.log(e);
        res.render("archive", { user: req.user, archiveDiscs: [], message: req.flash("activeLimit")[0] });
    };
});

// archive discussion
server.post("/archivediscussion", isLoggedIn, isTutor, async (req, res) => {
    try {
        // check that user has <=50 archived boards
        const archiveLimit = await pool1.query(`SELECT COUNT(dis_id) FROM discussion WHERE dis_owner=$1 AND archive=true;`, [req.user.id]);
        if (parseInt(archiveLimit.rows[0].count) >= 50) {
            req.flash("archiveLimit", "Limit of archived discussion boards reached - please delete archived discussion boards to archive more");
        }
        else {
            await pool1.query(`UPDATE discussion SET archive=true WHERE dis_id=$1;`, [parseInt(req.query.dis_id)]);
        };
    }
    catch(e) {
        console.log(e);
    }
    finally {
        res.redirect("/discussions");
    };
});

// unarchive discussion
server.post("/unarchivediscussion", isLoggedIn, isTutor, async (req, res) => {
    try {
        // check that user has 0 active discussion boards
        const activeLimit = await pool1.query(`SELECT COUNT(dis_id) FROM discussion WHERE dis_owner=$1 AND archive=false;`, [req.user.id]);
        if (parseInt(activeLimit.rows[0].count) > 0) {
            req.flash("activeLimit", "A discussion board is already active - please archive or delete it to make another active");
        }
        else {
            await pool1.query(`UPDATE discussion SET archive=false WHERE dis_id=$1;`, [parseInt(req.query.dis_id)]);
        };
    }
    catch(e) {
        console.log(e);
    }
    finally {
        res.redirect("/archive");
    };
});

// delete discussion
server.post("/deletediscussion", isLoggedIn, isTutor, (req, res, next) => { isPermitted(req, res, next, `SELECT dis_id, dis_owner, archive FROM discussion WHERE dis_id=$1 AND dis_owner=$2;`, "dis_id", "/discussions"); }, async (req, res) => {
    try {
        await pool1.query(`DELETE FROM discussion WHERE dis_id=$1;`, [parseInt(req.query.dis_id)]);
    }
    catch(e) {
        console.log(e);
    }
    finally {
        res.redirect("back");
    };
});

// new discussion
server.post("/newdiscussion", isLoggedIn, (req, res) => {
    res.redirect("/newdiscussion");
});
server.get("/newdiscussion", isLoggedIn, isTutor, (req, res) => {
    res.render("newdiscussion", { user: req.user, message: req.flash("createDiscError") });
});
server.post("/creatediscussion", isLoggedIn, isTutor, async (req, res) => {
    let createDiscSuccess = false;
    try {
        const newDiscCreds = {
            discussionname: req.body.discussionname,
            createasarchived: Boolean(req.body.createasarchived)
        },
              activeLimit = await pool1.query(`SELECT COUNT(dis_id) FROM discussion WHERE dis_owner=$1 AND archive=false;`, [req.user.id]),
              archiveLimit = await pool1.query(`SELECT COUNT(dis_id) FROM discussion WHERE dis_owner=$1 AND archive=true;`, [req.user.id]);

        // (don't need to check createasarchived, as this 'selected' by default)
        if (!newDiscCreds.discussionname) {
            req.flash("createDiscError", "Please fill all fields");
        }
        // check that user has 0 active discussion boards
        else if (!newDiscCreds.createasarchived && parseInt(activeLimit.rows[0].count) > 0) {
            req.flash("createDiscError", "A discussion board is already active - please archive or delete it to create another");
        }
        // check that user has <=50 archived boards
        else if (newDiscCreds.createasarchived && parseInt(archiveLimit.rows[0].count) > 50) {
            req.flash("createDiscError", "Archived discussion limit reached - please delete archived discussion boards to create more");
        }
        else {
            await pool1.query(`INSERT INTO discussion (dis_owner, dis_title, archive) VALUES ($1, $2, $3);`, [req.user.id, newDiscCreds.discussionname, newDiscCreds.createasarchived]);
            createDiscSuccess = true;
        };
    }
    catch(e) {
        if (e.code === "22001") {
            req.flash("createDiscError", "Discussion board name too long - please limit to 50 characters");
        }
        else {
            console.log(e);
            req.flash("createDiscError", "Unknown error - please try again");
        };
    }
    finally {
        if (createDiscSuccess) {
            res.redirect("/discussions");
        }
        else if (!createDiscSuccess) {
            res.redirect("/newdiscussion");
        };
    };
});

// topic
server.post("/topics", isLoggedIn, (req, res) => {
    res.redirect("/topics?dis_id=" + encodeURIComponent(req.query.dis_id));
});
server.get("/topics", isLoggedIn, async (req, res) => {
    try {
        // create middleware to check below
        if (req.query.dis_id && /^[0-9]+$/.test(req.query.dis_id)) {
            let discInfo = [];
            if (req.user.utype === "t") {
                discInfo = await pool1.query(`SELECT dis_id, dis_title, dis_owner FROM discussion WHERE archive=false AND dis_id=$1;`, [parseInt(req.query.dis_id)]);
            }
            else if (req.user.utype === "s") {
                discInfo = await pool1.query(`SELECT dis_id, dis_title, dis_owner FROM discussion INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND dis_id=$1 AND lnk_stu_id=$2 GROUP BY dis_id, id;`, [parseInt(req.query.dis_id), req.user.id]);
            };
            // check that discussion exists, is active, and user has permission to view it
            if (discInfo.rows.length === 0) {
                res.redirect("/discussions");
            }
            else {
                const activeTopic = await pool1.query(`SELECT top_id, top_dis, dis_title, dis_owner, Encode(Decrypt(fname, 'discussKey192192', 'aes'), 'escape')::VARCHAR AS fname, Encode(Decrypt(lname, 'discussKey192192', 'aes'), 'escape')::VARCHAR AS lname, top_title, top_desc, top_datetime, COUNT(DISTINCT res_id) AS res_count FROM topic LEFT JOIN response ON top_id=res_top INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id WHERE top_dis=$1 GROUP BY top_id, dis_id, id ORDER BY top_id DESC;`, [parseInt(req.query.dis_id)]);
                // console.log(String(activeTopics.rows[0].top_datetime.getHours()).padStart(2, "0") + ":" + String(activeTopics.rows[0].top_datetime.getMinutes()).padStart(2, "0") + ":" + String(activeTopics.rows[0].top_datetime.getSeconds()).padStart(2, "0") + " " + String(activeTopics.rows[0].top_datetime.getDate()).padStart(2, "0") + "/" + String(activeTopics.rows[0].top_datetime.getMonth() + 1).padStart(2, "0") + "/" + String(activeTopics.rows[0].top_datetime.getFullYear()));
                res.render("topic", { user: req.user, activeTopic: activeTopic.rows, discInfo: discInfo.rows[0] });
            };
        }
        // redirect if invalid req.query provided
        else {
            return res.redirect("/discussions"); 
        };
    }
    catch(e) {
        console.log(e);
        res.redirect("/discussions");
    };
});

// delete topic
server.post("/deletetopic", isLoggedIn, isTutor, isPermitted(`SELECT dis_id, dis_owner, archive FROM topic INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND top_id=$1 AND dis_owner=$2;`, "top_id", "back"), async (req, res) => {
    try {
        await pool1.query(`DELETE FROM topic WHERE top_id=$1;`, [parseInt(req.query.top_id)]);
    }
    catch(e) {
        console.log(e);
    }
    finally {
        res.redirect("back");
    };
});

// new topic
server.post("/newtopic", isLoggedIn, (req, res) => {
    res.redirect("/newtopic?dis_id=" + encodeURIComponent(req.query.dis_id));
});
server.get("/newtopic", isLoggedIn, isTutor, isPermitted(`SELECT dis_id, dis_owner, archive FROM discussion WHERE archive=false AND dis_id=$1 AND dis_owner=$2;`, "dis_id", "back"), (req, res) => {
    res.render("newtopic", { user: req.user, dis_id: parseInt(req.query.dis_id), message: req.flash("createTopicError") });
});
server.post("/createtopic", isLoggedIn, isTutor, isPermitted(`SELECT dis_id, dis_owner, archive FROM discussion WHERE archive=false AND dis_id=$1 AND dis_owner=$2;`, "dis_id", "back"), async (req, res) => {
    // check that user has <=50 topics
    let createTopicSuccess = false;
    try {
        const newTopicCreds = {
            topicname: req.body.topicname,
            ...(req.body.topicdesc === "" ? { topicdesc: null } : { topicdesc: req.body.topicdesc })
        },
              topicLimit = await pool1.query(`SELECT COUNT(top_id) FROM topic WHERE top_dis=$1;`, [req.query.dis_id]);

        // topic name is only mandatory field
        if (!newTopicCreds.topicname) {
            req.flash("createTopicError", "Please fill topic name field");
        }
        // check that discussion board has <=50 topics
        else if (parseInt(topicLimit.rows[0].count) > 50) {
            req.flash("createTopicError", "Topic limit reached - please delete topics to create more");
        }
        else {
            // top_datetime default is Now()
            await pool1.query(`INSERT INTO topic (top_dis, top_title, top_desc) VALUES ($1, $2, $3)`, [parseInt(req.query.dis_id), newTopicCreds.topicname, newTopicCreds.topicdesc]);
            createTopicSuccess = true;
        };
    }
    catch(e) {
        if (e.code === "22001") {
            req.flash("createTopicError", "Topic name/description too long - please limit to 100/200 characters respectively");
        }
        else {
            console.log(e);
            req.flash("createTopicError", "Unknown error - please try again");
        };
    }
    finally {
        if (createTopicSuccess) {
            res.redirect("/topics?dis_id=" + encodeURIComponent(req.query.dis_id));
        }
        else if (!createTopicSuccess) {
            res.redirect("/newtopic?dis_id=" + encodeURIComponent(req.query.dis_id));
        };
    };
});

// response
server.post("/responses", isLoggedIn, (req, res) => {
    res.redirect("/responses?top_id=" + encodeURIComponent(req.query.top_id));
});
server.get("/responses", isLoggedIn, async (req, res) => {
    try {
        // create middleware to check below
        if (req.query.top_id && /^[0-9]+$/.test(req.query.top_id)) {
            let topInfo = [];
            if (req.user.utype === "t") {
                topInfo = await pool1.query(`SELECT top_id, top_dis, dis_owner, top_title, top_desc, top_datetime FROM topic INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND top_id=$1;`, [req.query.top_id]);
            }
            else if (req.user.utype === "s") {
                topInfo = await pool1.query(`SELECT top_id, top_dis, dis_owner, top_title, top_desc, top_datetime FROM topic INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND top_id=$1 AND lnk_stu_id=$2;`, [req.query.top_id, req.user.id]);
            };
            // check that topic exists, is active, and user has permission to view it
            if (topInfo.rows.length === 0) {
                res.redirect("/discussions");
            }
            else {
                const activeRes = await pool1.query(`SELECT res_id, res_user, Encode(Decrypt(fname, 'discussKey192192', 'aes'), 'escape')::VARCHAR AS fname, Encode(Decrypt(lname, 'discussKey192192', 'aes'), 'escape')::VARCHAR AS lname, res_top, top_title, top_desc, res_title, res_text, res_datetime, replyto, pinned, COUNT(lke_res) AS likes FROM response INNER JOIN uni_user ON res_user=id INNER JOIN topic ON res_top=top_id LEFT JOIN liked ON res_id=lke_res WHERE res_top=$1 GROUP BY res_id, id, top_id ORDER BY pinned DESC, res_datetime ASC;`, [parseInt(req.query.top_id)]),
                      activeLike = await pool1.query(`SELECT lke_user, lke_res FROM liked;`);
                res.render("response", { user: req.user, activeRes: activeRes.rows, activeLike: activeLike.rows, topInfo: topInfo.rows[0] });
            };
        }
        else {
            return res.redirect("/discussions");
        };
    }
    catch(e) {
        console.log(e);
        res.redirect("/discussions");
    };
});

// like response
// server.post("/likeresponse", isLoggedIn, isPermittedCreateLikeRes(`SELECT top_id, top_dis, dis_owner, lnk_stu_id FROM topic INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND top_id=$1 AND lnk_stu_id=$2;`, "top_id", "back"), (req, res) => {
server.post("/likeresponse", isLoggedIn, isPermittedCreateLikeRes, (req, res) => {


    // SELECT res_id, res_user, top_id, dis_id, dis_owner FROM response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND res_id=$1 AND lnk_stu_id=$2;

    // finds user post...
    // SELECT res_id, res_user, top_id, dis_id, dis_owner, lnk_stu_id FROM response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND res_id=$1 AND res_user=$2 AND lnk_stu_id=$2;
    console.log(req.query);
    res.redirect("/discussions");
});

// delete response

// new response
server.post("/newresponse", isLoggedIn, (req, res) => {
    console.log(req.query);
    res.redirect("/discussions");
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
    let regSuccess = false;
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
        }
        else if (regCreds.pw !== regCreds.confpw) {
            req.flash("registerError", "Passwords do not match");
        }
        else if (regExists.rows.length > 0) {
            req.flash("registerError", "ID/email already registered");
        }
        else {
            await pool1.query(`INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ($1, Crypt($2, gen_salt('md5')), Encrypt($3, 'discussKey192192', 'aes'), Encrypt($4, 'discussKey192192', 'aes'), Encrypt($5, 'discussKey192192', 'aes'), Encrypt($6, 'discussKey192192', 'aes'));`, [regCreds.id, regCreds.pw, regCreds.fname, regCreds.lname, regCreds.email, regCreds.utype]);
            regSuccess = true;
        };
    }
    catch (e) {
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
        req.flash("registerError", tempInvalidMsg);
    }
    finally {
        if (regSuccess) {
            res.redirect("/login");
        }
        else if (!regSuccess) {
            res.redirect("/register");
        };
    };
});

// logout
server.post("/logout", (req, res) => {
    req.logout();
    res.redirect("/login");
});

// redirect undefined pages
server.get("*", (req, res) => {
    res.redirect("/discussions");
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
            };
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
        return res.redirect("/discussions")
    };
    return next();
};

function isTutor(req, res, next) {
    if (req.user.utype === "t") {
        return next();
    };
    return res.redirect("/discussions");
};

// function isPermitted(queryText, idParam, redirectTo) {
//     return async (req, res, next) => {
//         try {
//             if (req.query[idParam] && /^[0-9]+$/.test(req.query[idParam])) {
//                 const permitQuery = await pool1.query(queryText, [parseInt(req.query[idParam]), req.user.id]);
//                 // exists, owned by user/belonging to owner
//                 if (permitQuery.rows.length > 0) {
//                     console.log("next");
//                     return next();
//                 }
//                 // does not exist, is not owned by user/belonging to owner
//                 console.log("not permitted");
//                 return res.redirect(redirectTo);
//             };
//             // redirect if invalid req.query provided (deliberate malform)
//             console.log("invalid");
//             console.log(req.query);
//             return res.redirect("/discussions");
//         }
//         catch(e) {
//             console.log(e);
//             return res.redirect("/discussions");
//         };
//     };
// };


// Route.post() requires a callback function
async function isPermitted(req, res, next, queryText, idParam, redirectTo) {
    try {
        if (req.query[idParam] && /^[0-9]+$/.test(req.query[idParam])) {
            const permitQuery = await pool1.query(queryText, [parseInt(req.query[idParam]), req.user.id]);
            // exists, owned by user/belonging to owner
            if (permitQuery.rows.length > 0) {
                console.log("next");
                return next();
            }
            // does not exist, is not owned by user/belonging to owner
            console.log("not permitted");
            return res.redirect(redirectTo);
        };
        // redirect if invalid req.query provided (deliberate malform)
        console.log("invalid");
        console.log(req.query);
        return res.redirect("/discussions");
    }
    catch(e) {
        console.log(e);
        return res.redirect("/discussions");
    };
};

// function isPermittedCreateLikeRes(req, res, next) {
//     if (req.user.utype === "t") {
//         console.log("TUTOR");
//         return next();
//     }
//     else if (req.user.utype === "s") {
//         console.log("STUDENT");
//         return next();
//     };
// };

function isPermittedCreateLikeRes(param) {
    return function(req, res, next){
        isPermitted(req, res, function(){
            // middleware2 code
            if (req.utype === "t") {
                console.log("tutor");
                return next();
            }
            else if (req.utype === "s") {
                // SELECT res_id, top_id, top_dis, dis_owner, lnk_stu_id FROM response INNER JOIN topic ON res_top=top_id INNER JOIN discusison ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND top_id=$1 AND lnk_stu_id=$2;
                console.log("student");
                return next();
            };
        });
    };
};

// function isPermittedCreateLikeRes(queryText, idParam, redirectTo) {
//     return (req, res, next) => {
//         if (req.utype === "t") {
//             console.log("test");
//             return next();
//         }
//         else if (req.utype === "s") {
//             console.log("test");
//             // query to find if user can like/create a response from a certain topic
//             isPermitted(queryText, idParam, redirectTo);
//             // select top_id, top_dis, dis_owner, lnk_stu_id from topic inner join discussion on top_dis=dis_id inner join uni_user on dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND lnk_stu_id='u1928899' and top_id=1;
//             // SELECT res_id, top_id, top_dis, dis_owner, lnk_stu_id FROM response INNER JOIN topic ON res_top=top_id INNER JOIN discusison ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND top_id=$1 AND lnk_stu_id=$2;
//         };
//     };
// };

server.listen(port);
