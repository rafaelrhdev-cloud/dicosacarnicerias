<?php
declare(strict_types=1);
require __DIR__ . '/auth.php';
dicosa_require_login(true);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
    exit;
}

$current = (string)($_POST['current_password'] ?? '');
$new = (string)($_POST['new_password'] ?? '');
$confirm = (string)($_POST['confirm_password'] ?? '');

if (strlen($new) < 8) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'La nueva contraseña debe tener al menos 8 caracteres.']);
    exit;
}
if ($new !== $confirm) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Las contraseñas no coinciden.']);
    exit;
}

$credsPath = __DIR__ . '/../data/credentials.php';
$creds = is_file($credsPath) ? include $credsPath : null;

if (!is_array($creds) || !password_verify($current, $creds['password_hash'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'La contraseña actual no es correcta.']);
    exit;
}

$creds['password_hash'] = password_hash($new, PASSWORD_DEFAULT);

$php = "<?php\n"
    . "// Credenciales del panel de administración DICOSA.\n"
    . "// No accedas a este archivo directamente: es .php a propósito para que\n"
    . "// el servidor lo ejecute en vez de mostrarlo como texto.\n"
    . "return " . var_export($creds, true) . ";\n";

$ok = file_put_contents($credsPath, $php, LOCK_EX);

if ($ok === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'No se pudo guardar. Revisa permisos de la carpeta data/.']);
    exit;
}

echo json_encode(['success' => true]);
