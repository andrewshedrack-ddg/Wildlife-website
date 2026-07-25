import os
images = ['lion.jpg', 'Eagle.png', 'crocodile.png', 'frog.png', 'fish.png', 'baobab.png', 'mushroom.png', 'bacteria.png', 'virus.png']
for img in images:
    path = os.path.join('assets', 'images', img)
    exists = os.path.exists(path)
    print(f'{img}: {"EXISTS" if exists else "MISSING"}')