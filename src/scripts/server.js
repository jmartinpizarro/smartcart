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
  res.sendFile(path.join(PAGES_ROUTE, "listacarrito.html"));
});

let listaCompra = [];
let carrito = [];

// Conexiones WebSocket
// En server.js, modifica el manejo de mensajes así:
io.on("connection", (socket) => {
  console.log("🔌 Cliente conectado:", socket.id);
  
  // Variable para almacenar el último estado conocido
  let lastKnownList = null;
  
  // Enviar los datos actuales cuando una interfaz se conecta
  socket.on("solicitarDatos", () => {
    socket.emit("sincronizarDatos", { listaCompra, carrito });
  });

  // Cuando en la interfaz del móvil se añada o retire un nuevo producto
  socket.on("móvil:actualizarListaCompra", (data) => {
    console.log("📜 Lista de compra actualizada:", data);
    //listaCompra = data.items.sort((a, b) => a.localeCompare(b));
    listaCompra = data;
    console.log("Lista:", listaCompra);
    io.emit("sincronizarListaCompra", { listaCompra });
  });

  // Cuando en la interfaz del carrito se añada un nuevo producto
  socket.on("carrito:agregarProducto", (producto) => {
    console.log("🛒 Producto añadido al carrito:", producto.nombre);
    const existeCarrito = carrito.some((p) => p.nombre === producto.nombre);
    if (!existeCarrito) {      
      carrito.push(producto);
      io.emit("sincronizarCarrito", carrito);
      const existeLista = listaCompra.some(
        (p) => p.toLowerCase().trim() === producto.nombre.toLowerCase().trim());
      if(!existeLista) {
        listaCompra.push(producto.nombre);
        io.emit("sincronizarListaCompra", { listaCompra });
      }
    }
  });

  // Cuando en la interfaz del carrito se elimine un producto
  socket.on("carrito:eliminarProducto", (producto) => {
    console.log("🗑 Producto eliminado del carrito:", producto);
    carrito = carrito.filter((p) => p.nombre !== producto.nombre);
    io.emit("sincronizarCarrito", { carrito });
  });

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
    console.log(`🛒 Carrito: http://localhost:${PORT}`);
  });
}