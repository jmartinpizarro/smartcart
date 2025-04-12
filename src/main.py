from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import numpy as np
import torch
import io

app = FastAPI()

# Cargar modelo YOLOv5s preentrenado (detecta 80 clases COCO)
model = torch.load("yolov5s.pt", map_location="cpu")
model.eval()

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

    # Inferencia
    results = model(image)
    detections = results.pandas().xyxy[0]  # dataframe con resultados

    # Filtrar por las clases que queremos
    filtered = detections[detections['name'].isin(target_classes)]

    response = filtered[['name', 'confidence', 'xmin', 'ymin', 'xmax', 'ymax']].to_dict(orient="records")
    return {"detections": response}
