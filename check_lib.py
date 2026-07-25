from app import app
import re

with app.test_client() as c:
    rv = c.get('/library/library.html')
    print('Status:', rv.status_code)
    content = rv.data.decode('utf-8')
    images = re.findall(r'src=[\'"]([^\'"]+)', content)
    for img in images:
        print(f'Image: {img}')
    if 'site-header' in content:
        print('Header: FOUND')
    else:
        print('Header: MISSING')