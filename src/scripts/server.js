const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
const tf = require("@tensorflow/tfjs-node");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

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

const OPENAI_API_KEY = process.env.OPENAI_KEY;
console.log(OPENAI_API_KEY);

app.post("/predict", upload.single("image"), async (req, res) => {
  const filePath = req.file.path;

  try {
    const imageBase64 = fs.readFileSync(filePath, { encoding: "base64" });

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Dime en una sola palabra qué objeto ves en la imagen.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 10,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    fs.unlink(filePath, () => {});
    res.json({ prediccion: response.data.choices[0].message.content.trim() });
  } catch (error) {
    console.error("❌ Error al predecir con OpenAI:", error.response?.data || error.message);
    res.status(500).json({ error: "Fallo en la predicción con OpenAI" });
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
