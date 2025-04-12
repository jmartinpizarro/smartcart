const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
const tf = require("@tensorflow/tfjs-node");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
require('dotenv').config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Archivos estáticos
const PAGES_ROUTE = path.join(__dirname, "..", "pages");
app.use(express.static(PAGES_ROUTE));

// Rutas HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(PAGES_ROUTE, "index.html"));
});

app.get("/carrito", (req, res) => {
  res.sendFile(path.join(PAGES_ROUTE, "carrito.html"));
});

// Configuración de Multer para recibir imágenes
const upload = multer({ dest: "uploads/" });

// 🔍 Hugging Face Token (reemplazá esto con el tuyo)
const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;

// Endpoint /predict que usa Hugging Face
app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/detr-resnet-50",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
        },
      }
    );

    // Eliminar imagen temporal
    fs.unlink(filePath, () => {});

    res.json(response.data);
  } catch (error) {
    console.error("❌ Error al hacer la predicción:", error.response?.data || error.message);
    res.status(500).json({ error: "Fallo en la predicción" });
  }
});

// WebSocket
io.on("connection", (socket) => {
  console.log("🔌 Cliente conectado:", socket.id);
  let lastKnownList = null;

  socket.on("cliente:mensaje", (data) => {
    console.log("📱 Mensaje del cliente:", data);
    if (data.tipo === "lista-compra") {
      if (JSON.stringify(data.items) !== JSON.stringify(lastKnownList)) {
        lastKnownList = data.items;
        io.emit("carrito:mensaje", data);
      }
    } else {
      io.emit("carrito:mensaje", data);
    }
  });

  socket.on("carrito:mensaje", (data) => {
    console.log("🛒 Mensaje del carrito:", data);
    if (data.tipo === "lista-compra") {
      if (JSON.stringify(data.items) !== JSON.stringify(lastKnownList)) {
        lastKnownList = data.items;
        io.emit("cliente:mensaje", data);
      }
    } else {
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
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📱 Cliente: http://localhost:${PORT}`);
    console.log(`🛒 Carrito: http://localhost:${PORT}/carrito`);
  });
}
