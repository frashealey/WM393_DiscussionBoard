const test = require("ava"),
      server = require("./app.js"),
      request = require("supertest");

test("invalid registration - already registered", async t => {
    const regCreds = {
        id: "u9999999",
        fname: "Test",
        lname: "Testman",
        email: "test.testman@warwick.ac.uk",
        pw: "testPass123",
        confpw: "testPass123",
        utype: "s"
    };
    const response = await request(server).post("/register").send(regCreds);
        t.is(response.header.location, "/register");
});

test("invalid registration - id missing", async t => {
    const regCreds = {
        fname: "Test",
        lname: "Testman",
        email: "test.testman@warwick.ac.uk",
        pw: "testPass123",
        confpw: "testPass123",
        utype: "s"
    };
    const response = await request(server).post("/register").send(regCreds);
        t.is(response.header.location, "/register");
});

test("invalid registration - fname missing", async t => {
    const regCreds = {
        id: "u3333333",
        lname: "Testman",
        email: "test.testman@warwick.ac.uk",
        pw: "testPass123",
        confpw: "testPass123",
        utype: "s"
    };
    const response = await request(server).post("/register").send(regCreds);
        t.is(response.header.location, "/register");
});

test("invalid registration - lname missing", async t => {
    const regCreds = {
        id: "u3333333",
        fname: "Test",
        email: "test.testman@warwick.ac.uk",
        pw: "testPass123",
        confpw: "testPass123",
        utype: "s"
    };
    const response = await request(server).post("/register").send(regCreds);
        t.is(response.header.location, "/register");
});

test("invalid registration - email missing", async t => {
    const regCreds = {
        id: "u3333333",
        fname: "Test",
        lname: "Testman",
        pw: "testPass123",
        confpw: "testPass123",
        utype: "s"
    };
    const response = await request(server).post("/register").send(regCreds);
        t.is(response.header.location, "/register");
});

test("invalid registration - pw missing", async t => {
    const regCreds = {
        id: "u3333333",
        fname: "Test",
        lname: "Testman",
        email: "test.testman@warwick.ac.uk",
        confpw: "testPass123",
        utype: "s"
    };
    const response = await request(server).post("/register").send(regCreds);
        t.is(response.header.location, "/register");
});

test("invalid registration - confpw missing", async t => {
    const regCreds = {
        id: "u3333333",
        fname: "Test",
        lname: "Testman",
        email: "test.testman@warwick.ac.uk",
        pw: "testPass123",
        utype: "s"
    };
    const response = await request(server).post("/register").send(regCreds);
        t.is(response.header.location, "/register");
});

test("invalid registration - passwords not same", async t => {
    const regCreds = {
        id: "u3333333",
        fname: "Test",
        lname: "Testman",
        email: "test.testman@warwick.ac.uk",
        pw: "testPass123",
        confpw: "notTheSame123",
        utype: "s"
    };
    const response = await request(server).post("/register").send(regCreds);
        t.is(response.header.location, "/register");
});

test("invalid registration - invalid email", async t => {
    const regCreds = {
        id: "u3333333",
        fname: "Test",
        lname: "Testman",
        email: "test.testman@gmail.com",
        pw: "testPass123",
        confpw: "testPass123",
        utype: "s"
    };
    const response = await request(server).post("/register").send(regCreds);
        t.is(response.header.location, "/register");
});

test("invalid registration - invalid university ID", async t => {
    const regCreds = {
        id: "u2",
        fname: "Test",
        lname: "Testman",
        email: "test.testman@warwick.ac.uk",
        pw: "testPass123",
        confpw: "testPass123",
        utype: "s"
    };
    const response = await request(server).post("/register").send(regCreds);
        t.is(response.header.location, "/register");
});

test("valid registration", async t => {
    const regCreds = {
        // generates random 7 digit number
        id: "u" + (Math.floor(Math.random() * 9000000) + 10000).toString(),
        fname: "Test",
        lname: "Testman",
        email: "test.testman@warwick.ac.uk",
        pw: "testPass123",
        confpw: "testPass123",
        utype: "s"
    };
    const response = await request(server).post("/login").send(regCreds);
        t.is(response.header.location, "/login");
});
