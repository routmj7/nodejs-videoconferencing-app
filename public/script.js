const socket = io("/");

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "1234",
});

let myVideoStream;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      console.log("User connected: ", userId);
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  console.log("user disconnected", userId);
  if (peers[userId]) peers[userId].close();
});
peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = call;
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });

  videoGrid.append(video);
};

let text = $("#chat_message");
$("html").keydown((e) => {
  if (e.which == 13 && text.val().length !== 0) {
    console.log(`gettting from client: ${text.val()}`);
    socket.emit("message", text.val());
    text.val("");
  }
});

socket.on("createMessage", (message) => {
  console.log(`${message} form server`);
  $("ul").append(`<li class="message"><b>user</b>: ${message}</li>`);
});

const scrollToButtom = () => {
  let d = $(".main__chat_window");
  d.scrollTop(d.prop("scrollHeight"));
};

//mute or unmute video
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    setStopVideo();
  }
};

const setPlayVideo = () => {
  const html = `
    <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

const download = document.getElementById("download");
download.addEventListener("click", () => {
  fetch("/download", {
    method: "POST",
    body: JSON.stringify({ ROOM_ID }),
    headers: { "content-type": "application/json" },
  })
    .then((response) => {
      if (response.ok) {
        console.log("Your file is downloaded.");
        return;
      }
      throw new Error("Request failed");
    })
    .catch((error) => {
      console.log("Record Error: ", error);
    });
});

const leave = document.getElementById("leave");
leave.addEventListener("click", () => {
  fetch("/leave", {
    method: "POST",
    body: JSON.stringify({ ROOM_ID }),
    headers: { "content-type": "application/json" },
  })
    .then((response) => {
      if (response.ok) {
        location.assign("/index");
        return;
      }
      throw new Error("Can't leave meeting. ");
    })
    .catch((error) => {
      console.log("Leave Error: ", error);
    });
});
