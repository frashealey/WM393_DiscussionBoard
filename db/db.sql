-- this file is used to setup and document development of the PostgreSQL database
-- developed by 1928864

-- creates discusison database, ensures it has been created, and connects to it
CREATE DATABASE discussionboard;
\l
\c discussionboard

-- creates pgcrypto extension, used for encrypting/decrypting sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- uni_user
CREATE TABLE uni_user (
    id CHAR(8) PRIMARY KEY CHECK (id ~ '^u[0-9]{7}$'),
    pw TEXT NOT NULL,
    fname BYTEA NOT NULL,
    lname BYTEA NOT NULL,
    email BYTEA NOT NULL CHECK (Encode(Decrypt(email, 'discussKey192192', 'aes'), 'escape')::VARCHAR ~ '^[A-Za-z0-9\._-]+\@warwick\.ac\.uk$'),
    utype BYTEA NOT NULL CHECK (Encode(Decrypt(utype, 'discussKey192192', 'aes'), 'escape')::CHAR(1) IN ('s', 't'))
);

-- link_user
CREATE TABLE link_user (
    lnk_tut_id CHAR(8) REFERENCES uni_user(id),
    lnk_stu_id CHAR(8) REFERENCES uni_user(id),
    CONSTRAINT not_equal CHECK (lnk_tut_id != lnk_stu_id),
    PRIMARY KEY (lnk_tut_id, lnk_stu_id)
);
-- trigger to stop incorrect user types
CREATE OR REPLACE FUNCTION func_link_user_type() RETURNS trigger AS
$$
    DECLARE
        tutor_type CHAR(1);
        student_type CHAR(1);
    BEGIN
        tutor_type = (SELECT Encode(Decrypt(utype, 'discussKey192192', 'aes'), 'escape')::CHAR(1) as utype FROM uni_user WHERE id=NEW.lnk_tut_id);
        student_type = (SELECT Encode(Decrypt(utype, 'discussKey192192', 'aes'), 'escape')::CHAR(1) as utype FROM uni_user WHERE id=NEW.lnk_stu_id);

        IF (tutor_type != 't')
            THEN RAISE EXCEPTION 'Tutor user must be type tutor';
        ELSIF (student_type != 's')
            THEN RAISE EXCEPTION 'Student user must be type student';
        END IF;

        RETURN NEW;
    END;
$$ LANGUAGE 'plpgsql';
CREATE TRIGGER trig_link_user_type AFTER INSERT OR UPDATE OR DELETE ON link_user FOR EACH ROW EXECUTE PROCEDURE func_link_user_type();

-- discussion
-- (enforcement of 1 non-archived board per tutor to be outlined in js)
CREATE TABLE discussion (
    dis_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    dis_owner CHAR(8) NOT NULL REFERENCES uni_user(id),
    dis_title VARCHAR(50) NOT NULL,
    archive BOOLEAN NOT NULL DEFAULT false
);
-- trigger to ensure only tutors own discussion boards
CREATE OR REPLACE FUNCTION func_discussion_user_type() RETURNS trigger AS
$$
    DECLARE
        user_type CHAR(1);
    BEGIN
        user_type = (SELECT Encode(Decrypt(utype, 'discussKey192192', 'aes'), 'escape')::CHAR(1) as utype FROM uni_user WHERE id=NEW.dis_owner);

        IF (user_type != 't')
            THEN RAISE EXCEPTION 'User must be tutor to own discussion board';
        END IF;

        RETURN NEW;
    END;
$$ LANGUAGE 'plpgsql';
CREATE TRIGGER trig_discussion_user_type AFTER INSERT OR UPDATE OR DELETE ON discussion FOR EACH ROW EXECUTE PROCEDURE func_discussion_user_type();

-- topic
CREATE TABLE topic (
    top_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    top_dis INTEGER NOT NULL REFERENCES discussion(dis_id) ON DELETE CASCADE,
    top_title VARCHAR(100) NOT NULL,
    top_desc VARCHAR(200),
    top_datetime TIMESTAMP NOT NULL DEFAULT Now()
);

-- response
CREATE TABLE response (
    res_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    res_user CHAR(8) NOT NULL REFERENCES uni_user(id),
    res_top INTEGER NOT NULL REFERENCES topic(top_id) ON DELETE CASCADE,
    res_title VARCHAR(100) NOT NULL,
    res_text VARCHAR(2000) NOT NULL,
    res_datetime TIMESTAMP NOT NULL DEFAULT Now(),
    replyto INTEGER REFERENCES response(res_id) ON DELETE SET NULL,
    pinned BOOLEAN NOT NULL DEFAULT false
);
-- trigger to prevent students inserting response for a topic from a tutor not linked to them
CREATE OR REPLACE FUNCTION func_res_perm() RETURNS trigger AS
$$
    DECLARE
        topic_count INTEGER;
        user_type CHAR(1);
    BEGIN
        topic_count = (SELECT COUNT(top_id) FROM topic INNER JOIN discussion ON top_dis=dis_id INNER JOIN uni_user ON dis_owner=id INNER JOIN link_user ON id=lnk_tut_id WHERE lnk_stu_id=NEW.res_user AND top_id=NEW.res_top);
        user_type = (SELECT Encode(Decrypt(utype, 'discussKey192192', 'aes'), 'escape')::CHAR(1) as utype FROM uni_user WHERE id=NEW.res_user);

        IF (user_type = 't')
            THEN RETURN NEW;
        ELSIF (topic_count = 0)
            THEN RAISE EXCEPTION 'Student cannot insert into topic from tutor they do not belong to';
        ELSE
            RETURN NEW;
        END IF;
    END;
