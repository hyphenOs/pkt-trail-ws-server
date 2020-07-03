const WebSocket = require("ws");
const fs = require("fs");
const JSONStream = require("JSONStream");

var records = [
  { id: 1, name: "Terminator" },
  { id: 2, name: "Predator" },
  { id: 3, name: "True Lies" },
  { id: 4, name: "Running Man" },
  { id: 5, name: "Twins" },
  // .... hundreds of thousands of records ....
];

// let rawData = fs.readFileSync("./data.json");
// let jsonData = JSON.parse(rawData);
// console.log(jsonData);

// let readStream = fs.createReadStream("./user.json")

// readStream.on("data",(chunk)=>{
//   console.log("chunk",chunk,JSON.parse(chunk))
// })

// const transformStream = JSONStream.stringify();
// const outputStream = fs.createWriteStream(__dirname + "temp.json");

// transformStream.pipe(outputStream);

// records.forEach(transformStream.write);

// transformStream.end();

// outputStream.on("finish", () => {
//   console.log("JSON Serialization completed");
// });

let num = 0;

const parseJSON = () => {
  const transformStream = JSONStream.parse("*");
  const inputStream = fs.createReadStream(__dirname + "/pcap-files/small.json");

  inputStream
    .pipe(transformStream)
    .on("data", (data) => {
      console.log("====================================");
      console.log("Data: ", data);
      console.log("time", data._source.layers.frame["frame.time_relative"]);
      let frame_relative_time = parseFloat(
        data._source.layers["frame"]["frame.time_relative"]
      );
      console.log("====================================");
      // console.log(socketServer.clients)
      // console.log(socketServer.clients);
      // console.log(socketServer.clients.size);
      // if (socketServer.clients.size) {
      //   for (socketClient in socketServer.clients) {
      //     socketClient.send(JSON.stringify(data));
      //   }
      // }
      setTimeout(() => {
        for (let client of socketServer.clients) {
          client.send(JSON.stringify(data));
        }
      }, frame_relative_time * 1000 * 10);
    })
    .on("end", () => {
      console.log("JSON Parsing complete");
    });
};

// outputStream.on("finish", parseJSON);

const socketServer = new WebSocket.Server({ port: 3030 });
console.log("listening on ", 3030);

// var countIntervalID = null;
// var streamIntervalID = null;
// let streamTo = new Set();

// console.log("count service started");
// console.log("PCAP stream service started");
// countIntervalID = setInterval(() => incrementCount(), 1 * 1000);

// const incrementCount = () => (num += 1);

// const streamData = (socketClient) => {
//   socketClient.send(JSON.stringify({ count: num }));
// };

// const startStream = (socketClient) =>
//   (streamIntervalID = setInterval(() => streamData(socketClient), 1 * 1000));
// // parseJSON(socketClient);

// const stopStream = () => clearInterval(streamIntervalID);

socketServer.on("connection", (socketClient) => {
  console.log("connected to client:");
  console.log("Total connected clients:", socketServer.clients.size);

  socketClient.on("message", (message) => {
    console.log("Message from client: ", message);
    console.log(message === "start");
    if (message === "start") {
      console.log("starting");
      parseJSON();
    } else {
      console.log("stopping");
    }
  });

  socketClient.on("close", (socketClient) => {
    console.log("Connection closed ");
  });
});

// clearInterval(countIntervalID);
