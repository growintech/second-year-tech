import os
import re

root_dir = '/Users/albertofava/Desktop/GIT/second-year-tech'
root_index = os.path.join(root_dir, 'index.html')

count_modified = 0

for subdir, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(subdir, file)
            
            with open(filepath, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            content = original_content
            rel_path = os.path.relpath(root_index, subdir)
            if rel_path == '.':
                rel_path = './index.html'
                
            is_ide = '-ide' in file.lower()
            
            def replace_a_href(match):
                tag = match.group(0)
                if 'href="' in tag:
                    tag = re.sub(r'href="[^"]*"', f'href="{rel_path}"', tag)
                elif "href='" in tag:
                    tag = re.sub(r"href='[^']*'", f'href="{rel_path}"', tag)
                else:
                    tag = tag.replace('<a ', f'<a href="{rel_path}" ')
                return tag

            new_content = re.sub(r'<a\s+[^>]*class="[^"]*topbar-logo[^"]*"[^>]*>', replace_a_href, content)

            if not is_ide:
                def replace_img(match):
                    a_tag = match.group(1)
                    space1 = match.group(2)
                    img_tag = match.group(3)
                    space2 = match.group(4)
                    
                    img_tag = re.sub(r'\s*style="[^"]*"', '', img_tag)
                    img_tag = re.sub(r"\s*style='[^']*'", '', img_tag)
                    img_tag = img_tag.replace('<img ', '<img style="height:48px;width:auto;" ')
                    
                    return f"{a_tag}{space1}{img_tag}{space2}</a>"
                    
                pattern = r'(<a\s+[^>]*class="[^"]*topbar-logo[^"]*"[^>]*>)(\s*)(<img\s+[^>]*>)(\s*)</a>'
                new_content = re.sub(pattern, replace_img, new_content, flags=re.IGNORECASE)
                
            if new_content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count_modified += 1
                print(f"Modified: {os.path.relpath(filepath, root_dir)}")

print(f"Modified {count_modified} files total.")
