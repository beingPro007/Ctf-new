from flask import Flask, request, render_template_string, g
import sqlite3, os

app = Flask(__name__)
DATABASE = '/tmp/users.db'
FLAG = "CTF{union_select_null_is_my_bestfriend}"

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db

def init_db():
    with app.app_context():
        db = get_db()
        db.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)")
        db.execute("CREATE TABLE IF NOT EXISTS secrets (id INTEGER PRIMARY KEY, secret TEXT)")
        db.execute("INSERT OR IGNORE INTO users VALUES (1, 'admin', 'sup3r_s3cr3t_pw!')")
        db.execute("INSERT OR IGNORE INTO users VALUES (2, 'alice', 'alice1234')")
        db.execute("INSERT OR IGNORE INTO users VALUES (3, 'bob', 'bob5678')")
        db.execute(f"INSERT OR IGNORE INTO secrets VALUES (1, '{FLAG}')")
        db.commit()

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db: db.close()

LOGIN_PAGE = """
<!DOCTYPE html><html><head><title>CorpLogin v1.2</title>
<style>
  body { background: #0d0d0d; color: #00ff66; font-family: monospace; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
  .box { border: 1px solid #00ff66; padding: 40px; min-width: 320px; }
  h1 { text-align: center; font-size: 1.2em; letter-spacing: 3px; }
  input { width: 100%; padding: 8px; margin: 8px 0; background: #111; border: 1px solid #333; color: #00ff66; font-family: monospace; box-sizing: border-box; }
  button { width: 100%; padding: 10px; background: #00ff66; color: #000; border: none; cursor: pointer; font-family: monospace; font-weight: bold; }
  .error { color: #ff4444; margin-top: 10px; }
  .success { color: #00ff66; margin-top: 10px; font-size: 0.9em; word-break: break-all; }
  .hint { color: #555; font-size: 0.75em; margin-top: 20px; text-align: center; }
</style></head><body>
<div class="box">
  <h1>[ CORP LOGIN ]</h1>
  <form method="POST">
    <input name="username" placeholder="Username" value="{{ username }}">
    <input name="password" type="text" placeholder="Password">
    <button type="submit">LOGIN</button>
  </form>
  {% if error %}<div class="error">{{ error }}</div>{% endif %}
  {% if flag %}<div class="success">✓ Authenticated: {{ flag }}</div>{% endif %}
  <div class="hint">Hint: The secrets table exists.</div>
</div></body></html>
"""

@app.route('/', methods=['GET', 'POST'])
def login():
    error, flag, username = None, None, ''
    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')
        db = get_db()
        try:
            # Intentionally vulnerable SQL query
            query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
            cursor = db.execute(query)
            row = cursor.fetchone()
            if row:
                # Also fetch secret if logged in as admin
                secret = db.execute("SELECT secret FROM secrets LIMIT 1").fetchone()
                flag = secret[0] if secret else "No secret found"
            else:
                error = "Invalid credentials."
        except Exception as e:
            error = f"DB Error: {e}"
    return render_template_string(LOGIN_PAGE, error=error, flag=flag, username=username)

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5001, debug=False)
