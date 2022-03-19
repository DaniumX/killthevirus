const debug = require("debug")("chat:socket_controller");
const rooms = [
  {
    id: "room1",
    name: "Room 1",
    meta: {},
    users: {},
    status: "Waiting for player",
    round: 0,
  },
  {
    id: "room2",
    name: "Room 2",
    meta: {},
    users: {},
    status: "Waiting for player",
    round: 0,
  },
  {
    id: "room3",
    name: "Room 3",
    meta: {},
    users: {},
    status: "Waiting for player",
    round: 0,
  },
];

const sleep = (t) => new Promise((s) => setTimeout(s, t));
function getHighestField(objArray, fieldName) {
  return Number(
    Math.max.apply(
      Math,
      objArray?.map((o) => o)
    ) || 0
  );
}

const x_coordinates = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 20, 24, 28, 32, 36, 40, 44,
  48, 52, 56, 60, 64, 72, 80, 96,
];
const y_coordinates = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 20, 24, 28, 32, 36, 40, 44,
  48, 52, 56, 60, 64, 72, 80, 96,
];

const startGame = async function (roomId, socket) {
  const room = rooms.find((chatroom) => chatroom.id === roomId);
  room.status = "Calculating coordinates...";
  io.sockets.in(room.id).emit("room:status", room.status);

  let x_coordinate =
    x_coordinates[Math.floor(Math.random() * x_coordinates.length)];
  let y_coordinate =
    y_coordinates[Math.floor(Math.random() * x_coordinates.length)];

  await sleep(Math.round(Math.random() * 10) * 1000);
  let virusLocation = [x_coordinate, y_coordinate];
  io.sockets.in(room.id).emit("virus:location", virusLocation);

  room.status = "Click the virus!";
  io.sockets.in(room.id).emit("room:status", room.status);
};

module.exports = function (socket, _io) {
  io = _io;

  debug("a new client has connected", socket.id);

  io.emit("new-connection", "A new user connected");
  io.emit("rooms:status", rooms);

  //   handle user disconnect
  socket.on("disconnect", async function (e, callback) {
    debug(`Client ${this.id} disconnected :(`);
    const room = rooms.find((chatroom) =>
      chatroom.users.hasOwnProperty(this.id)
    );
    if (!room) {
      return;
    }
    this.broadcast.to(room.id).emit("user:disconnected", room.users[this.id]);
    io.emit("rooms:status", rooms);
    delete room.users[this.id];
    this.broadcast.to(room.id).emit("user:list", room.users);
  });

  let count = 0;
  socket.on("virus:clicked", async function (e, callback) {
    const room = rooms.find((chatroom) => chatroom.id === e.roomId);
    console.log(room);
    room.meta[e.username] = {};
    room.meta[e.username].reactionTime = e.reactionTime;
    count++;
    console.log(room.meta);

    if (Object.keys(room.meta).length === 1) {
      console.log(room.users);
      room.users[this.id].score = room.users[this.id].score + 10;
      io.sockets
        .in(room.id)
        .emit(
          "game:logs",
          `${room.users[this.id].username} won round ${
            room.round
          } with a reaction time of ${room.meta[e.username].reactionTime}ms`
        );

      callback({ won: true });
    } else {
      io.sockets
        .in(room.id)
        .emit(
          "game:logs",
          `${room.users[this.id].username} lost round ${
            room.round
          } with a reaction time of ${room.meta[e.username].reactionTime}ms`
        );
      callback({ won: false });
      room.round = room.round + 1;
      await sleep(2000);

      if (room.round === 11) {
        let highestScore = 0;
        let winner;
        Object.entries(room.users).forEach((user) => {
          if (user[1].score > highestScore) {
            highestScore = user[1].score;
            winner = user[1];
          }
        });
        console.log("the winner is", winner);
        room.status = `Game finished. ${winner.username} won. Refresh to play again.`;
        io.sockets.in(room.id).emit("room:status", room.status);
        room.meta = {};
        room.users = {};
        room.status = "Waiting for player";
        room.round = 0;
        io.emit("rooms:status", rooms);
        return;
      }

      room.status = "Starting new round...";
      io.sockets.in(room.id).emit("room:status", room.status);
      io.sockets.in(room.id).emit("game:round", room.round);
      await sleep(1000);
      room.meta = [];
      startGame(room.id, socket);
    }

    io.sockets.in(room.id).emit("user:list", room.users);
  });

  //   handle user joined
  socket.on("user:joined", async function (e, callback) {
    debug(
      `User ${e.username} with socket id ${this.id} wants to join room '${e.roomId}'`
    );
    this.join(e.roomId);
    const room = rooms.find((chatroom) => chatroom.id === e.roomId);
    room.users[this.id] = {};
    room.users[this.id].username = e.username;
    room.users[this.id].score = 0;

    if (Object.keys(room.users).length > 1) {
      startGame(room.id, socket);
    }
    debug("users object length " + Object.keys(room.users).length);

    callback({
      success: true,
      roomName: room.name,
      users: room.users,
      id: room.id,
    });

    // broadcast to all users in room that someone connected
    this.broadcast.to(room.id).emit("user:connected", e.username);

    // broadcast list of users in room to all connected sockets EXCEPT ourselves
    this.broadcast.to(room.id).emit("user:list", room.users);

    // broadcast current room status
    io.sockets.in(room.id).emit("room:status", room.status);

    // broadcast all rooms to EVERYONE
    io.emit("rooms:status", rooms);
  });

  // handle user emitting a new message
  // socket.on('chat:message', handleChatMessage);
};
