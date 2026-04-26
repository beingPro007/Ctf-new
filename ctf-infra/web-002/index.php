<?php
// Intentionally vulnerable LFI
$page = isset($_GET['page']) ? $_GET['page'] : 'home';
// No sanitization - vulnerable to path traversal!
$file = "pages/" . $page . ".html";
?>
<!DOCTYPE html>
<html>
<head>
<title>TechBlog v0.9 - BETA</title>
<style>
  body { background: #0a0a0a; color: #e0e0e0; font-family: monospace; max-width: 800px; margin: 40px auto; padding: 20px; }
  nav a { color: #39a0ff; margin-right: 15px; text-decoration: none; }
  nav a:hover { text-decoration: underline; }
  .content { border: 1px solid #222; padding: 20px; margin-top: 20px; background: #0f0f0f; }
  .url-bar { background: #111; border: 1px solid #333; padding: 8px; color: #888; font-size: 0.85em; margin-bottom: 10px; word-break: break-all; }
  h1 { color: #39a0ff; }
  .hint { color: #444; font-size: 0.8em; margin-top: 30px; }
</style>
</head>
<body>
<h1>[TechBlog]</h1>
<nav>
  <a href="?page=home">Home</a>
  <a href="?page=about">About</a>
  <a href="?page=contact">Contact</a>
</nav>
<div class="url-bar">GET /index.php?page=<?php echo htmlspecialchars($page); ?></div>
<div class="content">
<?php
if (file_exists($file)) {
    include($file);
} else {
    // Vulnerable: directly includes user-controlled path
    @include($page);
    if (!file_exists($page)) {
        echo "<p style='color:#ff4444'>Error: Page '{$page}' not found.</p>";
    }
}
?>
</div>
<div class="hint">Tip: The server stores sensitive configs in /etc/passwd and flags in /var/www/html/secret/flag.txt</div>
</body>
</html>
