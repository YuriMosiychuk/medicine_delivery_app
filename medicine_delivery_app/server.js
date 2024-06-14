const express = require("express");
const app = express();
const https = require("https");
const fs = require("fs");
const path = require("path");


const userRoutesPath = path.join(__dirname, "src/routes/shops.js");
const userRoutes = require(userRoutesPath);
app.use("/", userRoutes);

const usershoppingcart = path.join(__dirname, "src/routes/shopping-cart.js");
const usercart = require(usershoppingcart);
app.use("/", usercart);


const userhistory = path.join(__dirname, "src/routes/history.js");
const userhist = require(userhistory);
app.use("/", userhist);


const usercoupons= path.join(__dirname, "src/routes/coupons.js");
const usercoupon = require(usercoupons);
app.use("/", usercoupon);

const options = {
  key: fs.readFileSync("server.key"),
  cert: fs.readFileSync("server.cert"),
};

const viewsDirectoryPath = path.join(__dirname, "src/views");

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", viewsDirectoryPath);
 
app.use(express.static(viewsDirectoryPath));
app.use(express.static(path.resolve("./public")));



app.use((req, res, next) => {
  if (req.hostname === "localhost") {
    res.setHeader("Strict-Transport-Security", "max-age=3600"); // 1 hour
  }
  next();
});

const PORT = process.env.PORT || 3003;

https.createServer(options, app).listen(PORT, () => {
  console.log(`Server running on port ${PORT} 1`);
  console.log(`Open https://localhost:${PORT} in your browser`);
});
