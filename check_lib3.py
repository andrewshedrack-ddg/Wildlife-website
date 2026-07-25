from app import app

with app.test_client() as c:
    rv = c.get('/library/library.html')
    content = rv.data.decode('utf-8')
    checks = [
        'viewBox="0 0 4 3"',
        'viewBox="0 0 3 2"',
        'flag-icon',
        'lang-native',
        'lang-dropdown',
        'lang-toggle',
        'lang-option',
        'aria-expanded',
        'aria-haspopup',
        'aria-controls',
        'toggleScannedSection',
        'scannedChevron',
        'collapsed',
        'scanned-content',
        'toggleScanned'
    ]
    for check in checks:
        if check in content:
            print(f'FOUND: {check}')
        else:
            print(f'MISSING: {check}')