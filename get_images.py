import urllib.request
import re

url = 'https://pedgi.com/pediatric-training.html'
req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8', errors='ignore')
        matches = re.findall(r'<img[^>]+src=[\'"]([^\'">]+)[\'"]', html)
        print("Images found:")
        for m in matches:
            print(m)
except Exception as e:
    print(e)
