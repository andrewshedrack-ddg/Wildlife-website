from app import app
import re

with app.test_client() as c:
    rv = c.get('/library/library.html')
    content = rv.data.decode('utf-8')
    images = re.findall(r'src=[\'"]([^\'"]+)', content)
    for img in images:
        if 'assets/images' in img:
            print(f'Image: {img}')