$$ LANGUAGE 'plpgsql';
CREATE TRIGGER trig_res_perm AFTER INSERT OR UPDATE ON response FOR EACH ROW EXECUTE PROCEDURE func_res_perm();
-- trigger to prevent replying to a response not in the same topic
CREATE OR REPLACE FUNCTION func_replyto_valid() RETURNS trigger AS
$$
    DECLARE
        replyto_topic INTEGER;
    BEGIN
        replyto_topic = (SELECT res_top FROM response WHERE res_id=NEW.replyto);

        IF (replyto_topic != NEW.res_top)
            THEN RAISE EXCEPTION 'Replying to post not in topic';
        ELSE
            RETURN NEW;
        END IF;
    END;
$$ LANGUAGE 'plpgsql';
CREATE TRIGGER trig_replyto_valid AFTER INSERT OR UPDATE ON response FOR EACH ROW EXECUTE PROCEDURE func_replyto_valid();

-- liked
CREATE TABLE liked (
    lke_user CHAR(8) NOT NULL REFERENCES uni_user(id),
    lke_res INTEGER NOT NULL REFERENCES response(res_id) ON DELETE CASCADE,
    PRIMARY KEY (lke_user, lke_res)
);

-- db_audit
-- PRIMARY KEY (aud_time, aud_user, aud_table) is not possible due to multiple inserts
-- PRIMARY KEY (aud_time, aud_user, aud_table, new_data) is not possible as delete operations would have null new_data
-- PRIMARY KEY (aud_time, aud_user, aud_table, old_data) is not possible for the same reasoning for inserts and old_data
CREATE TABLE db_audit (
    aud_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    aud_time TIMESTAMP NOT NULL DEFAULT Now(),
    aud_user BYTEA NOT NULL,
    aud_table BYTEA NOT NULL,
    aud_action VARCHAR(8) NOT NULL CHECK (aud_action IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')),
    old_data VARCHAR,
    new_data VARCHAR
);
-- auditing trigger
CREATE OR REPLACE FUNCTION func_db_auditor() RETURNS trigger AS
$$
BEGIN
INSERT INTO db_audit (aud_time, aud_user, aud_table, aud_action, old_data, new_data)
VALUES
    (Now(), Encrypt(current_user::BYTEA, 'discussKey192192', 'aes'), Encrypt(TG_TABLE_NAME::BYTEA, 'discussKey192192', 'aes'), TG_OP, OLD::VARCHAR, NEW::VARCHAR);
RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';
-- uni_user
CREATE TRIGGER trig_db_auditor AFTER INSERT OR UPDATE OR DELETE ON uni_user FOR EACH ROW EXECUTE PROCEDURE func_db_auditor();
CREATE TRIGGER trig_db_auditor_trunc AFTER TRUNCATE ON uni_user EXECUTE PROCEDURE func_db_auditor();
-- link_user
CREATE TRIGGER trig_db_auditor AFTER INSERT OR UPDATE OR DELETE ON link_user FOR EACH ROW EXECUTE PROCEDURE func_db_auditor();
CREATE TRIGGER trig_db_auditor_trunc AFTER TRUNCATE ON link_user EXECUTE PROCEDURE func_db_auditor();
-- discussion
CREATE TRIGGER trig_db_auditor AFTER INSERT OR UPDATE OR DELETE ON discussion FOR EACH ROW EXECUTE PROCEDURE func_db_auditor();
CREATE TRIGGER trig_db_auditor_trunc AFTER TRUNCATE ON discussion EXECUTE PROCEDURE func_db_auditor();
-- topic
CREATE TRIGGER trig_db_auditor AFTER INSERT OR UPDATE OR DELETE ON topic FOR EACH ROW EXECUTE PROCEDURE func_db_auditor();
CREATE TRIGGER trig_db_auditor_trunc AFTER TRUNCATE ON topic EXECUTE PROCEDURE func_db_auditor();
-- response
CREATE TRIGGER trig_db_auditor AFTER INSERT OR UPDATE OR DELETE ON response FOR EACH ROW EXECUTE PROCEDURE func_db_auditor();
CREATE TRIGGER trig_db_auditor_trunc AFTER TRUNCATE ON response EXECUTE PROCEDURE func_db_auditor();
-- liked
CREATE TRIGGER trig_db_auditor AFTER INSERT OR UPDATE OR DELETE ON liked FOR EACH ROW EXECUTE PROCEDURE func_db_auditor();
CREATE TRIGGER trig_db_auditor_trunc AFTER TRUNCATE ON liked EXECUTE PROCEDURE func_db_auditor();

-- -- creating roles is not possible in heroku, so all database CRUD done from single user
-- -- creating regular (university, non-admin) role
-- CREATE ROLE reguser;
-- -- permissions
-- GRANT SELECT ON uni_user, discussion, topic, response, liked TO reguser;
-- GRANT INSERT ON uni_user, discussion, topic, response, liked TO reguser;
-- GRANT UPDATE(pw, fname, lname, email, utype) ON uni_user TO reguser;
-- GRANT UPDATE(dis_title, archived) ON discussion TO reguser;
-- GRANT UPDATE(top_title, top_desc) ON topic TO reguser;
-- GRANT UPDATE(res_title, res_text, pinned) ON response TO reguser;
-- GRANT DELETE ON discussion, topic, response TO reguser;
-- GRANT DELETE ON liked TO reguser;
-- GRANT INSERT ON db_audit TO reguser;
-- GRANT EXECUTE ON FUNCTION func_db_auditor TO reguser;
-- -- prevents creating relations
-- REVOKE CREATE ON SCHEMA public FROM PUBLIC;
-- -- pools
-- CREATE ROLE pool1 LOGIN PASSWORD 'pool1pass';
-- GRANT reguser TO pool1;
