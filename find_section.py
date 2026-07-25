with open('library/library.html', 'r') as f:
    content = f.read()

idx = content.find('<div class="card-grid"')
if idx >= 0:
    next_idx = content.find('<!-- Scanned Species Section -->', idx)
    with open('debug.txt', 'w') as f:
        f.write(content[idx:next_idx])
    print('Written to debug.txt')