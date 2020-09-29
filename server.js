const WebSocket = require("ws");
const fs = require("fs");
const JSONStream = require("JSONStream");
const redis = require("redis");
const EventEmitter = require("events");
const { promisify } = require("util");

const  yargs = require("yargs");

let packetQueue;

// First let's set up stuff
//
//
let argv = yargs
  .option('live', {
    describe: 'Start live Capture',
    requiresArg: 'Interface name should be provided with `live`',
  })
  .option('file', {
    describe: 'Get data from a file',
    requiresArg: 'Filename to read data from',
  })
  .conflicts('file', 'live')
  .check((argv, options) => {
    if(!argv.file && !argv.live) {
      throw new Error("Either 'file' or 'live' needs to be specified.")
    }
    if (argv.file) {
      require('fs').accessSync(argv.file, (e) => {
        throw new Error(e.Error);
      });
    }
    if (argv.live) {
      let ifaces = require('os').networkInterfaces();
      if (ifaces[argv.live] === undefined ) {
        throw new Error(`'${argv.live}' is not a valid interface.`);
      }
      packetQueue = `packet_queue:${argv.live}`;
    }
    return true;
  })
  .argv

const redisClient = redis.createClient({db:7});
const asyncBlpop = promisify(redisClient.blpop).bind(redisClient);

class LivePacketStreamer extends EventEmitter {};

const livePacketStream = new LivePacketStreamer();

livePacketStream.on("packet", () => {

  asyncBlpop(packetQueue, 1)
    .then( (data) => {
        if (data) {
          console.log(data);
          streamPacket(data[1]);
        }
      livePacketStream.emit("packet");
    })
    .catch( (error) => {
        console.error(error);
    });
});

const streamPacket = (data) => {
  for (let client of socketServer.clients) {
    if (client.active === true) {
      client.send(data);
    } else {
      console.log("client not active");
    }
  }
};

if (argv.live) {
  livePacketStream.emit("packet");
}

// No longer used, can delete later
const parseJSON = () => {
  const transformStream = JSONStream.parse("*");
  const inputStream = fs.createReadStream(argv.file);

  inputStream
    .pipe(transformStream)
    .on("data", (data) => {
      console.log("1", data);

      let frame_relative_time = parseFloat(
        data.frame.frame_time_relative
      );

      setTimeout(() => {
        for (let client of socketServer.clients) {
          if (client.active === true) {
            client.send(JSON.stringify(data));
          } else {
            console.log("client not active");
          }
        }
      }, frame_relative_time * 10); // Just replay at a slower speed 1/10th
    })
    .on("end", () => {
      console.log("JSON Parsing complete");
    });
};

const socketServer = new WebSocket.Server({ port: 3030 });
console.log("listening on 3030");

socketServer.on("connection", (socketClient) => {
  console.log("Connected to client");

  socketClient.on("message", (message) => {
    if (message === "start") {
      console.log("Start JSON streaming");
      if (argv.file) {
        parseJSON(); // Uncomment this line when you want to test with PCAP
      }
      socketClient.active = true;
    } else if (message === "stop") {
      socketClient.active = false;
    }
  });

  socketClient.on("close", (socketClient) => {
    console.log("Connection closed ");
  });
});
