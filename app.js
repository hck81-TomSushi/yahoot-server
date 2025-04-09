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
  })

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