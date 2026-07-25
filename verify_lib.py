from app import app

with app.test_client() as c:
    rv = c.get('/library/library.html')
    content = rv.data.decode('utf-8')
    
    features = [
        ('Real images', ['lion.jpg', 'Eagle.png', 'shark.png']),
        ('Filter bar', ['filter-bar', 'categorySearch', 'statusFilter']),
        ('Collapsible scans', ['scannedSection', 'toggleScanned', 'scannedChevron']),
        ('Scan filters', ['scanSearch', 'scanStatusFilter']),
        ('OnError fallbacks', ['onerror', 'elephant.jpg', 'shark.png', 'frog.png', 'baobab.png', 'mushroom.png', 'bacteria.png', 'virus.png']),
        ('i18n', ['data-i18n']),
        ('Language selector', ['lang-dropdown', 'lang-toggle']),
        ('Collapsible', ['collapsed', 'toggleScanned', 'scannedChevron'])
    ]
    
    for name, checks in features:
        found = all(c in content for c in checks)
        missing = [c for c in checks if c not in content]
        status = 'PASS' if found else 'FAIL'
        if not found:
            print(f'{name}: {status} (missing: {missing})')
        else:
            print(f'{name}: {status}')