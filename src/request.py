import requests

localhost_url = "http://localhost:8000/predict"
url = "https://smartcart-dq9j.onrender.com/predict"
file_path = r"C:\Users\jmart\Downloads\Apple.webp"

with open(file_path, "rb") as f:
    files = {"file": ("fotografia-de-tomates.webp", f, "image/webp")}
    response = requests.post(localhost_url, files=files, timeout=60)

print("Status code:", response.status_code)
print("Response:", response.text)
