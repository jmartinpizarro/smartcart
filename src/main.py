from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import numpy as np
import torch
import io
from ultralytics import YOLO

app = FastAPI()

# Cargar modelo YOLOv5s preentrenado (detecta 80 clases COCO)
model = YOLO("yolov5s.pt")

# Clases objetivo que nos interesan
target_classes = {
    "apple", "tomato", "milk", "orange", "banana", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "sandwich", "chair",
    "dining table", "tv", "cell phone", "laptop", "remote", "keyboard", "toothbrush", 
    "scissors", "book", "vase", "handbag", "suitcase", "backpack", "umbrella", "refrigerator",
    "microwave", "oven", "sink", "toilet", "bed"
}
# Función para convertir imagen en tensor
def load_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return image

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        return JSONResponse(content={"error": "Archivo no es una imagen"}, status_code=400)

    image_bytes = await file.read()
    image = load_image(image_bytes)

    results = model.predict(image)
    detections = results[0].boxes.data.cpu().numpy()
    names = results[0].names

    # Mapear los resultados a un formato legible
    output = []
    for box in detections:
        x1, y1, x2, y2, conf, cls = box
        class_name = names[int(cls)]
        if class_name in target_classes:
            output.append({
                "name": class_name,
                "confidence": float(conf),
                "xmin": float(x1),
                "ymin": float(y1),
                "xmax": float(x2),
                "ymax": float(y2)
            })

    return {"detections": output}

