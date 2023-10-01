const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
  res.json("Hello")
  console.log("hello")
});

module.exports = router;
