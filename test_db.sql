-- unit test 1 - verifying uni_user constraints
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
