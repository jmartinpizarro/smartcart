const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Adjust static file serving for Vercel
const PAGES_ROUTE = path.join(__dirname, "..", "pages");
app.use(express.static(PAGES_ROUTE));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(PAGES_ROUTE, "index.html"));
});

app.get("/carrito", (req, res) => {
  res.sendFile(path.join(PAGES_ROUTE, "carrito.html"));
});

// Web socket connections
io.on("connection", (socket) => {
  console.log("🔌 Cliente conectado:", socket.id);
  socket.on("mensaje", (data) => {
    return;
  });
  socket.on("disconnect", () => {
    console.log("❌ Cliente desconectado:", socket.id);
  });
});

// Export the app for Vercel
module.exports = app;

// Only listen if not in a serverless environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🛒 Carrito: http://localhost:${PORT}/carrito.html`);
  });
}