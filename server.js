const WebSocket = require("ws");
const fs = require("fs");
const JSONStream = require("JSONStream");
const redis = require("redis");
const EventEmitter = require("events");
const { promisify } = require("util");

const redisClient = redis.createClient({db:7});
const asyncBlpop = promisify(redisClient.blpop).bind(redisClient);

class PacketStreamer extends EventEmitter {};

const pktStreamer = new PacketStreamer();

pktStreamer.on("packet", () => {

  asyncBlpop("paket_queue:wlp2s0", 1)
    .then( (data) => {
        if (data) {
          console.log(data);
          streamPacket(data[1]);
        }
      pktStreamer.emit("packet");
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

// No longer used, can delete later
const parseJSON = () => {
  const transformStream = JSONStream.parse("*");
  const inputStream = fs.createReadStream(__dirname + "/pcap-files/small.json");

  inputStream
    .pipe(transformStream)
    .on("data", (data) => {
      let frame_relative_time = parseFloat(
        data._source.layers.frame["frame.time_relative"]
      );

      setTimeout(() => {
        for (let client of socketServer.clients) {
          if (client.active === true) {
            client.send(JSON.stringify(data));
          } else {
            console.log("client not active");
          }
        }
      }, frame_relative_time * 30 * 1000);
    })
    .on("end", () => {
      console.log("JSON Parsing complete");
    });
};

const socketServer = new WebSocket.Server({ port: 3030 });
console.log("listening on 3030");

pktStreamer.emit("packet");

socketServer.on("connection", (socketClient) => {
  console.log("Connected to client");

  socketClient.on("message", (message) => {
    if (message === "start") {
      console.log("Start JSON streaming");
      socketClient.active = true;
    } else if (message === "stop") {
      socketClient.active = false;
    }
  });

  socketClient.on("close", (socketClient) => {
    console.log("Connection closed ");
  });
});
