const socket = io();

const lobbyView = document.querySelector("#lobby");
const gameView = document.querySelector("#game");
const room1Button = document.querySelector("#room1Button");
const usernameForm = document.querySelector("#usernameForm");
const playersList = document.querySelector("#playersList");
const status = document.querySelector("#status");
toggleModal("defaultModal");
let username;

const updateUserList = (users) => {
  playersList.innerHTML = Object.values(users)
    .map(
      (
        usernamee,
        i
      ) => `<li class="text-lg flex items-center justify-between w-full">
<p class="font-bold text-2xl mx-2">#${i + 1}</p>
<div class="flex items-center flex-col -space-y-2">
<p class="font-semibold">${usernamee.username} ${
        usernamee.username === username ? " (you)" : ""
      }</p>
<p class="text-md">Points: ${usernamee.points}</p>
</div>
<i class="fa fa-user-astronaut mx-2 text-2xl ${
        i === 0 ? "text-green-500" : "text-blue-500"
      }"></i>
</li>`
    )
    .join("");
};

usernameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  username = e.target.username.value;
  toggleModal("defaultModal", false);
});

room1Button.addEventListener("click", () => {
  if (!username) {
    toggleModal("defaultModal");
    return;
  }
  console.log(`User ${username} wants to join room room 1`);

  socket.emit("user:joined", { username, roomId: "room1" }, (status) => {
    // we've received acknowledgement from the server
    console.log("Server acknowledged that user joined", status);

    if (status.success) {
      lobbyView.classList.toggle("hidden");
      gameView.classList.toggle("hidden");
      console.log(status.users);

      // update list of users in room
      updateUserList(status.users);
      var audio = new Audio("/assets/sounds/join.ogg");
      audio.play();
      Toastify({
        text: `You joined room ${status.roomName}`,
        duration: 3000,
        destination: "https://github.com/apvarun/toastify-js",
        newWindow: true,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
      }).showToast();
    }
  });
});

socket.on("user:connected", (user) => {
  var audio = new Audio("/assets/sounds/join.ogg");
  audio.play();
  Toastify({
    text: `${user} joined`,
    duration: 3000,
    destination: "https://github.com/apvarun/toastify-js",
    newWindow: true,
    close: true,
    gravity: "top", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)",
    },
  }).showToast();
});

socket.on("user:disconnected", (user) => {
  console.log("user disconnected");
  var audio = new Audio("/assets/sounds/leave.ogg");
  audio.play();
  Toastify({
    text: `${user.username} left`,
    duration: 3000,
    destination: "https://github.com/apvarun/toastify-js",
    newWindow: true,
    close: true,
    gravity: "top", // `top` or `bottom`
    position: "right", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)",
    },
  }).showToast();
});

socket.on("user:list", (users) => {
  updateUserList(users);
});

socket.on("room:status", (roomStatus) => {
  console.log(roomStatus);
  status.innerText = roomStatus;
});

//for demo purposes, to be removed
document.querySelector('#virus').addEventListener("click", () => {
  if (Math.random() >= 0.5 ? 1 : 0) {
    var audio = new Audio("/assets/sounds/win.ogg");
    audio.play();
  } else {
    var audio = new Audio("/assets/sounds/lose.ogg");
    audio.play();
  }
});
