-- this file is used to insert example data into the database
-- (please first initialise the database using db.sql)
-- developed by 1928864

-- uni_user
INSERT INTO uni_user (id, pw, fname, lname, email, utype)
VALUES
    ('u2139948', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('John', 'discKey192', 'bf'), Encrypt('Smith', 'discKey192', 'bf'), Encrypt('john.smith@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
INSERT INTO uni_user (id, pw, fname, lname, email, utype)
VALUES
    ('u1827746', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('Jerry', 'discKey192', 'bf'), Encrypt('Seinfeld', 'discKey192', 'bf'), Encrypt('jerry.seinfeld@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('s', 'discKey192', 'bf'));
-- link_user
INSERT INTO link_user (lnk_tut_id, lnk_stu_id)
VALUES
    ('u2139948', 'u1827746');
-- discussion
INSERT INTO discussion (dis_owner, dis_title, archive)
VALUES
    ('u2139948', 'Example discussion board', false);
-- topic
INSERT INTO topic (top_dis, top_title, top_desc, top_datetime)
VALUES
    (1, 'Example topic 1', 'Lorem ipsum dolor sit amet', Now());
-- response
INSERT INTO response (res_user, res_top, res_title, res_text)
VALUES
    ('u1827746', 1, 'Example response 1', 'Ut enim ad minim veniam');
INSERT INTO response (res_user, res_top, res_title, res_text, res_datetime, replyto, pinned)
VALUES
    ('u1827746', 1, 'Example response 1', 'Excepteur sint occaecat cupidatat non proident', Now(), 1, true);
