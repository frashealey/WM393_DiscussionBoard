-- this file is used to document development of the PostgreSQL database
-- developed by 1928864

-- creates discusison database, ensures it has been created, and connecting to it
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
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u2139948', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('John', 'discKey192', 'bf'), Encrypt('Smith', 'discKey192', 'bf'), Encrypt('john.smith@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u1827746', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('Jerry', 'discKey192', 'bf'), Encrypt('Seinfeld', 'discKey192', 'bf'), Encrypt('jerry.seinfeld@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('s', 'discKey192', 'bf'));

-- link_user
CREATE TABLE link_user (
    lnk_tut_id CHAR(8) REFERENCES uni_user(id),
    lnk_stu_id CHAR(8) REFERENCES uni_user(id),
    CONSTRAINT not_equal CHECK (lnk_tut_id != lnk_stu_id),
    PRIMARY KEY (lnk_tut_id, lnk_stu_id)
);

-- trigger to check user role
CREATE OR REPLACE FUNCTION func_link_role_check() RETURNS trigger AS
$$
DECLARE
tutor_type CHAR(1);
student_type CHAR(1);
BEGIN
-- IF ((SELECT Encode(Decrypt(utype, 'discKey192', 'bf'), 'escape')::CHAR(1) as utype FROM uni_user WHERE id=lnk_tut_id)!='t')
-- THEN RAISE EXCEPTION 'Tutor user must be type tutor';
-- ELSEIF ((SELECT Encode(Decrypt(utype, 'discKey192', 'bf'), 'escape')::CHAR(1) as utype FROM uni_user WHERE id=lnk_stu_id)!='s'))
-- THEN RAISE EXCEPTION 'Student user must be type student';

-- tutor_type = (SELECT Encode(Decrypt(utype, 'discKey192', 'bf'), 'escape')::CHAR(1) as utype FROM uni_user INNER JOIN link_user ON uni_user.id=link_user.lnk_tut_id WHERE uni_user.id=NEW.lnk_tut_id);
tutor_type = (SELECT Encode(Decrypt(utype, 'discKey192', 'bf'), 'escape')::CHAR(1) as utype FROM uni_user WHERE id=NEW.lnk_tut_id);

RAISE NOTICE '%', tutor_type; 

RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';
CREATE TRIGGER trig_link_role_check AFTER INSERT OR UPDATE OR DELETE ON link_user FOR EACH ROW EXECUTE PROCEDURE func_link_role_check();

INSERT INTO link_user (lnk_tut_id, lnk_stu_id) VALUES ('u2139948', 'u1827746');

TRUNCATE TABLE link_user;
DROP TRIGGER trig_link_role_check ON link_user; DROP FUNCTION func_link_role_check;

-- -- these need to be in a function
-- CONSTRAINT role_check_tutor CHECK ((SELECT Encode(Decrypt(utype, 'discKey192', 'bf'), 'escape')::CHAR(1) as utype FROM uni_user WHERE id=lnk_tut_id)=='t'),
-- CONSTRAINT role_check_student CHECK ((SELECT Encode(Decrypt(utype, 'discKey192', 'bf'), 'escape')::CHAR(1) as utype FROM uni_user WHERE id=lnk_stu_id)=='s'),
