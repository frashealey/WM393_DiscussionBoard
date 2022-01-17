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
    email BYTEA NOT NULL CHECK (pgp_sym_decrypt(email, 'discussKey192192', 'cipher-algo=aes128') ~ '^[A-Za-z0-9\._-]+\@warwick\.ac\.uk$'),
    utype BYTEA NOT NULL CHECK (pgp_sym_decrypt(utype, 'discussKey192192', 'cipher-algo=aes128') IN ('s', 't'))
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
        tutor_type = (SELECT pgp_sym_decrypt(utype, 'discussKey192192', 'cipher-algo=aes128') as utype FROM uni_user WHERE id=NEW.lnk_tut_id);
        student_type = (SELECT pgp_sym_decrypt(utype, 'discussKey192192', 'cipher-algo=aes128') as utype FROM uni_user WHERE id=NEW.lnk_stu_id);

        IF (tutor_type != 't')
            THEN RAISE EXCEPTION 'Tutor user must be type tutor';
        ELSEIF (student_type != 's')
            THEN RAISE EXCEPTION 'Student user must be type student';
        END IF;

        RETURN NEW;
    END;
$$ LANGUAGE 'plpgsql';
CREATE OR REPLACE TRIGGER trig_link_user_type AFTER INSERT OR UPDATE OR DELETE ON link_user FOR EACH ROW EXECUTE PROCEDURE func_link_user_type();

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
        user_type = (SELECT pgp_sym_decrypt(utype, 'discussKey192192', 'cipher-algo=aes128') as utype FROM uni_user WHERE id=NEW.dis_owner);

        IF (user_type != 't')
            THEN RAISE EXCEPTION 'User must be tutor to own discussion board';
        END IF;

        RETURN NEW;
    END;
$$ LANGUAGE 'plpgsql';
CREATE OR REPLACE TRIGGER trig_discussion_user_type AFTER INSERT OR UPDATE OR DELETE ON discussion FOR EACH ROW EXECUTE PROCEDURE func_discussion_user_type();

-- topic
CREATE TABLE topic (
    top_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    top_dis INTEGER NOT NULL REFERENCES discussion(dis_id),
    top_title VARCHAR(100) NOT NULL,
    top_desc VARCHAR(200) NOT NULL,
    top_datetime TIMESTAMP NOT NULL DEFAULT Now()
);

-- response
CREATE TABLE response (
    res_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    res_user CHAR(8) NOT NULL REFERENCES uni_user(id),
    res_top INTEGER NOT NULL REFERENCES topic(top_id),
    res_title VARCHAR(100) NOT NULL,
    res_text VARCHAR(3000) NOT NULL,
    res_datetime TIMESTAMP NOT NULL DEFAULT Now(),
    replyto INTEGER REFERENCES response(res_id),
    pinned BOOLEAN NOT NULL DEFAULT false
);

-- liked
CREATE TABLE liked (
    lke_user CHAR(8) NOT NULL REFERENCES uni_user(id),
    lke_res INTEGER NOT NULL REFERENCES response(res_id),
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
    (Now(), pgp_sym_encrypt(current_user, 'discussKey192192', 'cipher-algo=aes128'), pgp_sym_encrypt(TG_TABLE_NAME, 'discussKey192192', 'cipher-algo=aes128'), TG_OP, OLD::VARCHAR, NEW::VARCHAR);
RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';
-- uni_user
CREATE OR REPLACE TRIGGER trig_db_auditor AFTER INSERT OR UPDATE OR DELETE ON uni_user FOR EACH ROW EXECUTE PROCEDURE func_db_auditor();
CREATE OR REPLACE TRIGGER trig_db_auditor_trunc AFTER TRUNCATE ON uni_user EXECUTE PROCEDURE func_db_auditor();
-- link_user
CREATE OR REPLACE TRIGGER trig_db_auditor AFTER INSERT OR UPDATE OR DELETE ON link_user FOR EACH ROW EXECUTE PROCEDURE func_db_auditor();
CREATE OR REPLACE TRIGGER trig_db_auditor_trunc AFTER TRUNCATE ON link_user EXECUTE PROCEDURE func_db_auditor();
-- discussion
CREATE OR REPLACE TRIGGER trig_db_auditor AFTER INSERT OR UPDATE OR DELETE ON discussion FOR EACH ROW EXECUTE PROCEDURE func_db_auditor();
CREATE OR REPLACE TRIGGER trig_db_auditor_trunc AFTER TRUNCATE ON discussion EXECUTE PROCEDURE func_db_auditor();
-- topic
CREATE OR REPLACE TRIGGER trig_db_auditor AFTER INSERT OR UPDATE OR DELETE ON topic FOR EACH ROW EXECUTE PROCEDURE func_db_auditor();
CREATE OR REPLACE TRIGGER trig_db_auditor_trunc AFTER TRUNCATE ON topic EXECUTE PROCEDURE func_db_auditor();
-- response
CREATE OR REPLACE TRIGGER trig_db_auditor AFTER INSERT OR UPDATE OR DELETE ON response FOR EACH ROW EXECUTE PROCEDURE func_db_auditor();
CREATE OR REPLACE TRIGGER trig_db_auditor_trunc AFTER TRUNCATE ON response EXECUTE PROCEDURE func_db_auditor();
-- liked
CREATE OR REPLACE TRIGGER trig_db_auditor AFTER INSERT OR UPDATE OR DELETE ON liked FOR EACH ROW EXECUTE PROCEDURE func_db_auditor();
CREATE OR REPLACE TRIGGER trig_db_auditor_trunc AFTER TRUNCATE ON liked EXECUTE PROCEDURE func_db_auditor();

-- creating regular (university, non-admin) role
CREATE ROLE reguser;
-- permissions
GRANT SELECT, INSERT, UPDATE(pw, fname, lname, email, utype) ON uni_user TO reguser;
GRANT SELECT, INSERT, UPDATE(dis_title, archived), DELETE ON discussion TO reguser;
GRANT SELECT, INSERT, UPDATE(top_title, top_desc), DELETE ON topic TO reguser;
GRANT SELECT, INSERT, UPDATE(res_title, res_text, pinned) ON response TO reguser;
GRANT SELECT, INSERT, DELETE ON liked TO reguser;
GRANT INSERT ON db_audit TO reguser;
GRANT EXECUTE ON FUNCTION func_db_auditor TO reguser;
-- prevents creating relations
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
-- pools
CREATE ROLE pool1 LOGIN PASSWORD 'pool1pass';
GRANT reguser TO pool1;
