if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const Controller = require('./controllers/controller')
const express = require('express')
const app = express()
const cors = require('cors')
const { createServer } = require("node:http");
const { Server } = require("socket.io");

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://tomsushi81.web.app",
  },
});
const room1 = []
const countdowns = {}
const scoreboard = []
let countdown = 20

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.post('/login', Controller.login)
app.get('/username', Controller.getUsername)
app.get('/questions', Controller.getQuestion) 

app.post('/hint', Controller.getHint)


io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("game queue", (params) => {
    console.log(params, "<<< message dari client");
    socket.join("room1")
    
    const existingUser = room1.find((user) => user.socketId === socket.id);
    if (!existingUser) {
      room1.push({ socketId: socket.id, username: params.username, userCode: params.userCode });
      console.log(room1, "<<< room1");
      countdown = 20;
    }
    io.to("room1").emit("user queue", room1)

    if (!countdowns["room1"]) {
      countdown = 20;
      console.log("Starting countdown for room1");

      const countdownInterval = setInterval(() => {
        io.to("room1").emit("countdown", countdown);
        console.log(`Countdown: ${countdown} seconds`);

        countdown -= 1;
        if (countdown < 0) {
          clearInterval(countdownInterval);
          delete countdowns["room1"];
          console.log("Countdown finished. Moving room1 to /game");
          io.to("room1").emit("start game", { path: "/game" });
        }
      }, 1000);

      countdowns["room1"] = countdownInterval;
    }

    socket.on("started", (params) => {
      console.log(params, "<<< message dari client started");
      const user = room1.find((user) => user.socketId === socket.id);
      if (user) {
        user.userCode = params.userCode;
        io.to("room1").emit("user queue", room1);
      }

      scoreboard["room1"] = {};
      room1.forEach((user) => {
        scoreboard["room1"][user.socketId] = 0;
      });
      const scoreboardWithUsernames = Object.entries(scoreboard["room1"]).reduce(
        (acc, [id, userScore]) => {
          const userInRoom = room1.find((u) => u.socketId === id);
          if (userInRoom) {
            acc[userInRoom.username] = userScore;
          }
          return acc;
        },
        {}
      );
  
      console.log("Initial scoreboard:", scoreboardWithUsernames);
      
      io.to("room1").emit("scoreboard", scoreboardWithUsernames);  

      if (!countdowns["room1_started"]) {
        let countdown = 50;
        console.log("Starting 100-second countdown for room1");

        const countdownInterval = setInterval(() => {
          io.to("room1").emit("game countdown", countdown);
          console.log(`Countdown: ${countdown} seconds`);

          countdown -= 1;
          if (countdown < 0) {
            clearInterval(countdownInterval);
            delete countdowns["room1_started"];
            console.log("Countdown finished. Moving room1 to /result");

            const finalScoreboard = Object.entries(scoreboard["room1"]).reduce(
              (acc, [socketId, score]) => {
                const user = room1.find((u) => u.socketId === socketId);
                if (user) {
                  acc[user.username] = score;
                }
                return acc;
              },
              {}
            );

            const sortedFinalScoreboard = Object.fromEntries(
              Object.entries(finalScoreboard).sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
            );

            io.to("room1").emit("move to result", { path: "/result", scoreboard: sortedFinalScoreboard });
          }
        }, 1000);

        countdowns["room1_started"] = countdownInterval;
      }
    });
  })

  socket.on("update score", (params) => {
    const { socketId, score } = params;

    const user = room1.find((user) => user.socketId === socketId);

    if (user && scoreboard["room1"] && scoreboard["room1"][socketId] !== undefined) {
      scoreboard["room1"][socketId] += score;
      console.log(`Updated score for ${user.username}: ${scoreboard["room1"][socketId]}`);

      const scoreboardWithUsernames = Object.entries(scoreboard["room1"]).reduce(
        (acc, [id, userScore]) => {
          const userInRoom = room1.find((u) => u.socketId === id);
          if (userInRoom) {
            acc[userInRoom.username] = userScore;
          }
          return acc;
        }, {}
    );

    const sortedScoreboard = Object.fromEntries(
      Object.entries(scoreboardWithUsernames).sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    );

    io.to("room1").emit("scoreboard", sortedScoreboard);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    const index = room1.findIndex((user) => user.socketId === socket.id);
    if (index !== -1) {
      room1.splice(index, 1);
    }

    io.to("room1").emit("game queue", room1);
  });
});

const port = process.env.PORT || 3000
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})