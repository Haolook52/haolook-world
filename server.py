import os
import json
import sys
import http.server
import socketserver
import threading
import webbrowser
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()
PHOTOS_DIR = BASE_DIR / "photos"
DATA_JSON = BASE_DIR / "data.json"

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.JPG', '.JPEG', '.PNG', '.GIF', '.WEBP', '.BMP'}

def scan_images():
    data = {"series": [], "travel": []}

    series_dir = PHOTOS_DIR / "系列作品"
    if series_dir.exists() and series_dir.is_dir():
        for folder in sorted(series_dir.iterdir()):
            if folder.is_dir():
                images = []
                for f in sorted(folder.iterdir()):
                    if f.is_file() and f.suffix in IMAGE_EXTS:
                        images.append(f.name)
                if images:
                    data["series"].append({
                        "name": folder.name,
                        "folder": str(folder.relative_to(BASE_DIR)).replace("\\", "/"),
                        "images": images
                    })

    travel_dir = PHOTOS_DIR / "旅行风光"
    if travel_dir.exists() and travel_dir.is_dir():
        for f in sorted(travel_dir.iterdir()):
            if f.is_file() and f.suffix in IMAGE_EXTS:
                data["travel"].append(f.name)

    return data

def generate_data_json():
    data = scan_images()
    with open(DATA_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    series_count = len(data["series"])
    series_imgs = sum(len(s["images"]) for s in data["series"])
    travel_imgs = len(data["travel"])
    total = series_imgs + travel_imgs

    print(f"[扫描完成] 系列作品: {series_count} 个文件夹, {series_imgs} 张图片")
    print(f"[扫描完成] 旅行风光: {travel_imgs} 张图片")
    print(f"[扫描完成] 总计: {total} 张图片")
    print(f"[索引文件] 已生成: data.json")

    return data

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def start_server(port=8000):
    if not DATA_JSON.exists():
        generate_data_json()

    Handler = CustomHandler

    with socketserver.TCPServer(("", port), Handler) as httpd:
        url = f"http://localhost:{port}"
        print(f"\n{'='*50}")
        print(f"  Haolook世界 摄影作品集网站已启动")
        print(f"  访问地址: {url}")
        print(f"{'='*50}\n")

        def open_browser():
            import time
            time.sleep(1.5)
            webbrowser.open(url)

        threading.Thread(target=open_browser, daemon=True).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")
            httpd.shutdown()

def scan_only():
    generate_data_json()

if __name__ == "__main__":
    os.chdir(BASE_DIR)

    if len(sys.argv) > 1:
        if sys.argv[1] == "scan":
            scan_only()
        elif sys.argv[1] == "server":
            port = int(sys.argv[2]) if len(sys.argv) > 2 else 8000
            start_server(port)
    else:
        start_server()
