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
        // this would normally be placed in .env with .gitignore (but for assessment purposes it is here)
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
server.post("/deletediscussion", isLoggedIn, isTutor, isPermittedTut(`SELECT dis_id, dis_owner, archive FROM discussion WHERE dis_id=$1 AND dis_owner=$2;`, "dis_id", "/discussions"), async (req, res) => {
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
server.post("/deletetopic", isLoggedIn, isTutor, isPermittedTut(`SELECT dis_id, dis_owner, archive FROM topic INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND top_id=$1 AND dis_owner=$2;`, "top_id", "back"), async (req, res) => {
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
server.get("/newtopic", isLoggedIn, isTutor, isPermittedTut(`SELECT dis_id, dis_owner, archive FROM discussion WHERE archive=false AND dis_id=$1 AND dis_owner=$2;`, "dis_id", "back"), (req, res) => {
    res.render("newtopic", { user: req.user, dis_id: parseInt(req.query.dis_id), message: req.flash("createTopicError") });
});
server.post("/createtopic", isLoggedIn, isTutor, isPermittedTut(`SELECT dis_id, dis_owner, archive FROM discussion WHERE archive=false AND dis_id=$1 AND dis_owner=$2;`, "dis_id", "back"), async (req, res) => {
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
                res.render("response", { user: req.user, activeRes: activeRes.rows, activeLike: activeLike.rows, topInfo: topInfo.rows[0], message: req.flash("viewResponseError") });
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

// like/unlike response
server.post("/likeresponse", isLoggedIn, isPermittedStuTut(`SELECT res_id, res_user, top_id, dis_id, dis_owner FROM response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND res_id=$1 AND lnk_stu_id=$2;`, `SELECT res_id from response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND res_id=$1 AND $2=$2;`, "res_id", "back"), async (req, res) => {
    // do isPermitted in a single query
    // returns IDs of students' tutors or ID if tutor
    // SELECT id FROM uni_user LEFT JOIN link_user ON id=lnk_tut_id WHERE (id='u8888888' AND Encode(Decrypt(utype, 'discussKey192192', 'aes'), 'escape')::CHAR(1)='t') OR (lnk_stu_id='u8888888');
    // SELECT id, dis_id, top_id, res_id, res_user FROM uni_user LEFT JOIN link_user ON id=lnk_tut_id LEFT JOIN discussion ON id=dis_owner LEFT JOIN topic ON dis_id=top_dis LEFT JOIN response ON top_id=res_top WHERE (id='u8888888' AND Encode(Decrypt(utype, 'discussKey192192', 'aes'), 'escape')::CHAR(1)='t') OR (lnk_stu_id='u8888888');

    // gets tutor
    // SELECT id, res_id, res_user FROM response RIGHT JOIN uni_user ON res_user=id WHERE Encode(Decrypt(utype, 'discussKey192192', 'aes'), 'escape')::CHAR(1)='t';
    // SELECT id FROM uni_user WHERE Encode(Decrypt(utype, 'discussKey192192', 'aes'), 'escape')::CHAR(1)='t';

    // gets whether student permitted
    // SELECT lnk_stu_id, res_id, top_id, res_user FROM response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE lnk_stu_id='u1827746';


    try {
        // check if user has/has not liked post
        const isLiked = await pool1.query(`SELECT lke_user, lke_res FROM liked WHERE lke_user=$1 AND lke_res=$2;`, [req.user.id, req.query.res_id]);
        if (isLiked.rows.length === 0) {
            await pool1.query(`INSERT INTO liked (lke_user, lke_res) VALUES ($1, $2);`, [req.user.id, parseInt(req.query.res_id)]);
        }
        else {
            await pool1.query(`DELETE FROM liked WHERE lke_user=$1 AND lke_res=$2;`, [req.user.id, parseInt(req.query.res_id)]);
        };
    }
    catch(e) {
        console.log(e);
    }
    finally {
        res.redirect("back");
    };
});

// pin response
server.post("/pinresponse", isLoggedIn, isTutor, isPermittedTut(`SELECT res_id, res_top, dis_id, dis_owner, archive FROM response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND res_id=$1 AND dis_owner=$2;`, "res_id", "back"), async (req, res) => {
    // creates a client as transactions are needed here
    const client = await pool1.connect();
    try {
        // check if post is pinned/unpinned and if a response in given topic is pinned
        const isPinned = await client.query(`SELECT res_id, pinned FROM response WHERE res_id=$1;`, [parseInt(req.query.res_id)]),
              topicPinned = await client.query(`SELECT B.res_id, B.res_top, B.pinned FROM response A INNER JOIN response B ON A.res_top=B.res_top WHERE A.res_id=$1 AND B.pinned=true;`, [parseInt(req.query.res_id)]);
        // unpin response
        if (isPinned.rows[0].pinned) {
            await client.query(`UPDATE response SET pinned=false WHERE res_id=$1`, [parseInt(req.query.res_id)]);
        }
        // unpin old response and pin new response
        else if (topicPinned.rows.length > 0) {
            await client.query("BEGIN");
            await client.query(`UPDATE response SET pinned=false WHERE res_id=$1`, [topicPinned.rows[0].res_id]);
            await client.query(`UPDATE response SET pinned=true WHERE res_id=$1`, [parseInt(req.query.res_id)]);
            await client.query("COMMIT");
        }
        // pin response
        else {
            await client.query(`UPDATE response SET pinned=true WHERE res_id=$1`, [parseInt(req.query.res_id)]);
        };
    }
    catch(e) {
        console.log(e);
        await client.query("ROLLBACK");
    }
    finally {
        client.release();
        res.redirect("back");
    };
});

// delete response
server.post("/deleteresponse", isLoggedIn, isPermittedStuTut(`SELECT res_id, res_user, top_id, dis_id, dis_owner FROM response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND res_id=$1 AND lnk_stu_id=$2;`, `SELECT res_id, res_user, top_id, dis_id, dis_owner FROM response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND res_id=$1 AND dis_owner=$2;`, "res_id", "back"), async (req, res) => {
    // do isPermitted in a single query
    try {
        const resDatetime = await pool1.query(`SELECT res_id, res_user, res_datetime FROM response WHERE res_id=$1;`, [parseInt(req.query.res_id)]);
        // tutors can delete responses with no time limit
        if (req.user.utype === "t") {
            await pool1.query(`DELETE FROM response WHERE res_id=$1;`, [parseInt(req.query.res_id)]);
        }
        else if (req.user.utype === "s") {
            // checks if > 10 mins (in ms) have passed since response created
            if (Date.now() - resDatetime.rows[0].res_datetime.getTime() > 600000) {
                req.flash("viewResponseError", "10 minute delete window has elapsed - please contact tutor");
            }
            else {
                await pool1.query(`DELETE FROM response WHERE res_id=$1;`, [parseInt(req.query.res_id)]);
            };
        };
    }
    catch(e) {
        console.log(e);
    }
    finally {
        res.redirect("back");
    };
});

// new response
server.get("/newreply", isLoggedIn, isPermittedStuTut(`SELECT res_id, res_user, top_id, dis_id, dis_owner FROM response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND res_id=$1 AND lnk_stu_id=$2;`, `SELECT res_id from response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND res_id=$1 AND $2=$2;`, "replyto", "back"), (req, res) => {
    res.redirect("/newresponse?top_id=" + encodeURIComponent(req.query.top_id) + "&replyto=" + encodeURIComponent(req.query.replyto));
});
server.get("/newresponse", isLoggedIn, isPermittedStuTut(`SELECT top_id FROM topic INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND top_id=$1 AND lnk_stu_id=$2;`, `SELECT top_id from topic INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND top_id=$1 AND $2=$2;`, "top_id", "back"), async (req, res) => {
    try {
        const topInfo = await pool1.query(`SELECT top_id, top_dis, top_title, top_desc, top_datetime FROM topic WHERE top_id=$1;`, [req.query.top_id]);
        if (req.query.replyto) {
            res.render("newresponse", { user: req.user, topInfo: topInfo.rows[0], replyto: parseInt(req.query.replyto), message: req.flash("createResponseError") });
        }
        else {
            res.render("newresponse", { user: req.user, topInfo: topInfo.rows[0], message: req.flash("createResponseError") });
        }
    }
    catch(e) {
        console.log(e);
        res.redirect("back");
    };
});
server.post("/createresponse", isLoggedIn, isPermittedStuTut(`SELECT top_id FROM topic INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND top_id=$1 AND lnk_stu_id=$2;`, `SELECT top_id from topic INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND top_id=$1 AND $2=$2;`, "top_id", "back"), async (req, res) => {
    let createResponseSuccess = false;
    try {
        const newResponseCreds = {
            res_title: req.body.res_title,
            res_text: req.body.res_text
        };
        // checks both fields filled
        if (!newResponseCreds.res_title || !newResponseCreds.res_text) {
            req.flash("createResponseError", "Please fill all fields");
        }
        else {
            if (req.query.replyto) {
                await pool1.query(`INSERT INTO response (res_user, res_top, res_title, res_text, replyto) VALUES ($1, $2, $3, $4, $5)`, [req.user.id, parseInt(req.query.top_id), newResponseCreds.res_title, newResponseCreds.res_text, parseInt(req.query.replyto)]);
                createResponseSuccess = true;
            }
            else {
                await pool1.query(`INSERT INTO response (res_user, res_top, res_title, res_text) VALUES ($1, $2, $3, $4)`, [req.user.id, parseInt(req.query.top_id), newResponseCreds.res_title, newResponseCreds.res_text]);
                createResponseSuccess = true;
            };
        };
    }
    catch(e) {
        if (e.code === "22001") {
            req.flash("createResponseError", "Response title/text too long - please limit to 100/2000 characters respectively");
        }
        else if (e.code === "P0001") {
            req.flash("createResponseError", "Replying to response not in topic - please try again");
        }
        else {
            console.log(e);
            req.flash("createResponseError", "Unknown error - please try again");
        };
    }
    finally {
        if (createResponseSuccess) {
            res.redirect("/responses?top_id=" + encodeURIComponent(req.query.top_id));
        }
        else if (!createResponseSuccess) {
            if (req.query.replyto) {
                res.redirect("/newresponse?top_id=" + encodeURIComponent(req.query.top_id) + "&replyto=" + encodeURIComponent(req.query.replyto));
            }
            else {
                res.redirect("/newresponse?top_id=" + encodeURIComponent(req.query.top_id));
            };
        };
    };
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

// redirect undefined requests
server.get("*", (req, res) => {
    res.redirect("/discussions");
});
server.post("*", (req, res) => {
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

async function isPermitted(idQuery, queryText, queryValues) {
    try {
        if(idQuery && /^[0-9]+$/.test(idQuery)) {
            const permitQuery = await pool1.query(queryText, queryValues);
            // exists, owned by user/belonging to owner
            if (permitQuery.rows.length > 0) {
                return true;
            }
            // does not exist, is not owned by user/belonging to owner
            return false;

        };
         // redirect if invalid req.query provided (deliberate malform)
        return false;
    }
    catch(e) {
        console.log(e);
        return false;
    };
};

function isPermittedTut(queryText, idParam, redirectTo) {
    return async (req, res, next) => {
        if (await isPermitted(req.query[idParam], queryText, [parseInt(req.query[idParam]), req.user.id])) {
            return next();
        };
        return res.redirect(redirectTo);
    };
};

// refactor queries so not using $2=$2?
function isPermittedStuTut(queryTextStu, queryTextTut, idParam, redirectTo) {
    return async (req, res, next) => {
        if (req.user.utype === "t") {
            if (await isPermitted(req.query[idParam], queryTextTut, [parseInt(req.query[idParam]), req.user.id])) {
                return next();
            };
            return res.redirect(redirectTo);
        }
        else if (req.user.utype === "s") {
            if (await isPermitted(req.query[idParam], queryTextStu, [parseInt(req.query[idParam]), req.user.id])) {
                return next();
            };
            return res.redirect(redirectTo);
        };
    };
};

server.listen(port);
