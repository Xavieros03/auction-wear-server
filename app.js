// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: ["my-custom-header"],
        credentials: true,
    },
});

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

const indexRoutes = require("./routes/index.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require('./routes/user.routes')
const auctionRoutes = require('./routes/auction.routes')(io);
const productRoutes = require("./routes/product.routes")

app.use("/api", indexRoutes);
app.use('/api/user', userRoutes)
app.use("/api/auctions", auctionRoutes);
app.use('/api/products', productRoutes);
app.use("/api/auth", authRoutes);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = { app, io, server };
