from app import app
import re

with app.test_client() as c:
    rv = c.get('/library/library.html')
    content = rv.data.decode('utf-8')
    # Find all img tags with onerror
    img_tags = re.findall(r'<img[^>]*onerror=[\'"]([^\'"]+)', content)
    for img in img_tags:
        print(f'OnError: {img}')