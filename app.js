// importing and defining dependencies
const { execPath } = require("process"),
      express = require("express"),
      bodyParser = require("body-parser"),
      path = require("path"),
      { Pool } = require("pg"),
      pool1 = new Pool((process.env.DATABASE_URL) ?
                       { connectionString: process.env.DATABASE_URL, ssl: { require: true, rejectUnauthorized: false } } :
                       { host: "localhost", port: 5432, user: "postgres", password: "postgres192", database: "discussionboard" }
                      ),
      passport = require("passport"),
      LocalStrategy = require("passport-local").Strategy,
      flash = require("express-flash"),
      session = require("cookie-session"),
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

// discussion boards
server.get("/", isLoggedIn, (req, res) => {
    res.redirect("/discussions");
});
server.get("/discussions", isLoggedIn, async (req, res) => {
    try {
        // queries and renders all discussion boards if user is tutor or
        // discussion boards owned by linked tutor(s) if user is student
        const activeDisc = await pool1.query((req.user.utype === "t" ? `SELECT dis_id, dis_owner, dis_title, archive, COUNT(DISTINCT top_id) AS top_count, COUNT(DISTINCT res_id) AS res_count FROM discussion LEFT JOIN topic ON dis_id=top_dis LEFT JOIN response ON top_id=res_top WHERE archive=false GROUP BY dis_id ORDER BY CASE WHEN dis_owner=$1 THEN 1 ELSE 2 END, dis_owner, dis_id DESC;` : `SELECT dis_id, dis_owner, dis_title, archive, COUNT(DISTINCT top_id) AS top_count, COUNT(DISTINCT res_id) AS res_count FROM discussion LEFT JOIN topic ON dis_id=top_dis LEFT JOIN response ON top_id=res_top INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND lnk_stu_id=$1 GROUP BY dis_id, id ORDER BY dis_id DESC;`), [req.user.id]);
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
        // queries and renders all archived discussion boards if user is tutor (isTutor middleware)
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
        // check that user is within 50 archived boards limit
        const archiveLimit = await pool1.query(`SELECT COUNT(dis_id) FROM discussion WHERE dis_owner=$1 AND archive=true;`, [req.user.id]);
        if (parseInt(archiveLimit.rows[0].count) < 50) {
            // archive discussion (set archive attribute to true)
            await pool1.query(`UPDATE discussion SET archive=true WHERE dis_id=$1;`, [parseInt(req.query.dis_id)]);
        }
        else {
            req.flash("archiveLimit", "Limit of archived discussion boards reached - please delete archived discussion boards to archive more");
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
        if (parseInt(activeLimit.rows[0].count) === 0) {
            // unarchive discussion (set archive attribute to false)
            await pool1.query(`UPDATE discussion SET archive=false WHERE dis_id=$1;`, [parseInt(req.query.dis_id)]);
        }
        else {
            req.flash("activeLimit", "A discussion board is already active - please archive or delete it to make another active");
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
server.post("/deletediscussion", isLoggedIn, isTutor, isPermitted(null, `SELECT dis_id, dis_owner, archive FROM discussion WHERE dis_id=$1 AND dis_owner=$2;`, "dis_id", "/discussions", 2), async (req, res) => {
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

// edit discussion
server.get("/editdiscussion", isLoggedIn, isTutor, isPermitted(null, `SELECT dis_id, dis_owner, archive FROM discussion WHERE dis_id=$1 AND dis_owner=$2;`, "dis_id", "/discussions", 2), async (req, res) => {
    try {
        const editDisc = await pool1.query(`SELECT dis_id, dis_owner, dis_title FROM discussion WHERE dis_id=$1`, [req.query.dis_id]);
        res.render("editdiscussion", { user: req.user, editDisc: editDisc.rows[0], message: req.flash("editDiscError") });
    }
    catch(e) {
        console.log(e);
        res.redirect("/discussions");
    };
});
server.post("/editdiscussion", isLoggedIn, isTutor, isPermitted(null, `SELECT dis_id, dis_owner, archive FROM discussion WHERE dis_id=$1 AND dis_owner=$2;`, "dis_id", "/discussions", 2), async (req, res) => {
    let editDiscSuccess = false;
    try {
        const newName = req.body.discussionname;
        // ensure fields filled
        if (!newName) {
            req.flash("editDiscError", "Please fill all fields");
        }
        else {
            await pool1.query(`UPDATE discussion SET dis_title=$1 WHERE dis_id=$2;`, [newName, parseInt(req.query.dis_id)]);
            editDiscSuccess = true;
        };
    }
    catch(e) {
        // exceeds VARCHAR(50)
        if (e.code === "22001") {
            req.flash("editDiscError", "Discussion board name too long - please limit to 50 characters");
        }
        else {
            console.log(e);
            req.flash("editDiscError", "Unknown error - please try again");
        };
    }
    finally {
        if (editDiscSuccess) {
            res.redirect("/discussions");
        }
        else if (!editDiscSuccess) {
            res.redirect("/editdiscussion?dis_id=" + encodeURIComponent(req.query.dis_id));
        };
    };
});

// new discussion
server.get("/newdiscussion", isLoggedIn, isTutor, (req, res) => {
    res.render("newdiscussion", { user: req.user, message: req.flash("createDiscError") });
});
server.post("/creatediscussion", isLoggedIn, isTutor, async (req, res) => {
    let createDiscSuccess = false;
    try {
        // retrieves inputted values from form, and number of active and archived discussions
        const newDiscCreds = {
            discussionname: req.body.discussionname,
            createasarchived: Boolean(req.body.createasarchived)
        },
              activeLimit = await pool1.query(`SELECT COUNT(dis_id) FROM discussion WHERE dis_owner=$1 AND archive=false;`, [req.user.id]),
              archiveLimit = await pool1.query(`SELECT COUNT(dis_id) FROM discussion WHERE dis_owner=$1 AND archive=true;`, [req.user.id]);

        // ensure fields filled (do not need to check createasarchived, as a value will always be selected)
        if (!newDiscCreds.discussionname) {
            req.flash("createDiscError", "Please fill all fields");
        }
        // ensure user has 0 active discussion boards
        else if (!newDiscCreds.createasarchived && parseInt(activeLimit.rows[0].count) > 0) {
            req.flash("createDiscError", "A discussion board is already active - please archive or delete it to create another");
        }
        // ensure user is within 50 archived boards limit
        else if (newDiscCreds.createasarchived && parseInt(archiveLimit.rows[0].count) >= 50) {
            req.flash("createDiscError", "Archived discussion limit reached - please delete archived discussion boards to create more");
        }
        else {
            await pool1.query(`INSERT INTO discussion (dis_owner, dis_title, archive) VALUES ($1, $2, $3);`, [req.user.id, newDiscCreds.discussionname, newDiscCreds.createasarchived]);
            createDiscSuccess = true;
        };
    }
    catch(e) {
        // exceeds VARCHAR(50)
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
server.get("/topics", isLoggedIn, isPermitted(`SELECT dis_id, dis_title, dis_owner FROM discussion INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND dis_id=$1 AND lnk_stu_id=$2 GROUP BY dis_id, id;`, `SELECT dis_id, dis_title, dis_owner FROM discussion WHERE archive=false AND dis_id=$1;`, "dis_id", "/discussions", 1), async (req, res) => {
    try {
        // queries and renders all topics for selected discussion board
        const discInfo = await pool1.query(`SELECT dis_id, dis_title, dis_owner FROM discussion WHERE dis_id=$1;`, [parseInt(req.query.dis_id)]),
              activeTopic = await pool1.query(`SELECT top_id, top_dis, dis_title, dis_owner, Encode(Decrypt(fname, 'discussKey192192', 'aes'), 'escape')::VARCHAR AS fname, Encode(Decrypt(lname, 'discussKey192192', 'aes'), 'escape')::VARCHAR AS lname, top_title, top_desc, top_datetime, COUNT(DISTINCT res_id) AS res_count FROM topic LEFT JOIN response ON top_id=res_top INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id WHERE top_dis=$1 GROUP BY top_id, dis_id, id ORDER BY top_id DESC;`, [parseInt(req.query.dis_id)]);
        res.render("topic", { user: req.user, activeTopic: activeTopic.rows, discInfo: discInfo.rows[0] });
    }
    catch(e) {
        console.log(e);
        res.redirect("/discussions");
    };
});

// delete topic
server.post("/deletetopic", isLoggedIn, isTutor, isPermitted(null, `SELECT dis_id, dis_owner, archive FROM topic INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND top_id=$1 AND dis_owner=$2;`, "top_id", "back", 2), async (req, res) => {
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

// edit topic
server.get("/edittopic", isLoggedIn, isTutor, isPermitted(null, `SELECT dis_id, dis_owner, archive FROM topic INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND top_id=$1 AND dis_owner=$2;`, "top_id", "back", 2), async (req, res) => {
    try {
        const editTopic = await pool1.query(`SELECT top_id, top_dis, top_title, top_desc FROM topic WHERE top_id=$1`, [req.query.top_id]);
        res.render("edittopic", { user: req.user, editTopic: editTopic.rows[0], message: req.flash("editTopicError") });
    }
    catch(e) {
        console.log(e);
        res.redirect("back");
    };
});
server.post("/edittopic", isLoggedIn, isTutor, isPermitted(null, `SELECT dis_id, dis_owner, archive FROM topic INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND top_id=$1 AND dis_owner=$2;`, "top_id", "/discussions", 2), async (req, res) => {
    let editTopicSuccess = false;
    try {
        const editTopicCreds = {
            topictitle: req.body.topictitle,
            topicdesc: (req.body.topicdesc === "" ? null : req.body.topicdesc)
        },
              editTopicExist = await pool1.query(`SELECT top_id, dis_id FROM topic INNER JOIN discussion ON top_dis=dis_id WHERE top_id=$1 AND dis_id=$2;`, [parseInt(req.query.top_id), parseInt(req.query.top_dis)]);

        // ensure fields filled (topic desc. is not mandatory)
        if (!editTopicCreds.topictitle) {
            req.flash("editTopicError", "Please fill topic title fields");
        }
        // ensure topic is within the correct discussion
        else if (editTopicExist.rows.length === 0) {
            req.flash("editTopicError", "Editing topic not in the same discussion - please try again");
        }
        else {
            await pool1.query(`UPDATE topic SET top_title=$1, top_desc=$2 WHERE top_id=$3;`, [editTopicCreds.topictitle, editTopicCreds.topicdesc, parseInt(req.query.top_id)]);
            editTopicSuccess = true;
        };
    }
    catch(e) {
        // exceeds VARCHAR(100)/VARCHAR(200)
        if (e.code === "22001") {
            req.flash("editTopicError", "Topic title/description too long - please limit to 100/200 characters respectively");
        }
        else {
            console.log(e);
            req.flash("editTopicError", "Unknown error - please try again");
        };
    }
    finally {
        if (editTopicSuccess) {
            res.redirect("/topics?dis_id=" + encodeURIComponent(req.query.top_dis));
        }
        else if (!editTopicSuccess) {
            res.redirect("/edittopic?top_id=" + encodeURIComponent(req.query.top_id) + "&top_dis=" + encodeURIComponent(req.query.top_dis));
        };
    };
});

// new topic
server.get("/newtopic", isLoggedIn, isTutor, isPermitted(null, `SELECT dis_id, dis_owner, archive FROM discussion WHERE archive=false AND dis_id=$1 AND dis_owner=$2;`, "dis_id", "back", 2), (req, res) => {
    res.render("newtopic", { user: req.user, dis_id: parseInt(req.query.dis_id), message: req.flash("createTopicError") });
});
server.post("/createtopic", isLoggedIn, isTutor, isPermitted(null, `SELECT dis_id, dis_owner, archive FROM discussion WHERE archive=false AND dis_id=$1 AND dis_owner=$2;`, "dis_id", "back", 2), async (req, res) => {
    let createTopicSuccess = false;
    try {
        // retrieves inputted values from form, and number of topics
        const newTopicCreds = {
            topictitle: req.body.topictitle,
            topicdesc: (req.body.topicdesc === "" ? null : req.body.topicdesc)
        },
              topicLimit = await pool1.query(`SELECT COUNT(top_id) FROM topic WHERE top_dis=$1;`, [req.query.dis_id]);

        // ensure fields filled (topic desc. is not mandatory)
        if (!newTopicCreds.topictitle) {
            req.flash("createTopicError", "Please fill topic title field");
        }
        // ensure discussion board is within 50 topics limit
        else if (parseInt(topicLimit.rows[0].count) >= 50) {
            req.flash("createTopicError", "Topic limit reached - please delete topics to create more");
        }
        else {
            // top_datetime default is Now()
            await pool1.query(`INSERT INTO topic (top_dis, top_title, top_desc) VALUES ($1, $2, $3)`, [parseInt(req.query.dis_id), newTopicCreds.topictitle, newTopicCreds.topicdesc]);
            createTopicSuccess = true;
        };
    }
    catch(e) {
        // exceeds VARCHAR(100)/VARCHAR(200)
        if (e.code === "22001") {
            req.flash("createTopicError", "Topic title/description too long - please limit to 100/200 characters respectively");
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
server.get("/responses", isLoggedIn, isPermitted(`SELECT top_id, top_dis, dis_owner, top_title, top_desc, top_datetime FROM topic INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND top_id=$1 AND lnk_stu_id=$2;`, `SELECT top_id, top_dis, dis_owner, top_title, top_desc, top_datetime FROM topic INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND top_id=$1;`, "top_id", "back", 1), async (req, res) => {
    try {
        // queries and renders topic info, all responses, and likes for selected topic
        const topInfo = await pool1.query(`SELECT top_id, top_title, dis_owner FROM topic INNER JOIN discussion ON top_dis=dis_id WHERE top_id=$1;`, [req.query.top_id]),
              activeRes = await pool1.query(`SELECT res_id, res_user, Encode(Decrypt(fname, 'discussKey192192', 'aes'), 'escape')::VARCHAR AS fname, Encode(Decrypt(lname, 'discussKey192192', 'aes'), 'escape')::VARCHAR AS lname, res_top, top_title, top_desc, res_title, res_text, res_datetime, replyto, pinned, COUNT(lke_res) AS likes FROM response INNER JOIN uni_user ON res_user=id INNER JOIN topic ON res_top=top_id LEFT JOIN liked ON res_id=lke_res WHERE res_top=$1 GROUP BY res_id, id, top_id ORDER BY pinned DESC, res_datetime ASC;`, [parseInt(req.query.top_id)]),
              activeLike = await pool1.query(`SELECT lke_user, lke_res FROM liked;`);
        res.render("response", { user: req.user, activeRes: activeRes.rows, activeLike: activeLike.rows, topInfo: topInfo.rows[0], message: req.flash("viewResponseError") });
    }
    catch(e) {
        console.log(e);
        res.redirect("/discussions");
    };
});

// like/unlike response
server.post("/likeresponse", isLoggedIn, isPermitted(`SELECT res_id, res_user, top_id, dis_id, dis_owner FROM response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND res_id=$1 AND lnk_stu_id=$2;`, `SELECT res_id from response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND res_id=$1;`, "res_id", "back", 1), async (req, res) => {
    try {
        // check if user has liked response
        const isLiked = await pool1.query(`SELECT lke_user, lke_res FROM liked WHERE lke_user=$1 AND lke_res=$2;`, [req.user.id, parseInt(req.query.res_id)]);
        // like response if user has not liked
        if (isLiked.rows.length === 0) {
            await pool1.query(`INSERT INTO liked (lke_user, lke_res) VALUES ($1, $2);`, [req.user.id, parseInt(req.query.res_id)]);
        }
        // unlike response if user has already liked
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
server.post("/pinresponse", isLoggedIn, isTutor, isPermitted(null, `SELECT res_id, res_top, dis_id, dis_owner, archive FROM response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND res_id=$1 AND dis_owner=$2;`, "res_id", "back", 2), async (req, res) => {
    // creates a client (as transactions are needed)
    const client = await pool1.connect();
    try {
        // check if given response is pinned and if another response in its topic is pinned
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
server.post("/deleteresponse", isLoggedIn, isPermitted(`SELECT res_id, res_user, top_id, dis_id, dis_owner FROM response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND res_id=$1 AND lnk_stu_id=$2 AND res_user=$2;`, `SELECT res_id, res_user, top_id, dis_id, dis_owner FROM response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND res_id=$1 AND dis_owner=$2;`, "res_id", "back", 2), async (req, res) => {
    try {
        const resDatetime = await pool1.query(`SELECT res_id, res_user, res_datetime FROM response WHERE res_id=$1;`, [parseInt(req.query.res_id)]);
        // tutors can delete responses (in their topics) with no time limit
        if (req.user.utype === "t") {
            await pool1.query(`DELETE FROM response WHERE res_id=$1;`, [parseInt(req.query.res_id)]);
        }
        else if (req.user.utype === "s") {
            // checks if >10mins (600000ms) have passed since response created
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
server.get("/newreply", isLoggedIn, isPermitted(`SELECT res_id, res_user, top_id, dis_id, dis_owner FROM response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND res_id=$1 AND lnk_stu_id=$2;`, `SELECT res_id from response INNER JOIN topic ON res_top=top_id INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND res_id=$1;`, "replyto", "back", 1), (req, res) => {
    res.redirect("/newresponse?top_id=" + encodeURIComponent(req.query.top_id) + "&replyto=" + encodeURIComponent(req.query.replyto));
});
server.get("/newresponse", isLoggedIn, isPermitted(`SELECT top_id FROM topic INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND top_id=$1 AND lnk_stu_id=$2;`, `SELECT top_id from topic INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND top_id=$1;`, "top_id", "back", 1), async (req, res) => {
    try {
        const topInfo = await pool1.query(`SELECT top_id, top_dis, top_title, top_desc, top_datetime FROM topic WHERE top_id=$1;`, [req.query.top_id]);
        res.render("newresponse", { user: req.user, topInfo: topInfo.rows[0], replyto: (req.query.replyto ? parseInt(req.query.replyto) : null), message: req.flash("createResponseError") });
    }
    catch(e) {
        console.log(e);
        res.redirect("back");
    };
});
server.post("/createresponse", isLoggedIn, isPermitted(`SELECT top_id FROM topic INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE archive=false AND top_id=$1 AND lnk_stu_id=$2;`, `SELECT top_id from topic INNER JOIN discussion ON top_dis=dis_id WHERE archive=false AND top_id=$1;`, "top_id", "back", 1), async (req, res) => {
    let createResponseSuccess = false;
    try {
        // retrieves inputted values from form
        const newResponseCreds = {
            res_title: req.body.res_title,
            res_text: req.body.res_text
        };
        // ensure title and text fields are filled
        if (!newResponseCreds.res_title || !newResponseCreds.res_text) {
            req.flash("createResponseError", "Please fill all fields");
        }
        else {
            // insert reponse with/without replyto attribute depending on if reply selected
            await pool1.query(`INSERT INTO response (res_user, res_top, res_title, res_text, replyto) VALUES ($1, $2, $3, $4, $5)`,
                              [req.user.id, parseInt(req.query.top_id), newResponseCreds.res_title, newResponseCreds.res_text, (req.query.replyto ? parseInt(req.query.replyto) : null)]);
            createResponseSuccess = true;
        };
    }
    catch(e) {
        // exceeds VARCHAR(100)/VARCHAR(2000)
        if (e.code === "22001") {
            req.flash("createResponseError", "Response title/text too long - please limit to 100/2000 characters respectively");
        }
        // raises trigger trig_replyto_valid
        else if (e.code === "P0001") {
            req.flash("createResponseError", "Replying to response not in topic - please try again");
        }
        else {
            console.log(e);
            req.flash("createResponseError", "Unknown error - please try again");
        };
    }
    finally {
        // redirect to responses page if success
        if (createResponseSuccess) {
            res.redirect("/responses?top_id=" + encodeURIComponent(req.query.top_id));
        }
        else if (!createResponseSuccess) {
            // redirect with replyto param if replying to repsonse
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
        // retrieves inputted values from form, and queries existing registration
        const regCreds = {
            id: req.body.id,
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            pw: req.body.pw,
            confpw: req.body.confpw,
            utype: (Boolean(req.body.utype) ? "s" : "t")
        },
              regExists = await pool1.query(`SELECT id, email, pw FROM uni_user WHERE id=$1 OR email=Encrypt($2, 'discussKey192192', 'aes');`, [regCreds.id, regCreds.email]);

        // ensure fields filled (do not need to check utype, as a value will always be selected)
        if (!regCreds.id || !regCreds.fname || !regCreds.lname || !regCreds.email || !regCreds.pw || !regCreds.confpw) {
            req.flash("registerError", "Please fill all fields");
        }
        // ensure entered passwords match
        else if (regCreds.pw !== regCreds.confpw) {
            req.flash("registerError", "Passwords do not match");
        }
        // ensure no existing account
        else if (regExists.rows.length > 0) {
            req.flash("registerError", "ID/email already registered");
        }
        else {
            await pool1.query(`INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ($1, Crypt($2, gen_salt('md5')), Encrypt($3, 'discussKey192192', 'aes'), Encrypt($4, 'discussKey192192', 'aes'), Encrypt($5, 'discussKey192192', 'aes'), Encrypt($6, 'discussKey192192', 'aes'));`,
                              [regCreds.id, regCreds.pw, regCreds.fname, regCreds.lname, regCreds.email, regCreds.utype]);
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
                // query username and password
                const pwCheck = await pool1.query(`SELECT id, pw FROM uni_user WHERE id=$1 AND pw=Crypt($2, pw);`, [id, pw]);
                // correct username and password
                if (pwCheck.rows.length === 1) {
                    return done(null, pwCheck.rows[0]);
                }
                // incorrect password
                else {
                    return done(null, false, { message: "Incorrect username/password" });
                };
            }
            // no user with that ID
            else {
                return done(null, false, { message: "Incorrect username/password" }); 
            };
        }
        catch(e) {
            console.log(e);
            return done(e, false, { message: "Unknown error - please try again" });
        };
    }));
    // serialize user on login
    passport.serializeUser((user, done) => done(null, user.id));
    // deserialize user on logout
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

function isPermitted(queryTextStu, queryTextTut, idParam, redirectTo, tutValues) {
    return async (req, res, next) => {
        try {
            if(req.query[idParam] && /^[0-9]+$/.test(req.query[idParam])) {
                // uses tutor or student queries depending on parameters (all student queries have 2 values)
                const permitQuery = await pool1.query((queryTextStu === null || (queryTextStu !== null && req.user.utype === "t")) ? queryTextTut : queryTextStu,
                                                      (tutValues === 1 && (queryTextStu === null || (queryTextStu !== null && req.user.utype === "t"))) ? [parseInt(req.query[idParam])] : [parseInt(req.query[idParam]), req.user.id]);
                // exists and is owned by user/belonging to tutor owner
                if (permitQuery.rows.length > 0) {
                    return next();
                }
                // does not exist or is not owned by user/belonging to tutor owner
                return res.redirect(redirectTo);
            };
            // redirect if invalid req.query provided (deliberate malform)
            return res.redirect(redirectTo);
        }
        catch(e) {
            console.log(e);
            return res.redirect(redirectTo);
        };
    };
};

// export for unit testing
module.exports = server;

server.listen(process.env.PORT || 3000);
