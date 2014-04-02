var SerialPort  = require("serialport").SerialPort;
var portName = "/dev/tty.usbmodem1411";
var fs = require("fs");
var url = require("url");
var root = "public";
var http = require("http").createServer(handle);

function handle (req, res) {
  var request = url.parse(req.url, false);
  console.log("Serving request: " + request.pathname);
  var filename = request.pathname;
  
  if(filename == "/") { filename = "/index.html"; }
  filename = root + filename;

  try {
    fs.realpathSync(filename);
  } catch (e) {
    res.writeHead(404);
    res.end();
  }

  var contentType = "text/plain";

  if (filename.match(".js$")) {
    contentType = "text/javascript";
  } else if (filename.match(".html$")) {
    contentType = "text/html";
  }

  fs.readFile(filename, function(err, data) {
    if (err) {
      res.writeHead(500);
      res.end();
      return;
    }
    res.writeHead(200, {"Content-Type": contentType});
    res.write(data);
    res.end();
  }); 
}

http.listen(9090);

console.log("server started on localhost:9090");

var io = require("socket.io").listen(http); // server listens for socket.io communication at port 8000
io.set("log level", 1); // disables debugging. this is optional. you may remove it if desired.

var sp = new SerialPort(portName, {
  baudrate: 9600
}); 

sp.on("close", function (err) {
  console.log("port closed");
});

sp.on("error", function (err) {
  console.error("error", err);
});

sp.on("open", function () {
  console.log("port opened... Press reset on the Arduino.");
});

var arduino = require('duino'),
    board = new arduino.Board();

var led = new arduino.Led({
  board: board,
  pin: 13
});

io.sockets.on("connection", function (socket) {
    socket.on("message", function (msg) {
        console.log(msg);
        led.on();
        setTimeout(function(){
          led.off()
        },2000)
    });

    socket.on("openit", function (msg) {
      led.on();  
      setTimeout(function(){
        led.off()
      },2000)
    })

    socket.on("disconnect", function () {
        console.log("disconnected");
    });
});
