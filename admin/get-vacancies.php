<?php
declare(strict_types=1);
require __DIR__ . '/auth.php';
dicosa_require_login(true);

header('Content-Type: application/json; charset=utf-8');

$path = __DIR__ . '/../data/vacancies.json';
$vacancies = json_decode((string)@file_get_contents($path), true);
if (!is_array($vacancies)) {
    $vacancies = [];
}

// Más recientes primero.
usort($vacancies, fn($a, $b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));

echo json_encode(['success' => true, 'vacancies' => $vacancies]);
