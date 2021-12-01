-- this file is used to document development of the PostgreSQL database
-- developed by 1928864

-- creates discusison database, ensures it has been created, and connecting to it
CREATE DATABASE discussion;
\l
\c discussion

-- creates pgcrypto extension, used for encrypting/decrypting sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- testing hashing passwords - preferable to use bcrypt over md5
SELECT Crypt('testPass123', gen_salt('bf', 8));
SELECT ('$2a$08$ISFEqiuO1MhI1gETCdcj8OjsBjQUhEY6u/6sZ8Xnr3qZ60ZnfCTze' = Crypt('testPass123', '$2a$08$ISFEqiuO1MhI1gETCdcj8OjsBjQUhEY6u/6sZ8Xnr3qZ60ZnfCTze'));
SELECT ('$2a$08$ISFEqiuO1MhI1gETCdcj8OjsBjQUhEY6u/6sZ8Xnr3qZ60ZnfCTze' = Crypt('wrongPass123', '$2a$08$ISFEqiuO1MhI1gETCdcj8OjsBjQUhEY6u/6sZ8Xnr3qZ60ZnfCTze'));


-- uni_user relation
CREATE TABLE uni_user (
    id CHAR(8) PRIMARY KEY CHECK (id ~ '^u[0-9]{7}$'),
    pw TEXT NOT NULL,
    fname BYTEA NOT NULL,
    lname BYTEA NOT NULL,
    email BYTEA NOT NULL CHECK (Encode(Decrypt(email, 'discKey192', 'bf'), 'escape')::VARCHAR ~ '^[A-Za-z0-9\._-]+\@warwick\.ac\.uk$'),
    utype BYTEA NOT NULL CHECK (Encode(Decrypt(utype, 'discKey192', 'bf'), 'escape')::CHAR(1) IN ('s', 't'))
);

-- test suite 1 - verifying uni_user constraints
-- 1.1 - null id
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES (NULL, Crypt('testPass123', gen_salt('bf', 8)), Encrypt('John', 'discKey192', 'bf'), Encrypt('Smith', 'discKey192', 'bf'), Encrypt('john.smith@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
-- 1.2 - invalid id
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u00000', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('John', 'discKey192', 'bf'), Encrypt('Smith', 'discKey192', 'bf'), Encrypt('john.smith@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
-- 1.3 - null fname
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u2139948', Crypt('testPass123', gen_salt('bf', 8)), NULL, Encrypt('Smith', 'discKey192', 'bf'), Encrypt('john.smith@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
-- 1.4 - null lname
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u2139948', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('John', 'discKey192', 'bf'), NULL, Encrypt('john.smith@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
-- 1.5 - null email
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u2139948', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('John', 'discKey192', 'bf'), Encrypt('Smith', 'discKey192', 'bf'), NULL, Encrypt('t', 'discKey192', 'bf'));
-- 1.6 - invalid email
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u2139948', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('John', 'discKey192', 'bf'), Encrypt('Smith', 'discKey192', 'bf'), Encrypt('john.smith@gmail.com', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
-- 1.7 - null utype
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u2139948', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('John', 'discKey192', 'bf'), Encrypt('Smith', 'discKey192', 'bf'), Encrypt('john.smith@warwick.ac.uk', 'discKey192', 'bf'), NULL);
-- 1.8 - invalid utype
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u2139948', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('John', 'discKey192', 'bf'), Encrypt('Smith', 'discKey192', 'bf'), Encrypt('john.smith@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('x', 'discKey192', 'bf'));
-- 1.9 - valid record
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u2139948', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('John', 'discKey192', 'bf'), Encrypt('Smith', 'discKey192', 'bf'), Encrypt('john.smith@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
-- reset after testing
TRUNCATE TABLE uni_user;
