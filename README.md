# webshark-backend

Backend for streaming pcap data in node.js. Supports live capture.

Note: To actually see live capture, the corresponding ['dissection' App]()
needs to be running.

## Getting Started

Run following commands to start the server

1. `yarn install` to install dependencies from `package.json`
2. `yarn start` to start the server
3. `yarn build` to build the app for productionin `build` folder


## Known Issues

For live capture, the data is picked from a Redis Queue and this is hard-coded
right now. Redis configuration would change later on.

Lot of things are hard-coded right now.
We should create a wrapper server that wraps, Redis and WebSocket Server and
should have it's own Configuration. Eventually likely we are going to need a
lot of 'such' servers to grow with number of clients (but one per Redis
Queue).
