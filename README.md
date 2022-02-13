# WMGTSS Discussion Board - 1928864

### Accessing online

The discussion board application can be accessed online at: https://discussion1928864.herokuapp.com/

Please use the pre-created (Young Park) user login:

ID: u9999999

Password: testPass123

### Hosting locally

Alternatively, if you would like to host the application locally, please follow the instructions below.

#### Installing dependencies
- Download and install [PostgreSQL 14.1 or later](https://www.postgresql.org/download/) (please ensure postgres user has password postgres192)
- Download and install [NodeJS v17.1.0 or later](https://nodejs.org/en/download/) (please ensure node package manager (npm) is installed at the same time)
- Download and extract the application code by [downloading](https://github.com/frashealey/WM393_DiscussionBoard/archive/refs/heads/master.zip) or cloning from the [repository](https://github.com/frashealey/WM393_DiscussionBoard) as below:
```console
git clone https://github.com/frashealey/WM393_DiscussionBoard.git
```
- Install all NodeJS dependencies in package.json (if node-modules not already present) by navigating to the project directory and running in the terminal:
```console
npm install
```

#### Initialising the database
- Login to PostgreSQL and paste the contents of [db/db.sql](https://github.com/frashealey/WM393_DiscussionBoard/blob/master/db/db.sql) to terminal
- (Optional) paste the contents of [db/exampledata_db.sql](https://github.com/frashealey/WM393_DiscussionBoard/blob/master/db/exampledata_db.sql) to terminal

#### Testing
- The PostgreSQL database can be tested by logging into PostgreSQL and pasting the contents of [test_db.sql](https://github.com/frashealey/WM393_DiscussionBoard/blob/master/test_db.sql)
- The NodeJS application can be tested by navigating to the project directory and running in the terminal:
```console
npm run test
```

#### Execution
- Navigate to the project directory and run in the terminal
```console
node app.js
```
- The application can then be accessed in your browser at: http://localhost:3000/



##### <img src="public/resources/warwicklogo.png" width="68" height="34">
##### © 2021-2022 Fras Healey | Developed by Fras Healey (1928864)
