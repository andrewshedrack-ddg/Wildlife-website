#!/usr/bin/env python3
import sys

with open('css/style.css', 'r') as f:
    css = f.read()

# Fix the typo
css = css.replace('border: 1px solid rgba{item}^{\\\\sigma}lalpha(255,255,255,0.2);', 'border: 1px solid rgba(255,255,255,0.2);')

with open('css/style.css', 'w') as f:
    f.write(css)

print('Fixed typo in CSS')
