import sys
import json
from ultralytics import YOLO
from PIL import Image

# Recibe imagen como argumento
image_path = sys.argv[1]
model = YOLO("yolov5s.pt")
results = model.predict(Image.open(image_path))

detections = []
for box in results[0].boxes.data.cpu().numpy():
    x1, y1, x2, y2, conf, cls = box
    detections.append({
        "name": results[0].names[int(cls)],
        "confidence": float(conf),
        "xmin": float(x1),
        "ymin": float(y1),
        "xmax": float(x2),
        "ymax": float(y2),
    })

print(json.dumps(detections))
