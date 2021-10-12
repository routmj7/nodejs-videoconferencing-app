require("./db/mongoose");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const excel = require("exceljs");
const io = require("socket.io")(server);
const { nanoid } = require("nanoid");
const {
  checkAuthenticated,
  checkNotAuthenticated,
} = require("./middleware/authenticated");
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
const userRouter = require("./routers/users");
const User = require("./models/users");
const Room = require("./models/rollcall");
var dateFormat = require("dateformat");

app.set("view engine", "ejs");
// Defining static path
app.use(express.static("images"));
app.use(express.static("public"));

// Using Body-Parser
app.use(express.json());
app.use("/peerjs", peerServer);

//Using router
app.use(userRouter);
app.use(
  express.urlencoded({
    extended: true,
  })
);


//get method of home page
app.get("/", checkAuthenticated, (req, res) => {
  res.render("index", { roomId: nanoid(9) });
});


//get method of signup page
app.get("/signup", checkNotAuthenticated, (req, res) => {
  res.render("signup");
});


//get method of signin page
app.get("/signin", checkNotAuthenticated, (req, res) => {
  res.render("signin");
});


//get method of meeting room page
app.get("/:roomId", checkAuthenticated, async (req, res) => {
  const roomId = req.params.roomId;
  const userId = req.session.passport.user;
  if (roomId.length === 9) {
    const user = await User.findById(userId);
    const _id = user._id;
    const username = user.username;
    const email = user.email;
    const arrivalTime = dateFormat(new Date());
    const Attendance = Room(roomId);

    if (await Attendance.findById(userId)) {
      Attendance.updateOne(
        { _id: userId },
        { $set: { leaveTime: "have not left yet" } },
        { upsert: false }
      ).catch((err) => {
        console.log(err);
      });
      res.render("room", { roomId: roomId });
    } else {
      const attendance = new Attendance({ _id, username, email, arrivalTime });
      await attendance.save();
      res.render("room", { roomId: roomId });
    }
  } else {
    res.status(401).redirect("/");
  }
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });

    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});


//post method of leave meeting
app.post("/leave", async (req, res) => {
  const userId = req.session.passport.user;
  roomId = req.body.ROOM_ID;
  const attendance = Room(roomId);
  const leaveTime = dateFormat(new Date());

  await attendance
    .updateOne(
      { _id: userId },
      { $set: { leaveTime: leaveTime } },
      { upsert: false }
    )
    .catch((err) => {
      console.log(err);
    });

  res.sendStatus(200);
});


//post method of download button
app.post("/download", async (req, res) => {
  console.log("Download clicked")
  roomId = req.body.ROOM_ID;
  const record = Room(roomId);
  const recordData = await record.find({});

  const workbook = new excel.Workbook();
  const worksheet = workbook.addWorksheet(roomId);
  worksheet.columns = [
    { header: "ID", key: "_id", width: 30 },
    { header: "Name", key: "username", width: 25 },
    { header: "Email", key: "email", width: 20 },
    { header: "Arrival Time", key: "arrivalTime", width: 25 },
    { header: "Leaving Time", key: "leaveTime", width: 20 },
  ];

  worksheet.addRows(recordData);
  workbook.xlsx.writeFile(`${roomId}.xlsx`).then(() => {
    console.log("File Saved.");
  });
  res.sendStatus(200);
});




//Server Listen
let PORT = process.env.PORT || 1234;
server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
