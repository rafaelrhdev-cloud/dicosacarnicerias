<?php
// auth.php — se incluye al inicio de cada página o endpoint que requiere
// haber iniciado sesión en el panel. Si no hay sesión activa, corta el
// acceso (redirige a páginas HTML, o responde 401 JSON a endpoints AJAX).

declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start([
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
    ]);
}

function dicosa_require_login(bool $isJsonEndpoint = false): void
{
    if (empty($_SESSION['dicosa_admin'])) {
        if ($isJsonEndpoint) {
            http_response_code(401);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'No has iniciado sesión.']);
        } else {
            header('Location: login.php');
        }
        exit;
    }
}
