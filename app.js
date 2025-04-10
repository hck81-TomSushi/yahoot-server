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
    origin: "http://localhost:5173",
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
app.get('/hint', Controller.getHint)

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
      let countdown = 20;
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

      if (!scoreboard["room1"]) {
        scoreboard["room1"] = {}; // Create a scoreboard for room1
        room1.forEach((user) => {
          scoreboard["room1"][user.socketId] = 0; // Initialize each user's score to 0
        });
        const scoreboardWithUsernames = Object.entries(scoreboard["room1"]).reduce(
          (acc, [id, userScore]) => {
            const userInRoom = room1.find((u) => u.socketId === id);
            if (userInRoom) {
              acc[userInRoom.username] = userScore; // Map username to score
            }
            return acc;
          },
          {}
        );
    
        // Emit the initial scoreboard with usernames
        console.log("Initial scoreboard:", scoreboardWithUsernames);
        
        io.to("room1").emit("scoreboard", scoreboardWithUsernames);  
      }

      // Start a 100-second timer for the room
      if (!countdowns["room1_started"]) {
        let countdown = 10; // Set the countdown to 100 seconds
        console.log("Starting 100-second countdown for room1");

        const countdownInterval = setInterval(() => {
          io.to("room1").emit("game countdown", countdown); // Emit the remaining time
          console.log(`Countdown: ${countdown} seconds`);

          countdown -= 1;
          if (countdown < 0) {
            clearInterval(countdownInterval); // Stop the countdown
            delete countdowns["room1_started"]; // Remove the countdown state
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

            io.to("room1").emit("move to result", { path: "/result", scoreboard: finalScoreboard });
            // io.to("room1").emit("final scoreboard", scoreboard["room1"]); // Emit the final scoreboard
          }
        }, 1000);

        // Store the countdown interval for the room
        countdowns["room1_started"] = countdownInterval;
      }
    });
  })

  socket.on("update score", (params) => {
    const { socketId, score } = params;

  // Find the user in room1 to get their username
    const user = room1.find((user) => user.socketId === socketId);

    if (user && scoreboard["room1"] && scoreboard["room1"][socketId] !== undefined) {
      scoreboard["room1"][socketId] += score; // Increment the user's score
      console.log(`Updated score for ${user.username}: ${scoreboard["room1"][socketId]}`);

      // Transform the scoreboard to use usernames instead of socketIds
      const scoreboardWithUsernames = Object.entries(scoreboard["room1"]).reduce(
        (acc, [id, userScore]) => {
          const userInRoom = room1.find((u) => u.socketId === id);
          if (userInRoom) {
            acc[userInRoom.username] = userScore; // Map username to score
          }
          return acc;
        }, {}
    );

    // Emit the updated scoreboard with usernames
    io.to("room1").emit("scoreboard", scoreboardWithUsernames);
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

const port = 3000
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
