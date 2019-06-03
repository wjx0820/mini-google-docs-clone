const app = require("express")()
const http = require("http").createServer(app)
const io = require("socket.io")(http)

io.on("connection", function(socket) {
  socket.on("new-operations", function(data) {
    io.emit("new-remote-operations", data)
  })
})

http.listen(4001, function() {
  console.log("listening on *:4001")
})
