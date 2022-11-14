const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
//for password encryption
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const databasePath = path.join(__dirname, "userData.db");
let database = null;

const initializeDnAndServer = async () => {
  try {
    database = await open({ filename: databasePath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log(`Server is running on http://localhost:3000`);
    });
  } catch (error) {
    console.log(`Database Error is ${error}`);
    process.exit(1);
  }
};

initializeDnAndServer();

//                               API 1
//                         user registration
//          Scenarios
// 1) If the username already exists
// 2) Password is too short
// 3) User created successfully
//change the password to encrypted format using bcrypt() third part library
//npm install bcrypt --save
// const hashedPassword = await bcrypt.hash(password,saltRounds);

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  //encrypt password
  const hashedPassword = await bcrypt.hash(password, 10);
  // check if user exists
  const checkUserQuery = `select username from user where username = '${username}';`;
  const checkUserResponse = await database.get(checkUserQuery);
  if (checkUserResponse === undefined) {
    const createUserQuery = `
      insert into user(username,name,password,gender,location) 
      values('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
    if (password.length > 5) {
      const createUser = await database.run(createUserQuery);
      response.send("User created successfully"); //Scenario 3
    } else {
      response.status(400);
      response.send("Password is too short"); //Scenario 2
    }
  } else {
    response.status(400);
    response.send(`User already exists`); //Scenario 1
  }
});

//                             API 2
//                           USER LOGIN
//                Scenarios
// 1) If an unregistered user tries to login
// 2) If the user provides incorrect password
// 3) Successful login of the user
// compare the encrypted password  and given password is same.
// const result = await bcrypt.compare(givenPassword, passwordInDb)

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `select * from user where username = '${username}';`;
  const userNameResponse = await database.get(checkUserQuery);
  if (userNameResponse !== undefined) {
    const isPasswordMatched = await bcrypt.compare(
      password,
      userNameResponse.password
    );
    if (isPasswordMatched) {
      response.status(200);
      response.send(`Login success!`); // Scenario 3
    } else {
      response.status(400);
      response.send(`Invalid password`); // Scenario 2
    }
  } else {
    response.status(400);
    response.send(`Invalid user`); //Scenario 1
  }
});

//                                    API 3
//                                change Password
//      Scenarios
// 1) If the user provides incorrect current password
// 2)Password is too short
//  3) Password updated
// 4) invalid user

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  // check user
  const checkUserQuery = `select * from user where username = '${username}';`;
  const userDetails = await database.get(checkUserQuery);
  if (userDetails !== undefined) {
    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (isPasswordValid) {
      if (newPassword.length > 5) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `update user set 
        password = '${hashedPassword}' where username = '${username}';`;
        const updatePasswordResponse = await database.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated"); //Scenario 3
      } else {
        response.status(400);
        response.send("Password is too short"); //Scenario 2
      }
    } else {
      response.status(400);
      response.send("Invalid current password"); //Scenario 1
    }
  } else {
    response.status(400);
    response.send(`Invalid user`); // Scenario 4
  }
});

module.exports = app;

// const express = require("express");
// const { open } = require("sqlite");
// const sqlite3 = require("sqlite3");
// const path = require("path");
// const bcrypt = require("bcrypt");

// const databasePath = path.join(__dirname, "userData.db");

// const app = express();

// app.use(express.json());

// let database = null;

// const initializeDbAndServer = async () => {
//   try {
//     database = await open({
//       filename: databasePath,
//       driver: sqlite3.Database,
//     });

//     app.listen(3000, () =>
//       console.log("Server Running at http://localhost:3000/")
//     );
//   } catch (error) {
//     console.log(`DB Error: ${error.message}`);
//     process.exit(1);
//   }
// };

// initializeDbAndServer();

// const validatePassword = (password) => {
//   return password.length > 4;
// };

// app.post("/register", async (request, response) => {
//   const { username, name, password, gender, location } = request.body;
//   const hashedPassword = await bcrypt.hash(password, 10);
//   const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
//   const databaseUser = await database.get(selectUserQuery);

//   if (databaseUser === undefined) {
//     const createUserQuery = `
//      INSERT INTO
//       user (username, name, password, gender, location)
//      VALUES
//       (
//        '${username}',
//        '${name}',
//        '${hashedPassword}',
//        '${gender}',
//        '${location}'
//       );`;
//     if (validatePassword(password)) {
//       await database.run(createUserQuery);
//       response.send("User created successfully");
//     } else {
//       response.status(400);
//       response.send("Password is too short");
//     }
//   } else {
//     response.status(400);
//     response.send("User already exists");
//   }
// });

// app.post("/login", async (request, response) => {
//   const { username, password } = request.body;
//   const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
//   const databaseUser = await database.get(selectUserQuery);

//   if (databaseUser === undefined) {
//     response.status(400);
//     response.send("Invalid user");
//   } else {
//     const isPasswordMatched = await bcrypt.compare(
//       password,
//       databaseUser.password
//     );
//     if (isPasswordMatched === true) {
//       response.send("Login success!");
//     } else {
//       response.status(400);
//       response.send("Invalid password");
//     }
//   }
// });

// app.put("/change-password", async (request, response) => {
//   const { username, oldPassword, newPassword } = request.body;
//   const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
//   const databaseUser = await database.get(selectUserQuery);
//   if (databaseUser === undefined) {
//     response.status(400);
//     response.send("Invalid user");
//   } else {
//     const isPasswordMatched = await bcrypt.compare(
//       oldPassword,
//       databaseUser.password
//     );
//     if (isPasswordMatched === true) {
//       if (validatePassword(newPassword)) {
//         const hashedPassword = await bcrypt.hash(newPassword, 10);
//         const updatePasswordQuery = `
//           UPDATE
//             user
//           SET
//             password = '${hashedPassword}'
//           WHERE
//             username = '${username}';`;

//         const user = await database.run(updatePasswordQuery);

//         response.send("Password updated");
//       } else {
//         response.status(400);
//         response.send("Password is too short");
//       }
//     } else {
//       response.status(400);
//       response.send("Invalid current password");
//     }
//   }
// });

// module.exports = app;
