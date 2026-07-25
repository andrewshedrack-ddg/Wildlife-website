from app import app
import re

with app.test_client() as c:
    rv = c.get('/library/library.html')
    print('Status:', rv.status_code)
    content = rv.data.decode('utf-8')
    images = re.findall(r'src=[\'"]([\'"]+)', content)
    for img in images:
        if 'assets/images' in img:
            print(f'Image: {img}')
    if 'site-header' in content:
        print('Header: FOUND')
    else:
        print('Header: MISSING')
    if 'categoryGrid' in content:
        print('categoryGrid: FOUND')
    else:
        print('categoryGrid: MISSING')
    if 'filter-bar' in content:
        print('filter-bar: FOUND')
    else:
        print('filter-bar: MISSING')
    if 'scannedSection' in content:
        print('scannedSection: FOUND')
    else:
        print('scannedSection: MISSING')
    if 'toggleScanned' in content:
        print('toggleScanned: FOUND')