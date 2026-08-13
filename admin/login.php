<?php
declare(strict_types=1);
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start(['cookie_httponly' => true, 'cookie_samesite' => 'Lax']);
}

// Si ya inició sesión, mándalo directo al panel.
if (!empty($_SESSION['dicosa_admin'])) {
    header('Location: dashboard.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = (string)($_POST['password'] ?? '');

    $credsPath = __DIR__ . '/../data/credentials.php';
    $creds = is_file($credsPath) ? include $credsPath : null;

    if (
        is_array($creds)
        && hash_equals($creds['username'], $username)
        && password_verify($password, $creds['password_hash'])
    ) {
        session_regenerate_id(true);
        $_SESSION['dicosa_admin'] = true;
        header('Location: dashboard.php');
        exit;
    }

    // Frena un poco los intentos automatizados sin bloquear la UX real.
    sleep(1);
    $error = 'Usuario o contraseña incorrectos.';
}
?>
<!DOCTYPE html>
<html lang="es-MX">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Iniciar sesión — Panel DICOSA</title>
<link rel="icon" type="image/png" href="../assets/logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="admin.css">
</head>
<body class="login-body">

<div class="login-card">
  <img src="../assets/logo.png" alt="DICOSA" class="login-logo">
  <h1>Panel DICOSA</h1>
  <p class="login-sub">Inicia sesión para editar tu página</p>

  <?php if ($error): ?>
    <div class="alert alert-error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
  <?php endif; ?>

  <form method="POST" class="login-form">
    <label>
      <span>Usuario</span>
      <input type="text" name="username" autocomplete="username" required autofocus>
    </label>
    <label>
      <span>Contraseña</span>
      <input type="password" name="password" autocomplete="current-password" required>
    </label>
    <button type="submit" class="btn-login">Entrar</button>
  </form>
</div>

</body>
</html>
