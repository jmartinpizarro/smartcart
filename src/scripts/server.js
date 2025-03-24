const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Ruta para servir archivos estáticos desde src/pages
const PAGES_ROUTE = path.join(__dirname, "../..", "src", "pages");
app.use(express.static(PAGES_ROUTE));

// Ruta raíz para servir mobile.html
app.get("/", (req, res) => {
  res.sendFile(path.join(PAGES_ROUTE, "index.html"));
});

// Ruta raíz para servir carrito.html
app.get("/carrito", (req, res) => {
  res.sendFile(path.join(PAGES_ROUTE, "carrito.html"));
});

// Web socket connections
io.on("connection", (socket) => {
  console.log("🔌 Cliente conectado:", socket.id);

  socket.on("mensaje", (data) => { // to be updated
    return;
  });

  socket.on("disconnect", () => {
    console.log("❌ Cliente desconectado:", socket.id);
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🛒 Carrito: http://localhost:${PORT}/carrito.html`);
});