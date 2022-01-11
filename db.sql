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

INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u2139948', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('John', 'discKey192', 'bf'), Encrypt('Smith', 'discKey192', 'bf'), Encrypt('john.smith@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u1827746', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('Jerry', 'discKey192', 'bf'), Encrypt('Seinfeld', 'discKey192', 'bf'), Encrypt('jerry.seinfeld@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('s', 'discKey192', 'bf'));

SELECT Encode(Decrypt(utype, 'discKey192', 'bf'), 'escape')::CHAR(1) as utype FROM uni_user WHERE id='u2139948';

-- link_user
CREATE TABLE link_user (
    lnk_tut_id CHAR(8) REFERENCES uni_user(id),
    lnk_stu_id CHAR(8) REFERENCES uni_user(id),
    CONSTRAINT not_equal CHECK (lnk_tut_id != lnk_stu_id),
    PRIMARY KEY (lnk_tut_id, lnk_stu_id)
);

-- -- these need to be in a function
-- CONSTRAINT role_check_tutor CHECK ((SELECT Encode(Decrypt(utype, 'discKey192', 'bf'), 'escape')::CHAR(1) as utype FROM uni_user WHERE id=lnk_tut_id)=='t'),
-- CONSTRAINT role_check_student CHECK ((SELECT Encode(Decrypt(utype, 'discKey192', 'bf'), 'escape')::CHAR(1) as utype FROM uni_user WHERE id=lnk_stu_id)=='s'),
