import os
import re

dir_path = r'd:\pedgi'
html_files = [f for f in os.listdir(dir_path) if f.endswith('.html')]

pattern = r'(<a[^>]*class="navbar-brand[^"]*"[^>]*>)\s*<div class="logo-icon">[\s\S]*?</div>\s*<div>[\s\S]*?</div>\s*</a>'
replacement = r'\1\n        <img src="images/pedgi-logo.png" alt="PEDGI Logo" style="max-height:65px; width:auto;">\n      </a>'

for file in html_files:
    filepath = os.path.join(dir_path, file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content, count = re.subn(pattern, replacement, content)
    if count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file} - {count} replacements")
    elif 'pedgi-logo.png' not in content:
        print(f"No match found in {file}")
