const debug = require("debug")("chat:socket_controller");
const rooms = [
  {
    id: "room1",
    name: "Room 1",
    users: {},
    status: "Waiting for player",
  },
  {
    id: "room2",
    name: "Room 2",
    users: {},
    status: "Waiting for player",
  },
  {
    id: "room3",
    name: "Room 3",
    users: {},
    status: "Waiting for player",
  },
];

const x_coordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 20];
const y_coordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 20];

const startGame = function () {};

module.exports = function (socket, _io) {
  io = _io;

  debug("a new client has connected", socket.id);

  io.emit("new-connection", "A new user connected");

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
    delete room.users[this.id];
    this.broadcast.to(room.id).emit("user:list", room.users);
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
    room.users[this.id].points = 0;

    if (Object.keys(room.users).length > 1) {
      room.status = "Starting game";
    }
    debug("users object length " + Object.keys(room.users).length);

    callback({
      success: true,
      roomName: room.name,
      users: room.users,
    });

    // broadcast to all users in room that someone connected
    this.broadcast.to(room.id).emit("user:connected", e.username);

    // broadcast list of users in room to all connected sockets EXCEPT ourselves
    this.broadcast.to(room.id).emit("user:list", room.users);

    // broadcast current room status
    io.sockets.in(room.id).emit("room:status", room.status);
  });

  // handle user emitting a new message
  // socket.on('chat:message', handleChatMessage);
};
