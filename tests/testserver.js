const express = require('express');
const app = express();
const PORT = 3000; // Different port for testing

// Define your app's routes and middleware here

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = { app, server }; // Export both the Express app and the server
