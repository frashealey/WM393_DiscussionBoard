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

-- unit test 2 - verifying link_user constraints/functions
-- setup - inserting example users into uni_user
INSERT INTO uni_user (id, pw, fname, lname, email, utype)
VALUES
    ('u2139948', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('John', 'discKey192', 'bf'), Encrypt('Smith', 'discKey192', 'bf'), Encrypt('john.smith@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
INSERT INTO uni_user (id, pw, fname, lname, email, utype)
VALUES
    ('u1827746', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('Jerry', 'discKey192', 'bf'), Encrypt('Seinfeld', 'discKey192', 'bf'), Encrypt('jerry.seinfeld@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('s', 'discKey192', 'bf'));
-- 2.1 - null lnk_tut_id
INSERT INTO link_user (lnk_tut_id, lnk_stu_id) VALUES (NULL, 'u2139948');
-- 2.2 - null lnk_stu_id
INSERT INTO link_user (lnk_tut_id, lnk_stu_id) VALUES ('u1827746', NULL);
-- 2.3 - invalid (lnk_tut_id = lnk_stu_id)
INSERT INTO link_user (lnk_tut_id, lnk_stu_id) VALUES ('u1827746', 'u1827746');
-- 2.4 - invalid (student as tutor & tutor as student)
INSERT INTO link_user (lnk_tut_id, lnk_stu_id) VALUES ('u1827746', 'u2139948');
-- 2.5 - valid record
INSERT INTO link_user (lnk_tut_id, lnk_stu_id) VALUES ('u2139948', 'u1827746');
-- reset after testing
TRUNCATE TABLE link_user;
TRUNCATE TABLE uni_user;

-- unit test 3 - verifying discussion constraints
-- 
