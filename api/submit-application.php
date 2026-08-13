<?php
declare(strict_types=1);

// Este endpoint recibe el formulario de bolsa de trabajo mediante un envío
// NATIVO de HTML (sin JavaScript/fetch de por medio) — por eso responde con
// una redirección de vuelta a la página, no con JSON. Así el navegador
// maneja todo el envío directamente, sin nada que pueda interceptarlo.

function volverConError(string $msg): void
{
    header('Location: ../index.html?empleo_error=' . urlencode($msg) . '#empleo');
    exit;
}

function volverConExito(): void
{
    header('Location: ../index.html?empleo_ok=1#empleo');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../index.html#empleo');
    exit;
}

// Honeypot: si este campo invisible viene lleno, es un bot. Lo mandamos de
// vuelta como si hubiera funcionado, pero no guardamos nada.
if (!empty($_POST['campo_extra_no_llenar'])) {
    volverConExito();
}

$name = trim((string)($_POST['name'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$position = trim((string)($_POST['position'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));

if ($name === '' || strlen($name) > 120) {
    volverConError('El nombre no es válido.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    volverConError('El correo no es válido.');
}
if (!preg_match('/^[\d\s\-\+\(\)]{7,20}$/', $phone)) {
    volverConError('El teléfono no es válido.');
}
if ($position === '' || strlen($position) > 80) {
    volverConError('Selecciona un puesto de interés.');
}
if (strlen($message) > 2000) {
    volverConError('El mensaje es demasiado largo.');
}

if (empty($_FILES['cv']) || $_FILES['cv']['error'] !== UPLOAD_ERR_OK) {
    volverConError('No se recibió el CV. Adjunta un archivo PDF.');
}

$cv = $_FILES['cv'];

if ($cv['size'] > 5 * 1024 * 1024) {
    volverConError('El archivo pesa demasiado (máximo 5MB).');
}

$originalName = $cv['name'];
$ext = strtolower((string)pathinfo($originalName, PATHINFO_EXTENSION));
$allowedExt = ['pdf'];
if (!in_array($ext, $allowedExt, true)) {
    volverConError('Formato no permitido. Solo se aceptan archivos PDF.');
}

// Verifica el tipo real del archivo, no solo su extensión.
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$realMime = finfo_file($finfo, $cv['tmp_name']);
finfo_close($finfo);

$allowedMime = ['application/pdf'];
if (!in_array($realMime, $allowedMime, true)) {
    volverConError('El archivo no parece ser un PDF válido.');
}

$id = date('Ymd-His') . '-' . bin2hex(random_bytes(4));

$uploadsDir = __DIR__ . '/../data/cv-uploads/';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

$storedFilename = $id . '.' . $ext;
$destPath = $uploadsDir . $storedFilename;

if (!move_uploaded_file($cv['tmp_name'], $destPath)) {
    volverConError('No se pudo guardar el archivo. Intenta de nuevo.');
}

$applicationsPath = __DIR__ . '/../data/applications.json';
$applications = json_decode((string)@file_get_contents($applicationsPath), true);
if (!is_array($applications)) {
    $applications = [];
}

$applications[] = [
    'id' => $id,
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'position' => $position,
    'message' => $message,
    'cv_filename' => $storedFilename,
    'cv_original_name' => $originalName,
    'status' => 'recibido',
    'notes' => '',
    'applied_at' => date('Y-m-d H:i:s'),
];

$ok = file_put_contents(
    $applicationsPath,
    json_encode($applications, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    LOCK_EX
);

if ($ok === false) {
    volverConError('No se pudo registrar tu solicitud. Intenta de nuevo.');
}

volverConExito();
