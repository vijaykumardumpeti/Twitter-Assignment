let express = require("express");
let app = express();

module.exports = app;

let jwt = require("jsonwebtoken");
let bcrypt = require("bcrypt");

let sqlite = require("sqlite");
let sqlite3 = require("sqlite3");

app.use(express.json());

let path = require("path"); //core module

//intializeDBAndServer

let dbPath = path.join(__dirname, "twitterClone.db");
let { open } = sqlite;
let db;
let intializeDBAndServer = async () => {
  db = await open({ filename: dbPath, driver: sqlite3.Database });
  app.listen(3000, () => {
    console.log(`Server Started at http://localhost:3000/`);
  });
};
intializeDBAndServer();

//register
app.post("/register/", async (request, response) => {
  try {
    let { username, password, name, gender } = request.body;
    let getUserDetailsQuery = `SELECT * FROM user  WHERE username = '${username}';`;
    let getUserDetails = await db.get(getUserDetailsQuery);

    let hashedPassword = await bcrypt.hash(password, 10);

    if (getUserDetails === undefined) {
      if (request.body.password.length < 6) {
        response.status(400);
        response.send("Password is too short");
      } else {
        let createUserQuery = `
            INSERT INTO 
                user (username, password,name,gender)
            VALUES
            ('${username}', '${hashedPassword}', '${name}', '${gender}');    

        `;
        await db.run(createUserQuery);
        response.status(200);
        response.send("User created successfully");
      }
    } else {
      response.status(400);
      response.send("User already exists");
    }
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
});

//login
app.post("/login/", async (request, response) => {
  let { username, password } = request.body;

  let getUserQuery = `SELECT * FROM user WHERE username = '${username}';`;

  let userDetails = await db.get(getUserQuery);

  let isPasswordMatched = await bcrypt.compare(password, userDetails.password);

  if (userDetails !== undefined) {
    if (isPasswordMatched === true) {
      //send JWT Token
      let payload = { username: username };
      let jwtToken = jwt.sign(payload, "vijay");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

//Authentication with JWT Token

let authenticateToken = (request, response, next) => {
  let authHead = request.headers["authorization"];

  let jwtToken;
  if (authHead !== undefined) {
    jwtToken = authHead.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    let isJwtMatched = jwt.compare(
      jwtToken,
      "vijay",
      async (error, payload) => {
        if (error) {
          response.status(401);
          response.send("Invalid JWT Token");
        } else {
          next();
          request.username = payload.username;
        }
      }
    );
  }
};
//API-3
app.get("/user/tweets/feed/", async (request, response) => {
  let { username } = request;

  let getSqlQuery = `
        SELECT 
            username,tweet,date_time
        FROM
            user NATURAL JOIN tweet
        ORDER BY 
            username DESC
        LIMIT 4
        OFFSET 5;     
  
`;
  let usersArray = await db.all(getSqlQuery);
  let s = usersArray.map((object) => {
    let w = {
      username: object.username,
      tweet: object.tweet,
      dateTime: object.date_time,
    };
    return w;
  });
  response.send(s);
});

//API-4
app.get("/user/following/", async (request, response) => {
  let { username } = request;
  let getSqlQuery = `
        SELECT 
            name
        FROM
            user 
`;
  let arrayObject = await db.all(getSqlQuery);
  response.send(arrayObject);
});

//API-5
app.get("/user/followers/", async (request, response) => {
  let { username } = request;
  let getSqlQuery = `
        SELECT 
            name
        FROM
            user 
`;
  let arrayObject = await db.all(getSqlQuery);
  response.send(arrayObject);
});

//API-6
app.get("/tweets/:tweetId/", async (request, response) => {
  let { tweetId } = request.params;

  if (tweetId !== undefined) {
    let getSqlQuery = `
            SELECT 
                tweet, count(like_id) as likes, count(reply) as replies, date_time as dateTime
            FROM
                like NATURAL JOIN reply NATURAL JOIN tweet
                 
    `;
    let detailsArray = await db.all(getSqlQuery);
    response.send(detailsArray);
  } else {
    response.status(401);
    response.send("Invalid Request");
  }
});
//API-7
app.get("/tweets/:tweetId/likes/", async (request, response) => {
  let { tweetId } = request.params;

  if (tweetId !== undefined) {
    let getSqlQuery = `
            SELECT 
                tweet, 
                count(like_id) as likes, 
                count(reply) as replies, 
                date_time as dateTime
            FROM
                like NATURAL JOIN reply NATURAL JOIN tweet
                 
    `;
    let detailsArray = await db.all(getSqlQuery);
    response.send(detailsArray);
  } else {
    response.status(401);
    response.send("Invalid Request");
  }
});
