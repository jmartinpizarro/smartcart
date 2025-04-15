const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const { OpenAI } = require("openai");
const multer = require("multer");
require("dotenv").config();

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

const upload = multer({ dest: "uploads/" });

/*const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});*/

app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString("base64");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${req.file.mimetype};base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: "Describe con una sola o pocas palabras lo que ves. Sé conciso. De ser un producto de supermercado, responde con un nombre único (manzanas, platanos, brick de leche...)",
            },
          ],
        },
      ],
    });

    const result = response.choices[0].message.content;
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al procesar la imagen" });
  } finally {
    fs.unlinkSync(req.file.path); // Borra la imagen temporal
  }
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
    listaCompra = data.sort((a, b) => a.localeCompare(b));
    io.emit("sincronizarListaCompra", { listaCompra });
  });

  // Cuando en la interfaz del carrito se añada un nuevo producto
  socket.on("carrito:agregarProducto", (producto) => {
    console.log("🛒 Producto añadido al carrito:", producto.nombre);
    const existeCarrito = carrito.some((p) => p.nombre === producto.nombre);
    if (!existeCarrito) {      
      carrito.push(producto);
      console.log("carritoActual:", carrito);
      io.emit("sincronizarCarrito", carrito);
    }
    const existeLista = listaCompra.some(
      (p) => p.toLowerCase().trim() === producto.nombre.toLowerCase().trim());
    if(!existeLista) {
      listaCompra.push(producto.nombre);
      console.log("listaCompraActual:", listaCompra);
      io.emit("sincronizarListaCompra", { listaCompra });
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

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📱 Cliente: http://localhost:${PORT}`);
  console.log(`🛒 Carrito: http://localhost:${PORT}/carrito`);
});