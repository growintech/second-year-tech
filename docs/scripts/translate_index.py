import os
import re

file_path = '/Users/albertofava/Desktop/GIT/second-year-tech/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Topbar structural change
old_topbar = """  <header class="topbar">
    <a href="index.html" class="topbar-logo" aria-label="Grow in Tech home">
      <img src="./shared/logo.svg" alt="Grow in Tech" style="height:28px;width:auto;">
    </a>
    <span class="topbar-label">JS · Anno 2</span>
    <div class="topbar-spacer"></div>
    <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()" aria-label="Cambia tema">🌙</button>
  </header>"""

new_topbar = """  <header class="topbar">
    <a href="index.html" class="topbar-logo" aria-label="Grow in Tech home">
      <img src="./shared/logo.svg" alt="Grow in Tech" style="height:28px;width:auto;">
    </a>
    <div class="topbar-spacer"></div>
    <div style="display: flex; align-items: center; gap: 16px;">
      <span class="topbar-label">JS · Year 2</span>
      <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">🌙</button>
    </div>
  </header>"""

if old_topbar in content:
    content = content.replace(old_topbar, new_topbar)
else:
    # Fallback if there are minor whitespace differences
    content = re.sub(r'<span class="topbar-label">JS · Anno 2</span>\s*<div class="topbar-spacer"></div>\s*<button class="theme-toggle" id="theme-toggle" onclick="toggleTheme\(\)" aria-label="Cambia tema">🌙</button>', 
                     '<div class="topbar-spacer"></div>\n    <div style="display: flex; align-items: center; gap: 16px;">\n      <span class="topbar-label">JS · Year 2</span>\n      <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">🌙</button>\n    </div>', content)

# Translations
translations = {
    '<html lang="it">': '<html lang="en">',
    'Lezioni — Grow in Tech · Anno 2': 'Lessons — Grow in Tech · Year 2',
    'Materiali delle lezioni di JavaScript per il secondo anno': 'JavaScript lesson materials for the second year',
    'Materiali delle<br><span class="grad">lezioni</span>': 'Lesson<br><span class="grad">Materials</span>',
    'Secondo anno — JavaScript. Clicca su una lezione per iniziare.': 'Second year — JavaScript. Click on a lesson to start.',
    'Lezioni disponibili': 'Available lessons',
    'prossimamente': 'coming soon',
    'Introduzione a JavaScript': 'Introduction to JavaScript',
    'Tipi di dati e if/else': 'Data types and if/else',
    'Input e numeri random': 'Input and random numbers',
    'Funzioni e condizioni': 'Functions and conditions',
    'Operatori booleani': 'Boolean operators',
    'Slideshow di immagini': 'Image slideshow',
    'Date e countdown': 'Dates and countdown'
}

for it, en in translations.items():
    content = content.replace(it, en)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Updated {file_path}")
