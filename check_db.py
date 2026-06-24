import sqlite3
conn = sqlite3.connect('instance/wildguard.db')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = c.fetchall()
print('Tables:', tables)
for table in tables:
    table_name = table[0]
    print('Table:', table_name)
    c.execute('SELECT * FROM ' + table_name)
    rows = c.fetchall()
    print('Rows:', rows)
conn.close()
