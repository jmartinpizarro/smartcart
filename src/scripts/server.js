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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

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

const productosPath = path.join(__dirname, '..', 'data', 'productos.json');
// Base de datos con todos los productos disponibles del supermercado
const productosDisponibles = JSON.parse(fs.readFileSync(productosPath, 'utf8'));

let listaCompra = [];
let carrito = [];
let lastKnownPosition = { x: 30, y: 370 };
let lastKnownItems = {};
// Conexiones WebSocket
// En server.js, modifica el manejo de mensajes así:
io.on("connection", (socket) => {
  console.log("🔌 Cliente conectado:", socket.id);
  
  // Variable para almacenar el último estado conocido
  let lastKnownList = null;
  
  // Enviar los datos actuales cuando la interfaz del movil se conecta
  socket.on("solicitarDatosListaCompra", () => {
    socket.emit("sincronizarListaCompra", { listaCompra });
  });

  // Enviar los datos actuales cuando la interfaz del carrito se conecta
  socket.on("solicitarDatosCarrito", () => {
    socket.emit("sincronizarCarrito", { carrito });
  });

  // Cuando se termine la compra borramos la lista de productos
  socket.on("Compra finalizada", () => {
    carrito = [];
    io.emit("sincronizarCarrito", { carrito });
  });

  // Cuando en la interfaz del móvil se añada o retire un nuevo producto
  socket.on("móvil:actualizarListaCompra", (data) => {
    console.log("📜 Lista de compra actualizada:", data);
    if (Array.isArray(data) && data.length > 0) {
      listaCompra = data.sort((a, b) => a.localeCompare(b));
    } else {
      listaCompra = [];
    }  
    io.emit("sincronizarListaCompra", { listaCompra });
  });

  // Cuando en la interfaz de la camara se añada un nuevo producto
  socket.on("camara:agregarProducto", (nombreProducto) => {
    nombreProductoLimpio = limpiarTexto(nombreProducto);
    console.log("📷 Producto añadido al carrito:", nombreProductoLimpio);
    const existeCarrito = carrito.some((p) => p.nombre === nombreProductoLimpio);
    if (!existeCarrito) {
      const producto = productosDisponibles.find(p => p.nombre.toLowerCase().trim() === nombreProductoLimpio);  
      if (producto) {
        carrito.push(producto);
        console.log("carritoActual:", carrito);
        io.emit("sincronizarCarrito", { carrito });
      }    
    }
    const existeLista = listaCompra.some(
      (p) => p.toLowerCase().trim() === nombreProductoLimpio.toLowerCase().trim());
    if(!existeLista) {
      listaCompra.push(nombreProductoLimpio);
      console.log("listaCompraActual:", listaCompra);
      io.emit("sincronizarListaCompra", { listaCompra });
    }
  });

  function limpiarTexto(texto) {
    return texto.trim().toLowerCase().replace(/[.,!?]/g, '');
  }

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

  socket.on('mapa:solicitarEstado', () => {
    socket.emit('mapa:actualizacion', {
        position: lastKnownPosition || { x: 30, y: 370 },
        items: lastKnownItems || {}
    });
  });

  socket.on('mapa:actualizarPosicion', (position) => {
    lastKnownPosition = position;
    io.emit('mapa:actualizacion', { position });
  });

  socket.on('mapa:actualizarItems', (items) => {
    lastKnownItems = items;
    io.emit('mapa:actualizacion', { items });
  });

  socket.on("cliente:accion", (data) => {
      console.log(`Acción recibida de cliente: ${data.tipo} - ${data.pagina}`);
      if(data.tipo === "volver-menu") {
        io.emit("servidor:volver-menu", {
            pagina: data.pagina
        });
    }
      if(data.tipo === "redireccion") {
          // Enviar a todos los clientes carrito
          io.emit("servidor:redireccion", {
              pagina: data.pagina
          });
      }
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