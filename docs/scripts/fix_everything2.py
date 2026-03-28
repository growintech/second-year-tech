import os
import re

root_dir = '/Users/albertofava/Desktop/GIT/second-year-tech'

def run():
    # 1. ensure shared folder exists and copy hack-lab/logo.svg to shared/logo.svg
    os.system(f"mkdir -p {root_dir}/shared")
    os.system(f"cp {root_dir}/hack-lab/logo.svg {root_dir}/shared/logo.svg")
    # Remove other logos
    os.system(f"find {root_dir} -name 'logo.svg' -not -path '*/shared/*' -delete")

    for subdir, dirs, files in os.walk(root_dir):
        for f in files:
            if not f.endswith('.html'): continue
            path = os.path.join(subdir, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
                
            orig = content
            
            # 1. Update inline SVG in root index.html
            if f == 'index.html' and subdir == root_dir:
                m = re.search(r'(<a[^>]*class="[^"]*topbar-logo[^"]*"[^>]*>\s*)<svg.*?</svg>(\s*</a>)', content, re.DOTALL)
                if m:
                    content = content[:m.start()] + m.group(1) + '<img src="./shared/logo.svg" alt="Grow in Tech">' + m.group(2) + content[m.end():]
                    
            # 2. Update logo.svg src
            rel_shared = os.path.relpath(os.path.join(root_dir, 'shared/logo.svg'), subdir)
            if not rel_shared.startswith('.'):
                rel_shared = './' + rel_shared
            # We match 'src="logo.svg"' or 'src="./logo.svg"' or 'src="../../logo.svg"'
            # Let's match any src ending in logo.svg if it's not already pointing to shared
            # Actually, simpler: replace src=".*logo.svg" with src="{rel_shared}"
            # but only for our specific logo references (usually inside <img)
            content = re.sub(r'src="[^"]*logo\.svg"', f'src="{rel_shared}"', content)
            
            # 3. Standardize progress bar CSS classes
            content = content.replace('class="progress-bar-wrap"', 'class="progress-bar"')
            content = content.replace('class="progress-dot', 'class="progress-bar-dot')
            
            # 4. Inject progress bar in hack-lab challenge pages
            if 'hack-lab' in subdir and '-challenge.html' in f:
                if 'class="progress-bar"' not in content:
                    try:
                        num = int(f.split('-')[0])
                        dots = []
                        for i in range(1, 7):
                            if i < num: cls = "progress-bar-dot done"
                            elif i == num: cls = "progress-bar-dot active"
                            else: cls = "progress-bar-dot"
                            dots.append(f'    <div class="{cls}"></div>')
                        
                        pb_html = '<div class="progress-bar">\n' + '\n'.join(dots) + '\n  </div>\n\n  '
                        # insert before <div class="badge-hack">
                        content = content.replace('<div class="badge-hack">', pb_html + '<div class="badge-hack">')
                    except Exception as e:
                        pass
                        
            # 5. Fix page-wrap structure for lesson16 AND lesson15 intro section pages
            if ('lesson16-replitai' in subdir or 'lesson15-bootstrap' in subdir) and '-intro.html' in f:
                idx_head = content.find('<header class="topbar">')
                idx_pw = content.find('<div class="page-wrap">')
                if idx_head != -1 and idx_pw != -1 and idx_head < idx_pw:
                    # Remove the first occurrence of <div class="page-wrap">
                    content = content.replace('<div class="page-wrap">', '', 1)
                    # Insert it right before <header>
                    content = content.replace('<header class="topbar">', '<div class="page-wrap">\n\n  <header class="topbar">', 1)

            if content != orig:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(content)
                print("Updated", path)
                
    print("Done")

if __name__ == '__main__':
    run()
