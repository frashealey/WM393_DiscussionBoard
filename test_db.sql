-- this file is used to test relation constraints to ensure data integrity
-- (please first initialise the database using db.sql)
-- developed by 1928864

-- unit test 1 - verifying uni_user constraints
-- 1.1 - null id
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES (NULL, Crypt('testPass123', gen_salt('bf', 8)), Encrypt('George', 'discKey192', 'bf'), Encrypt('Jones', 'discKey192', 'bf'), Encrypt('george.jones@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
-- 1.2 - invalid id
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u00000', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('George', 'discKey192', 'bf'), Encrypt('Jones', 'discKey192', 'bf'), Encrypt('george.jones@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
-- 1.3 - null fname
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u1987465', Crypt('testPass123', gen_salt('bf', 8)), NULL, Encrypt('Jones', 'discKey192', 'bf'), Encrypt('george.jones@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
-- 1.4 - null lname
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u1987465', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('George', 'discKey192', 'bf'), NULL, Encrypt('george.jones@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
-- 1.5 - null email
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u1987465', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('George', 'discKey192', 'bf'), Encrypt('Jones', 'discKey192', 'bf'), NULL, Encrypt('t', 'discKey192', 'bf'));
-- 1.6 - invalid email
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u1987465', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('George', 'discKey192', 'bf'), Encrypt('Jones', 'discKey192', 'bf'), Encrypt('george.jones@gmail.com', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
-- 1.7 - null utype
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u1987465', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('George', 'discKey192', 'bf'), Encrypt('Jones', 'discKey192', 'bf'), Encrypt('george.jones@warwick.ac.uk', 'discKey192', 'bf'), NULL);
-- 1.8 - invalid utype
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u1987465', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('George', 'discKey192', 'bf'), Encrypt('Jones', 'discKey192', 'bf'), Encrypt('george.jones@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('x', 'discKey192', 'bf'));
-- 1.9 - valid record
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u1987465', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('George', 'discKey192', 'bf'), Encrypt('Jones', 'discKey192', 'bf'), Encrypt('george.jones@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
-- verify and reset after testing
SELECT id FROM uni_user;
TRUNCATE TABLE liked, response, topic, discussion, link_user, uni_user;

-- unit test 2 - verifying link_user constraints
-- setup - inserting example users into uni_user
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u1987465', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('George', 'discKey192', 'bf'), Encrypt('Jones', 'discKey192', 'bf'), Encrypt('george.jones@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u8857462', Crypt('testPass456', gen_salt('bf', 8)), Encrypt('Paul', 'discKey192', 'bf'), Encrypt('McDonald', 'discKey192', 'bf'), Encrypt('paul.McDonald@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('s', 'discKey192', 'bf'));
-- 2.1 - null lnk_tut_id
INSERT INTO link_user (lnk_tut_id, lnk_stu_id) VALUES (NULL, 'u8857462');
-- 2.2 - null lnk_stu_id
INSERT INTO link_user (lnk_tut_id, lnk_stu_id) VALUES ('u1987465', NULL);
-- 2.3 - invalid (lnk_tut_id = lnk_stu_id)
INSERT INTO link_user (lnk_tut_id, lnk_stu_id) VALUES ('u1987465', 'u1987465');
-- 2.4 - invalid (student as tutor & tutor as student)
INSERT INTO link_user (lnk_tut_id, lnk_stu_id) VALUES ('u8857462', 'u1987465');
-- 2.5 - valid record
INSERT INTO link_user (lnk_tut_id, lnk_stu_id) VALUES ('u1987465', 'u8857462');
-- verify and reset after testing
SELECT lnk_tut_id, lnk_stu_id FROM link_user;
TRUNCATE TABLE liked, response, topic, discussion, link_user, uni_user;

