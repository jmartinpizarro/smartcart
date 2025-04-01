const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Configuración de archivos estáticos
const PAGES_ROUTE = path.join(__dirname, "..", "pages");
app.use(express.static(PAGES_ROUTE));

// Rutas
app.get("/", (req, res) => {
  res.sendFile(path.join(PAGES_ROUTE, "index.html"));
});

app.get("/carrito", (req, res) => {
  res.sendFile(path.join(PAGES_ROUTE, "carrito.html"));
});

// Conexiones WebSocket
// En server.js, modifica el manejo de mensajes así:
io.on("connection", (socket) => {
  console.log("🔌 Cliente conectado:", socket.id);
  
  // Variable para almacenar el último estado conocido
  let lastKnownList = null;
  
  socket.on("cliente:mensaje", (data) => {
    console.log("📱 Mensaje del cliente:", data);
    
    // Solo reenvía si es un mensaje diferente a la última lista conocida
    if (data.tipo === "lista-compra") {
      if (JSON.stringify(data.items) !== JSON.stringify(lastKnownList)) {
        lastKnownList = data.items;
        io.emit("carrito:mensaje", data);
      }
    } else {
      // Para otros tipos de mensajes, reenvía normalmente
      io.emit("carrito:mensaje", data);
    }
  });
  
  socket.on("carrito:mensaje", (data) => {
    console.log("🛒 Mensaje del carrito:", data);
    
    // Solo reenvía si es un mensaje diferente a la última lista conocida
    if (data.tipo === "lista-compra") {
      if (JSON.stringify(data.items) !== JSON.stringify(lastKnownList)) {
        lastKnownList = data.items;
        io.emit("cliente:mensaje", data);
      }
    } else {
      // Para otros tipos de mensajes, reenvía normalmente
      io.emit("cliente:mensaje", data);
    }
  });
  
  socket.on("disconnect", () => {
    console.log("❌ Cliente desconectado:", socket.id);
  });
});
// Exportar para Vercel (si es necesario)
module.exports = app;

// Iniciar servidor en desarrollo
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📱 Cliente: http://localhost:${PORT}`);
    console.log(`🛒 Carrito: http://localhost:${PORT}/carrito`);
  });
}