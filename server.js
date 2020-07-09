const WebSocket = require("ws");
const fs = require("fs");
const JSONStream = require("JSONStream");

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
          client.send(JSON.stringify(data));
        }
      }, frame_relative_time * 10 * 1000);
    })
    .on("end", () => {
      console.log("JSON Parsing complete");
    });
};

const socketServer = new WebSocket.Server({ port: 3030 });
console.log("listening on 3030");

socketServer.on("connection", (socketClient) => {
  console.log("Connected to client");
  console.log("Total connected clients:", socketServer.clients.size);

  socketClient.on("message", (message) => {
    console.log("Message from client: ", message);
    if (message === "start") {
      console.log("Start JSON streaming");
      parseJSON();
    } else {
      console.log("Stop JSON streaming (not implemented yet)");
    }
  });

  socketClient.on("close", (socketClient) => {
    console.log("Connection closed ");
  });
});