-- unit test 3 - verifying discussion constraints
-- setup - inserting example users into uni_user, and adding their links
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u1987465', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('George', 'discKey192', 'bf'), Encrypt('Jones', 'discKey192', 'bf'), Encrypt('george.jones@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u8857462', Crypt('testPass456', gen_salt('bf', 8)), Encrypt('Paul', 'discKey192', 'bf'), Encrypt('McDonald', 'discKey192', 'bf'), Encrypt('paul.McDonald@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('s', 'discKey192', 'bf'));
INSERT INTO link_user (lnk_tut_id, lnk_stu_id) VALUES ('u1987465', 'u8857462');
-- 3.1 - null dis_id
INSERT INTO discussion (dis_id, dis_owner, dis_title, archive) VALUES (NULL, 'u1987465', 'Example discussion board', false);
-- 3.2 - null dis_owner
INSERT INTO discussion (dis_owner, dis_title, archive) VALUES (NULL, 'Example discussion board', false);
-- 3.3 - undefined dis_owner (not present in uni_user)
INSERT INTO discussion (dis_owner, dis_title, archive) VALUES ('u0000000', 'Example discussion board', false);
-- 3.4 - null dis_title
INSERT INTO discussion (dis_owner, dis_title, archive) VALUES ('u1987465', NULL, false);
-- 3.5 - too-long dis_title
INSERT INTO discussion (dis_owner, dis_title, archive) VALUES ('u1987465', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', false);
-- 3.6 - null archive
INSERT INTO discussion (dis_owner, dis_title, archive) VALUES ('u1987465', 'Example discussion board', NULL);
-- 3.7 - invalid (student owns discussion board)
INSERT INTO discussion (dis_owner, dis_title, archive) VALUES ('u8857462', 'Example discussion board', false);
-- 3.8 - valid record
INSERT INTO discussion (dis_owner, dis_title, archive) VALUES ('u1987465', 'Example discussion board', false);
-- verify and reset after testing
SELECT dis_id, dis_owner, dis_title, archive FROM discussion;
ALTER SEQUENCE discussion_dis_id_seq RESTART;
TRUNCATE TABLE liked, response, topic, discussion, link_user, uni_user;

-- unit test 4 - verifying topic constraints
-- setup - inserting example users, links, and discussion
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u1987465', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('George', 'discKey192', 'bf'), Encrypt('Jones', 'discKey192', 'bf'), Encrypt('george.jones@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u8857462', Crypt('testPass456', gen_salt('bf', 8)), Encrypt('Paul', 'discKey192', 'bf'), Encrypt('McDonald', 'discKey192', 'bf'), Encrypt('paul.McDonald@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('s', 'discKey192', 'bf'));
INSERT INTO link_user (lnk_tut_id, lnk_stu_id) VALUES ('u1987465', 'u8857462');
INSERT INTO discussion (dis_owner, dis_title, archive) VALUES ('u1987465', 'Example discussion board', false);
-- 4.1 - null top_id
INSERT INTO topic (top_id, top_dis, top_title, top_desc, top_datetime) VALUES (NULL, 1, 'Example topic 1', 'Lorem ipsum dolor sit amet', Now());
-- 4.2 - null top_dis
INSERT INTO topic (top_dis, top_title, top_desc, top_datetime) VALUES (NULL, 'Example topic 1', 'Lorem ipsum dolor sit amet', Now());
-- 4.3 - undefined top_dis (not present in discussion)
INSERT INTO topic (top_dis, top_title, top_desc, top_datetime) VALUES (99, 'Example topic 1', 'Lorem ipsum dolor sit amet', Now());
-- 4.4 - null top_title
INSERT INTO topic (top_dis, top_title, top_desc, top_datetime) VALUES (1, NULL, 'Lorem ipsum dolor sit amet', Now());
-- 4.5 - too-long top_title
INSERT INTO topic (top_dis, top_title, top_desc, top_datetime) VALUES (1, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'Lorem ipsum dolor sit amet', Now());
-- 4.6 - null top_desc
INSERT INTO topic (top_dis, top_title, top_desc, top_datetime) VALUES (1, 'Example topic 1', NULL, Now());
-- 4.7 - too-long top_desc
INSERT INTO topic (top_dis, top_title, top_desc, top_datetime) VALUES (1, 'Example topic 1', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', Now());
-- 4.8 - null top_datetime
INSERT INTO topic (top_dis, top_title, top_desc, top_datetime) VALUES (1, 'Example topic 1', 'Lorem ipsum dolor sit amet', NULL);
-- 4.9 - valid record
INSERT INTO topic (top_dis, top_title, top_desc, top_datetime) VALUES (1, 'Example topic 1', 'Lorem ipsum dolor sit amet', Now());
-- verify and reset after testing
SELECT top_id, top_title, top_desc, top_datetime FROM topic;
ALTER SEQUENCE topic_top_id_seq RESTART;
ALTER SEQUENCE discussion_dis_id_seq RESTART;
TRUNCATE TABLE liked, response, topic, discussion, link_user, uni_user;

-- unit test 5 - verifying response constraints
-- setup - inserting example users, links, discussion, topic, and valid response (to reply to)
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u1987465', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('George', 'discKey192', 'bf'), Encrypt('Jones', 'discKey192', 'bf'), Encrypt('george.jones@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u8857462', Crypt('testPass456', gen_salt('bf', 8)), Encrypt('Paul', 'discKey192', 'bf'), Encrypt('McDonald', 'discKey192', 'bf'), Encrypt('paul.McDonald@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('s', 'discKey192', 'bf'));
INSERT INTO link_user (lnk_tut_id, lnk_stu_id) VALUES ('u1987465', 'u8857462');
INSERT INTO discussion (dis_owner, dis_title, archive) VALUES ('u1987465', 'Example discussion board', false);
INSERT INTO topic (top_dis, top_title, top_desc, top_datetime) VALUES (1, 'Example topic 1', 'Lorem ipsum dolor sit amet', Now());
INSERT INTO response (res_user, res_top, res_title, res_text) VALUES ('u8857462', 1, 'Example response 1', 'Ut enim ad minim veniam');
-- 5.1 - null res_id
INSERT INTO response (res_id, res_user, res_top, res_title, res_text, res_datetime, replyto, pinned) VALUES (NULL, 'u8857462', 1, 'Example response 1', 'Excepteur sint occaecat cupidatat non proident', Now(), 1, true);
-- 5.2 - null res_user
INSERT INTO response (res_user, res_top, res_title, res_text, res_datetime, replyto, pinned) VALUES (NULL, 1, 'Example response 1', 'Excepteur sint occaecat cupidatat non proident', Now(), 1, true);
-- 5.3 - undefined res_user (not present in uni_user)
INSERT INTO response (res_user, res_top, res_title, res_text, res_datetime, replyto, pinned) VALUES ('u0000000', 1, 'Example response 1', 'Excepteur sint occaecat cupidatat non proident', Now(), 1, true);
-- 5.4 - null res_top
INSERT INTO response (res_user, res_top, res_title, res_text, res_datetime, replyto, pinned) VALUES ('u8857462', NULL, 'Example response 1', 'Excepteur sint occaecat cupidatat non proident', Now(), 1, true);
-- 5.5 - undefined res_top (not present in topic)
INSERT INTO response (res_user, res_top, res_title, res_text, res_datetime, replyto, pinned) VALUES ('u8857462', 99, 'Example response 1', 'Excepteur sint occaecat cupidatat non proident', Now(), 1, true);
-- 5.6 - null res_title
INSERT INTO response (res_user, res_top, res_title, res_text, res_datetime, replyto, pinned) VALUES ('u8857462', 1, NULL, 'Excepteur sint occaecat cupidatat non proident', Now(), 1, true);
-- 5.7 - too-long res_title
INSERT INTO response (res_user, res_top, res_title, res_text, res_datetime, replyto, pinned) VALUES ('u8857462', 1, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'Excepteur sint occaecat cupidatat non proident', Now(), 1, true);
-- 5.8 - null res_text
INSERT INTO response (res_user, res_top, res_title, res_text, res_datetime, replyto, pinned) VALUES ('u8857462', 1, 'Example response 1', NULL, Now(), 1, true);
-- 5.9 - null res_datetime
INSERT INTO response (res_user, res_top, res_title, res_text, res_datetime, replyto, pinned) VALUES ('u8857462', 1, 'Example response 1', 'Excepteur sint occaecat cupidatat non proident', NULL, 1, true);
-- 5.10 - undefined replyto (not present in response)
INSERT INTO response (res_user, res_top, res_title, res_text, res_datetime, replyto, pinned) VALUES ('u8857462', 1, 'Example response 1', 'Excepteur sint occaecat cupidatat non proident', Now(), 99, true);
-- 5.11 - null pinned
INSERT INTO response (res_user, res_top, res_title, res_text, res_datetime, replyto, pinned) VALUES ('u8857462', 1, 'Example response 1', 'Excepteur sint occaecat cupidatat non proident', Now(), 1, NULL);
-- 5.12 - valid record
INSERT INTO response (res_user, res_top, res_title, res_text, res_datetime, replyto, pinned) VALUES ('u8857462', 1, 'Example response 1', 'Excepteur sint occaecat cupidatat non proident', Now(), 1, true);
-- verify and reset after testing
SELECT top_id, top_title, top_desc, top_datetime FROM topic;
ALTER SEQUENCE topic_top_id_seq RESTART;
ALTER SEQUENCE discussion_dis_id_seq RESTART;
ALTER SEQUENCE response_res_id_seq RESTART;
TRUNCATE TABLE liked, response, topic, discussion, link_user, uni_user;

