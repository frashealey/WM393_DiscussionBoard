-- this file is used to insert example data into the database
-- (please first initialise the database using db.sql)
-- developed by 1928864

-- uni_user
INSERT INTO uni_user (id, pw, fname, lname, email, utype)
VALUES
    ('u2139948', Crypt('testPass123', gen_salt('md5')), Encrypt('John', 'discussKey192192', 'aes'), Encrypt('Smith', 'discussKey192192', 'aes'), Encrypt('john.smith@warwick.ac.uk', 'discussKey192192', 'aes'), Encrypt('t', 'discussKey192192', 'aes')),
    ('u9999999', Crypt('testPass123', gen_salt('md5')), Encrypt('Young', 'discussKey192192', 'aes'), Encrypt('Park', 'discussKey192192', 'aes'), Encrypt('y.s.park@warwick.ac.uk', 'discussKey192192', 'aes'), Encrypt('t', 'discussKey192192', 'aes')),
    ('u1827746', Crypt('testPass123', gen_salt('md5')), Encrypt('Jerry', 'discussKey192192', 'aes'), Encrypt('Seinfeld', 'discussKey192192', 'aes'), Encrypt('jerry.seinfeld@warwick.ac.uk', 'discussKey192192', 'aes'), Encrypt('s', 'discussKey192192', 'aes')),
    ('u1928899', Crypt('testPass123', gen_salt('md5')), Encrypt('Mitch', 'discussKey192192', 'aes'), Encrypt('Evans', 'discussKey192192', 'aes'), Encrypt('mitch.evans@warwick.ac.uk', 'discussKey192192', 'aes'), Encrypt('s', 'discussKey192192', 'aes'));
-- link_user
INSERT INTO link_user (lnk_tut_id, lnk_stu_id)
VALUES
    ('u2139948', 'u1827746'),
    ('u2139948', 'u1928899'),
    ('u9999999', 'u1827746');
-- discussion
INSERT INTO discussion (dis_owner, dis_title, archive)
VALUES
    ('u2139948', 'Example discussion board 1', false),
    ('u2139948', 'Example discussion board 2', true),
    ('u9999999', 'Example discussion board 3', false),
    ('u9999999', 'Example discussion board 4', true);
-- topic
INSERT INTO topic (top_dis, top_title, top_desc, top_datetime)
VALUES
    (1, 'Example topic 1', 'Lorem ipsum dolor sit amet', Now()),
    (1, 'Example topic 2', 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat', Now()),
    (3, 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate nonprovident', Now()),
    (4, 'Example topic', 'This is a topic for an archived discussion board', Now());
-- response
INSERT INTO response (res_user, res_top, res_title, res_text) VALUES ('u1827746', 1, 'Example response 1', 'Ut enim ad minim veniam');
INSERT INTO response (res_user, res_top, res_title, res_text, replyto, pinned) VALUES ('u2139948', 1, 'Example response 2', 'Excepteur sint occaecat cupidatat non proident', 1, true);
INSERT INTO response (res_user, res_top, res_title, res_text) VALUES ('u1827746', 3, 'Example response 3', 'Example response to the given scenario');
INSERT INTO response (res_user, res_top, res_title, res_text, replyto) VALUES ('u9999999', 3, 'Example response 4', 'A rebuttal to the previous response', 3);
INSERT INTO response (res_user, res_top, res_title, res_text, pinned) VALUES ('u2139948', 3, 'Example response 5', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?', true);
-- liked
INSERT INTO liked (lke_user, lke_res) VALUES ('u9999999', 5);
