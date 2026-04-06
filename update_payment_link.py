import os
import re

dir_path = r'd:\pedgi'
html_files = [f for f in os.listdir(dir_path) if f.endswith('.html')]

old_url1 = 'href="https://z4.phreesia.net"'
old_url2 = 'href="https://z4.phreesia.net/"'
new_url = 'href="https://z4.phreesia.net/z4/patient/Payment.aspx/Start?encrypted=kP4tiThx8XbIHEfiTrky_raIBSW-xE3nbIGA6bqKdfIkHXh2lmhaDRFsupDCoveQfdXtM1cUlP7JUt3cYntJ7wWnHPzJeWf5fCJUo7tcGgPbYffiBqtK-AtCNLkQWXdM7DY_75vI84sbn25jhDVgbc7gNnkPieb9ZYxrbz69nU81"'

for file in html_files:
    filepath = os.path.join(dir_path, file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if old_url1 in content or old_url2 in content:
        content = content.replace(old_url1, new_url)
        content = content.replace(old_url2, new_url)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file}")
    else:
        print(f"No match found in {file}")