-- unit test 6 - verifying liked constraints
-- setup - inserting example users, links, discussion, topic, and valid response (to reply to)
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u1987465', Crypt('testPass123', gen_salt('bf', 8)), Encrypt('George', 'discKey192', 'bf'), Encrypt('Jones', 'discKey192', 'bf'), Encrypt('george.jones@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('t', 'discKey192', 'bf'));
INSERT INTO uni_user (id, pw, fname, lname, email, utype) VALUES ('u8857462', Crypt('testPass456', gen_salt('bf', 8)), Encrypt('Paul', 'discKey192', 'bf'), Encrypt('McDonald', 'discKey192', 'bf'), Encrypt('paul.McDonald@warwick.ac.uk', 'discKey192', 'bf'), Encrypt('s', 'discKey192', 'bf'));
INSERT INTO link_user (lnk_tut_id, lnk_stu_id) VALUES ('u1987465', 'u8857462');
INSERT INTO discussion (dis_owner, dis_title, archive) VALUES ('u1987465', 'Example discussion board', false);
INSERT INTO topic (top_dis, top_title, top_desc, top_datetime) VALUES (1, 'Example topic 1', 'Lorem ipsum dolor sit amet', Now());
INSERT INTO response (res_user, res_top, res_title, res_text) VALUES ('u8857462', 1, 'Example response 1', 'Ut enim ad minim veniam');
-- 6.1 - null lke_user
INSERT INTO liked (lke_user, lke_res) VALUES (NULL, 1);
-- 6.2 - undefined lke_user (not present in uni_user)
INSERT INTO liked (lke_user, lke_res) VALUES ('u0000000', 1);
-- 6.3 - null lke_res
INSERT INTO liked (lke_user, lke_res) VALUES ('u8857462', NULL);
-- 6.4 - undefined lke_res (not present in response)
INSERT INTO liked (lke_user, lke_res) VALUES ('u8857462', 99);
-- 6.5 - valid record
INSERT INTO liked (lke_user, lke_res) VALUES ('u8857462', 1);
-- verify and reset after testing
SELECT lke_user, lke_res FROM liked;
ALTER SEQUENCE topic_top_id_seq RESTART;
ALTER SEQUENCE discussion_dis_id_seq RESTART;
ALTER SEQUENCE response_res_id_seq RESTART;
TRUNCATE TABLE liked, response, topic, discussion, link_user, uni_user;
