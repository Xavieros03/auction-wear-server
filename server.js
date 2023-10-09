const { app, server } = require("./app"); 


const PORT = process.env.PORT || 5005;

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

module.exports = { app, server };