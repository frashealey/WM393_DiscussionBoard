-- this file is used to insert example data into the database
-- (please first initialise the database using db.sql)
-- developed by 1928864

-- uni_user
INSERT INTO uni_user (id, pw, fname, lname, email, utype)
VALUES
    ('u2139948', Crypt('testPass123', gen_salt('md5')), Encrypt('John', 'discussKey192192', 'aes'), Encrypt('Smith', 'discussKey192192', 'aes'), Encrypt('john.smith@warwick.ac.uk', 'discussKey192192', 'aes'), Encrypt('t', 'discussKey192192', 'aes')),
    ('u9999999', Crypt('testPass123', gen_salt('md5')), Encrypt('Young', 'discussKey192192', 'aes'), Encrypt('Park', 'discussKey192192', 'aes'), Encrypt('y.s.park@warwick.ac.uk', 'discussKey192192', 'aes'), Encrypt('t', 'discussKey192192', 'aes')),
    ('u1827746', Crypt('testPass123', gen_salt('md5')), Encrypt('Jerry', 'discussKey192192', 'aes'), Encrypt('Seinfeld', 'discussKey192192', 'aes'), Encrypt('jerry.seinfeld@warwick.ac.uk', 'discussKey192192', 'aes'), Encrypt('s', 'discussKey192192', 'aes'));
-- link_user
INSERT INTO link_user (lnk_tut_id, lnk_stu_id)
VALUES
    ('u2139948', 'u1827746'),
    ('u9999999', 'u1827746');
-- discussion
INSERT INTO discussion (dis_owner, dis_title, archive)
VALUES
    ('u2139948', 'Example discussion board 1', false),
    ('u2139948', 'Example discussion board 2', false),
    ('u2139948', 'Example discussion board 3', false),
    ('u2139948', 'Example archived discussion board', true),
    ('u9999999', 'Example discussion board 4', false),
    ('u9999999', 'Example discussion board 5', false);
-- topic
INSERT INTO topic (top_dis, top_title, top_desc, top_datetime)
VALUES
    (1, 'Example topic 1', 'Lorem ipsum dolor sit amet', Now()),
    (1, 'Example topic 2', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', Now()),
    (5, 'Example topic 3', 'Example description', Now());
-- response
INSERT INTO response (res_user, res_top, res_title, res_text) VALUES ('u1827746', 1, 'Example response 1', 'Ut enim ad minim veniam');
INSERT INTO response (res_user, res_top, res_title, res_text, replyto, pinned) VALUES ('u2139948', 1, 'Example response 2', 'Excepteur sint occaecat cupidatat non proident', 1, true);
INSERT INTO response (res_user, res_top, res_title, res_text) VALUES ('u1827746', 3, 'Example response 3', 'This is an example response');
