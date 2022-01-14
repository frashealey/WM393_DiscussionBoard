-- this file is used to insert example data into the database
-- (please first initialise the database using db.sql)
-- developed by 1928864

-- uni_user
INSERT INTO uni_user (id, pw, fname, lname, email, utype)
VALUES
    ('u2139948', Crypt('testPass123', gen_salt('bf', 8)), pgp_sym_encrypt('John', 'discKey192', 'cipher-algo=bf'), pgp_sym_encrypt('Smith', 'discKey192', 'cipher-algo=bf'), pgp_sym_encrypt('john.smith@warwick.ac.uk', 'discKey192', 'cipher-algo=bf'), pgp_sym_encrypt('t', 'discKey192', 'cipher-algo=bf')),
    ('u1827746', Crypt('testPass123', gen_salt('bf', 8)), pgp_sym_encrypt('Jerry', 'discKey192', 'cipher-algo=bf'), pgp_sym_encrypt('Seinfeld', 'discKey192', 'cipher-algo=bf'), pgp_sym_encrypt('jerry.seinfeld@warwick.ac.uk', 'discKey192', 'cipher-algo=bf'), pgp_sym_encrypt('s', 'discKey192', 'cipher-algo=bf'));
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
INSERT INTO response (res_user, res_top, res_title, res_text) VALUES ('u1827746', 1, 'Example response 1', 'Ut enim ad minim veniam');
INSERT INTO response (res_user, res_top, res_title, res_text, replyto, pinned) VALUES ('u2139948', 1, 'Example response 2', 'Excepteur sint occaecat cupidatat non proident', 1, true);
