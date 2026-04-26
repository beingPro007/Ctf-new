const express = require('express')
const { exec } = require('child_process')
const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const PAGE = `
<!DOCTYPE html><html><head><title>NetDiag Tool</title>
<style>
  body{background:#0d0d0d;color:#e0e0e0;font-family:monospace;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
  .box{border:1px solid #333;padding:40px;min-width:480px;max-width:600px}
  h1{color:#ffa500;letter-spacing:2px;font-size:1.1em}
  input[name=host]{width:100%;padding:8px;background:#111;border:1px solid #333;color:#ffa500;font-family:monospace;box-sizing:border-box}
  button{padding:8px 20px;background:#ffa500;color:#000;border:none;cursor:pointer;font-family:monospace;font-weight:bold;margin-top:8px}
  pre{background:#111;border:1px solid #222;padding:15px;white-space:pre-wrap;word-break:break-all;color:#00ff66;max-height:300px;overflow:auto;margin-top:15px}
  .hint{color:#444;font-size:0.75em;margin-top:20px}
</style></head><body>
<div class="box">
  <h1>[ NETWORK DIAGNOSTICS ]</h1>
  <p style="color:#666;font-size:0.85em">Enter a hostname or IP to ping</p>
  <form method="POST" action="/ping">
    <input name="host" placeholder="e.g. 8.8.8.8" autocomplete="off">
    <br><button type="submit">▶ Run Ping</button>
  </form>
  <div id="output"></div>
  <div class="hint">Tip: This tool uses the system's ping binary directly.</div>
</div>
</body></html>`

app.get('/', (req, res) => res.send(PAGE))

app.post('/ping', (req, res) => {
    const host = req.body.host || ''
    if (!host) return res.send(PAGE)

    // Intentionally vulnerable - no sanitization!
    const cmd = `ping -c 3 ${host}`

    exec(cmd, { timeout: 10000 }, (err, stdout, stderr) => {
        const output = stdout || stderr || (err ? err.message : '')
        res.send(`
            ${PAGE}
            <script>
            document.getElementById('output').innerHTML = '<pre>$ ${cmd.replace(/</g, '&lt;')}\n${output.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>';
            </script>
        `)
    })
})

app.listen(5003, () => console.log('NetDiag listening on :5003'))
