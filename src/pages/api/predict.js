import { IncomingForm } from "formidable";
import { buffer } from "stream/consumers";

export const config = {
  api: {
    bodyParser: false,
  },
};

const OPENAI_API_KEY = process.env.OPENAI_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const form = new IncomingForm({ maxFileSize: 5 * 1024 * 1024 });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Error al parsear:", err);
      return res.status(500).json({ error: "Error al leer la imagen" });
    }

    const file = files.image?.[0];
    if (!file) {
      return res.status(400).json({ error: "Imagen no recibida" });
    }

    try {
      const imageBuffer = await buffer(file.file);
      const base64Image = imageBuffer.toString("base64");

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Dime en una sola palabra qué objeto ves en la imagen." },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 10,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ OpenAI API Error:", data);
        return res.status(500).json({ error: "Error al procesar con OpenAI", details: data });
      }

      const prediccion = data.choices?.[0]?.message?.content?.trim() || "Desconocido";
      return res.status(200).json({ prediccion });
    } catch (error) {
      console.error("❌ Error general:", error);
      return res.status(500).json({ error: "Error general del servidor" });
    }
  });
}
