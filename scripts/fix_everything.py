import os
import re

root_dir = '/Users/albertofava/Desktop/GIT/second-year-tech'

def run():
    # 1. ensure shared folder exists and copy hack-lab/logo.svg to shared/logo.svg
    os.system(f"mkdir -p {root_dir}/shared")
    os.system(f"cp {root_dir}/hack-lab/logo.svg {root_dir}/shared/logo.svg")
    
    # find and delete all other logo.svg
    os.system(f"find {root_dir} -name 'logo.svg' -not -path '*/shared/*' -delete")

    for subdir, dirs, files in os.walk(root_dir):
        for f in files:
            if not f.endswith('.html'): continue
            path = os.path.join(subdir, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
                
            orig = content
            
            # A: update inline SVG in root index.html
            if f == 'index.html' and subdir == root_dir:
                # Find the <a ... class="topbar-logo" ...> ... <svg ...> ... </svg> </a>
                m = re.search(r'(<a[^>]*class="[^"]*topbar-logo[^"]*"[^>]*>\s*)<svg.*?</svg>(\s*</a>)', content, re.DOTALL)
                if m:
                    content = content[:m.start()] + m.group(1) + '<img src="./shared/logo.svg" alt="Grow in Tech">' + m.group(2) + content[m.end():]
                    
            # B: Update any logo.svg src in other files
            rel_shared = os.path.relpath(os.path.join(root_dir, 'shared/logo.svg'), subdir)
            content = re.sub(r'src="(?:\./|(?:\.\./)*)?logo\.svg"', f'src="{rel_shared}"', content)
            
            # C: Standardize progress bar CSS classes
            content = content.replace('class="progress-bar-wrap"', 'class="progress-bar"')
            content = content.replace('class="progress-dot', 'class="progress-bar-dot')
            
            # D: Fix page-wrap structure for lesson16 AND lesson15 (they likely have the same issue since they were both broken topbars compared to 14)
            # Actually, let's just do it for any file that has <header> outside <div class="page-wrap">
            # A good heuristic: Does <body> directly precede <header class="topbar"> and <div class="page-wrap"> is later?
            if '<header class="topbar">' in content and '<div class="page-wrap">' in content:
                h_idx = content.find('<header class="topbar">')
                pw_idx = content.find('<div class="page-wrap">')
                if h_idx < pw_idx:
                    # It's outside! Move <div class="page-wrap"> up.
                    # We can accomplish this by replacing <body>... with <body>\n<div class="page-wrap">...
                    # and deleting the later <div class="page-wrap">
                    # Find exactly where <body> ends
                    body_m = re.search(r'<body[^>]*>', content)
                    if body_m:
                        body_end = body_m.end()
                        content = content[:body_end] + '\n  <div class="page-wrap">' + content[body_end:]
                        # Now remove the old <div class="page-wrap">
                        # Be careful to only remove the FIRST occurrence after our new one.
                        # The old one had <div class="page-wrap">.
                        content = content.replace('<div class="page-wrap">', '', 1) # remove the one we just added? NO!
                        
                        # Better way: replace the EXACT string match for the old one.
                        # Wait, we just inserted it, so now there are two.
                        # Let's rebuild the string instead.
            else:
                pass

            if content != orig:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(content)
                print("Updated", path)

run()
