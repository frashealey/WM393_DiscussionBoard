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
CREATE TABLE uni_user (id CHAR(8) PRIMARY KEY CHECK (id ~* '^u[0-9]{7}$'), pw TEXT NOT NULL, fname BYTEA NOT NULL, lname BYTEA NOT NULL, email BYTEA NOT NULL CHECK (Encode(Decrypt(email, 'discKey192', 'bf'), 'escape')::VARCHAR ~* '^[A-Za-z0-9._-]+@warwick.ac.uk$'), istutor BYTEA NOT NULL);

