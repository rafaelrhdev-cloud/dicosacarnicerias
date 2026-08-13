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

$id = trim((string)($_POST['id'] ?? ''));
$title = trim((string)($_POST['title'] ?? ''));
$description = trim((string)($_POST['description'] ?? ''));
$active = ($_POST['active'] ?? '1') === '1';

if ($title === '' || strlen($title) > 100) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Escribe un nombre de vacante válido.']);
    exit;
}
if (strlen($description) > 500) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'La descripción es demasiado larga.']);
    exit;
}

$path = __DIR__ . '/../data/vacancies.json';
$vacancies = json_decode((string)@file_get_contents($path), true);
if (!is_array($vacancies)) {
    $vacancies = [];
}

if ($id === '') {
    // Crear vacante nueva.
    $newVacancy = [
        'id' => 'v-' . bin2hex(random_bytes(5)),
        'title' => $title,
        'description' => $description,
        'active' => $active,
        'created_at' => date('Y-m-d H:i:s'),
    ];
    $vacancies[] = $newVacancy;
    $result = $newVacancy;
} else {
    // Actualizar vacante existente.
    $found = false;
    foreach ($vacancies as &$v) {
        if (($v['id'] ?? '') === $id) {
            $v['title'] = $title;
            $v['description'] = $description;
            $v['active'] = $active;
            $found = true;
            $result = $v;
            break;
        }
    }
    unset($v);
    if (!$found) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'No se encontró esa vacante.']);
        exit;
    }
}

$ok = file_put_contents(
    $path,
    json_encode($vacancies, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    LOCK_EX
);

if ($ok === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'No se pudo guardar la vacante.']);
    exit;
}

echo json_encode(['success' => true, 'vacancy' => $result]);
