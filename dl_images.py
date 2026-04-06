import urllib.request
import os

urls = [
    ('https://pedgi.com/matrix/servlet/ShowAsset?id=141635622', 'd:/pedgi/images/dr-narwal.jpg'),
    ('https://pedgi.com/matrix/servlet/ShowAsset?id=141081808', 'd:/pedgi/images/dr-cuenca.jpg'),
    ('https://pedgi.com/matrix/servlet/ShowAsset?id=135769432', 'd:/pedgi/images/pedgi_office.jpg')
]

req_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
}

os.makedirs('d:/pedgi/images', exist_ok=True)

for url, path in urls:
    try:
        req = urllib.request.Request(url, headers=req_headers)
        with urllib.request.urlopen(req) as response, open(path, 'wb') as f:
            f.write(response.read())
        print('Downloaded', path)
    except Exception as e:
        print('Failed', path, e)
