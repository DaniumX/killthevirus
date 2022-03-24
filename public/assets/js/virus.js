const socket = io();

const lobbyView = document.querySelector("#lobby");
const board = document.querySelector("#board");
const gameView = document.querySelector("#game");
const room1Button = document.querySelector("#room1Button");
const usernameForm = document.querySelector("#usernameForm");
const playersList = document.querySelector("#playersList");
const status = document.querySelector("#status");
const round = document.querySelector("#round");
const roomsWrapper = document.querySelector("#roomsWrapper");
toggleModal("defaultModal");
let username;
let rooms;
let joinedRoom = null;

var totalSeconds = 0;
function countTimer() {
  ++totalSeconds;
  var hour = Math.floor(totalSeconds / 3600);
  var minute = Math.floor((totalSeconds - hour * 3600) / 60);
  var seconds = totalSeconds - (hour * 3600 + minute * 60);
  if (hour < 10) hour = "0" + hour;
  if (minute < 10) minute = "0" + minute;
  if (seconds < 10) seconds = "0" + seconds;
  document.getElementById("timer").innerHTML =
    hour + ":" + minute + ":" + seconds;
}

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
<p class="text-md">Points: ${usernamee.score}</p>
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

socket.on("rooms:status", (roomss) => {
  rooms = roomss;
  console.log("rooms changed", rooms);
  let roomElements = roomss.map((room) => {
    return `
      <div
          class="bg-white shadow-lg rounded-lg w-3/12 flex items-center justify-between"
        >
          <p class="mx-6">${room.name}</p>
          <p class="mr-10">(${Object.keys(room.users).length}/2)</p>
          <i
            id="${room.id}Button"
            class="fa fa-play ${
              Object.keys(room.users).length < 2
                ? "text-blue-400 cursor-pointer"
                : "text-gray-400"
            } mx-6 "
          ></i>
        </div>
        `;
  });
  roomsWrapper.innerHTML = roomElements.join("");
});

roomsWrapper.addEventListener("DOMSubtreeModified", () => {
  rooms.forEach((room) => {
    let roomButton = document.querySelector(`#${room.id}Button`);
    if (!roomButton || Object.keys(room.users).length > 1) return;
    roomButton.addEventListener("click", () => {
      if (!username) {
        toggleModal("defaultModal");
        return;
      }
      console.log(`User ${username} wants to join room room 1`);

      socket.emit("user:joined", { username, roomId: room.id }, (status) => {
        // we've received acknowledgement from the server
        console.log("Server acknowledged that user joined", status);

        if (status.success) {
          console.log(status);
          joinedRoom = status.id;
          lobbyView.classList.toggle("hidden");
          gameView.classList.toggle("hidden");

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
  status.innerText = roomStatus;
});

//for demo purposes, to be removed
// document.querySelector("#virus").addEventListener("click", () => {
//   if (Math.random() >= 0.5 ? 1 : 0) {
//     var audio = new Audio("/assets/sounds/win.ogg");
//     audio.play();
//   } else {
//     var audio = new Audio("/assets/sounds/lose.ogg");
//     audio.play();
//   }
// });

socket.on("virus:location", (location) => {
  // countTimer();
  let start = new Date();
  var now = new Date();
  let timerVar = setInterval(() => {
    now = new Date();
    document.getElementById("timer").innerHTML =
      now.getTime() - start.getTime() + " ms";
  }, 10);
  let stop;
  console.log("virus:location event received");
  console.log(location);
  board.innerHTML = `
  <img
            src="./assets/images/virus.png"
            id="virus"
            width="50"
            class="absolute animate-pulse top-${location[1]} right-${location[0]}"
            alt=""
      />
  `;
  document.querySelector("#virus").addEventListener("click", () => {
    stop = new Date();
    let reactionTime = stop - start;
    clearInterval(timerVar);
    document.getElementById("timer").innerHTML = reactionTime + " ms";
    console.log("reaction time was", reactionTime);
    console.log(joinedRoom);
    socket.emit(
      "virus:clicked",
      { username, roomId: joinedRoom, reactionTime },
      (status) => {
        console.log(status);
        if (status.won) {
          var audio = new Audio("/assets/sounds/win.ogg");
          audio.play();
        } else {
          var audio = new Audio("/assets/sounds/lose.ogg");
          audio.play();
        }
        setTimeout(() => {
          document.getElementById("timer").innerHTML = "0 ms";
        }, 2000);
        document.querySelector("#virus").remove();
      }
    );
  });
});

socket.on("game:logs", (log) => {
  let logElement = document.createElement("span");
  logElement.innerText = log;
  logElement.className = "font-medium text-sm text-gray-400 text-center";
  document.querySelector("#logs").appendChild(logElement);
});

socket.on("game:round", (gameRound) => {
  round.innerText = gameRound;
});
