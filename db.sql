-- this file is used to document development of the PostgreSQL database
-- developed by 1928864

-- creates discusison database, ensures it has been created, and connects to it
CREATE DATABASE discussion;
\l
\c discussion

-- creates pgcrypto extension, used for encrypting/decrypting sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- uni_user
CREATE TABLE uni_user (
    id CHAR(8) PRIMARY KEY CHECK (id ~ '^u[0-9]{7}$'),
    pw TEXT NOT NULL,
    fname BYTEA NOT NULL,
    lname BYTEA NOT NULL,
    email BYTEA NOT NULL CHECK (Encode(Decrypt(email, 'discKey192', 'bf'), 'escape')::VARCHAR ~ '^[A-Za-z0-9\._-]+\@warwick\.ac\.uk$'),
    utype BYTEA NOT NULL CHECK (Encode(Decrypt(utype, 'discKey192', 'bf'), 'escape')::CHAR(1) IN ('s', 't'))
);
-- inserting example users into uni_user
INSERT INTO uni_user (id, pw, fname, lname, email, utype)
VALUES
    ('u2139948', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('John', 'discKey192', 'bf'), Encrypt('Smith', 'discKey192', 'bf'), Encrypt('john.smith@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
INSERT INTO uni_user (id, pw, fname, lname, email, utype)
VALUES
    ('u1827746', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('Jerry', 'discKey192', 'bf'), Encrypt('Seinfeld', 'discKey192', 'bf'), Encrypt('jerry.seinfeld@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('s', 'discKey192', 'bf'));

-- link_user
CREATE TABLE link_user (
    lnk_tut_id CHAR(8) REFERENCES uni_user(id),
    lnk_stu_id CHAR(8) REFERENCES uni_user(id),
    CONSTRAINT not_equal CHECK (lnk_tut_id != lnk_stu_id),
    PRIMARY KEY (lnk_tut_id, lnk_stu_id)
);
-- trigger to disallow incorrect user types
CREATE OR REPLACE FUNCTION func_link_type_check() RETURNS trigger AS
$$
    DECLARE
        tutor_type CHAR(1);
        student_type CHAR(1);
    BEGIN
        tutor_type = (SELECT Encode(Decrypt(utype, 'discKey192', 'bf'), 'escape')::CHAR(1) as utype FROM uni_user WHERE id=NEW.lnk_tut_id);
        student_type = (SELECT Encode(Decrypt(utype, 'discKey192', 'bf'), 'escape')::CHAR(1) as utype FROM uni_user WHERE id=NEW.lnk_stu_id);

        IF (tutor_type != 't')
            THEN RAISE EXCEPTION 'Tutor user must be type tutor';
        ELSEIF (student_type != 's')
            THEN RAISE EXCEPTION 'Student user must be type student';
        END IF;

        RETURN NEW;
    END;
$$ LANGUAGE 'plpgsql';
CREATE TRIGGER trig_link_type_check AFTER INSERT OR UPDATE OR DELETE ON link_user FOR EACH ROW EXECUTE PROCEDURE func_link_type_check();
-- inserting example entries into link user
INSERT INTO link_user (lnk_tut_id, lnk_stu_id)
VALUES
    ('u2139948', 'u1827746');

-- discussion board
-- (function to enforce 1 non-archived board to be outlined in js)
CREATE TABLE discussion (
    dis_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    dis_owner CHAR(8) REFERENCES uni_user(id),
    dis_title VARCHAR(50) NOT NULL,
    archived BOOLEAN NOT NULL DEFAULT false
);
-- trigger to ensure only tutors own discussion boards
CREATE OR REPLACE FUNCTION func_discussion_type_check() RETURNS trigger AS
$$
    DECLARE
        user_type CHAR(1);
    BEGIN
        user_type = (SELECT Encode(Decrypt(utype, 'discKey192', 'bf'), 'escape')::CHAR(1) as utype FROM uni_user WHERE id=NEW.dis_owner);

        IF (user_type != 't')
            THEN RAISE EXCEPTION 'User must be tutor to own discussion board';
        END IF;

        RETURN NEW;
    END;
$$ LANGUAGE 'plpgsql';
CREATE TRIGGER trig_discussion_type_check AFTER INSERT OR UPDATE OR DELETE ON discussion FOR EACH ROW EXECUTE PROCEDURE func_discussion_type_check();

INSERT INTO discussion (dis_owner, dis_title, archived)
VALUES
    ('u2139948', 'Example discussion board', false);
INSERT INTO discussion (dis_owner, dis_title, archived)
VALUES
    ('u1827746', 'Example discussion board', false);
