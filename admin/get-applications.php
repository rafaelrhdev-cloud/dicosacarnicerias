<?php
declare(strict_types=1);
require __DIR__ . '/auth.php';
dicosa_require_login(true);

header('Content-Type: application/json; charset=utf-8');

$path = __DIR__ . '/../data/applications.json';
$applications = json_decode((string)@file_get_contents($path), true);
if (!is_array($applications)) {
    $applications = [];
}

// Más recientes primero.
usort($applications, fn($a, $b) => strcmp($b['applied_at'] ?? '', $a['applied_at'] ?? ''));

echo json_encode(['success' => true, 'applications' => $applications]);
