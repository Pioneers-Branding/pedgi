import urllib.request
import re
import os

url = 'https://pedgi.com/pediatric-training.html'
req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0'
})

os.makedirs('d:/pedgi/images', exist_ok=True)

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8', errors='ignore')
        matches = re.findall(r'<img[^>]+src=[\'"]([^\'">]+)[\'"]', html)
        
        idx = 1
        for m in matches:
            if 'matrix/servlet' in m:
                full_url = 'https://pedgi.com' + m
                path = f'd:/pedgi/images/doc_{idx}.jpg'
                print(f'Downloading {full_url} to {path}')
                try:
                    req_img = urllib.request.Request(full_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req_img) as img_res, open(path, 'wb') as f:
                        f.write(img_res.read())
                    print(f'Success {path}')
                except Exception as e:
                    print(f'Failed {path}: {e}')
                idx += 1
except Exception as e:
    print('Failed to fetch html:', e)
