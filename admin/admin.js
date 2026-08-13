// ===== Toast =====
const toast = document.getElementById('toast');
let toastTimer = null;
function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// ===== Sidebar panel switching =====
const sideLinks = document.querySelectorAll('.side-link');
const panels = document.querySelectorAll('.panel');
sideLinks.forEach(link => {
  link.addEventListener('click', () => {
    sideLinks.forEach(l => l.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    link.classList.add('active');
    document.getElementById(link.dataset.panel).classList.add('active');
  });
});

// ===== Guardar contacto =====
const formContacto = document.getElementById('formContacto');
const contactoStatus = document.getElementById('contactoStatus');

formContacto.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = formContacto.querySelector('.btn-save');
  btn.disabled = true;
  btn.textContent = 'Guardando...';
  contactoStatus.classList.remove('show', 'error');

  try {
    const res = await fetch('save-contact.php', {
      method: 'POST',
      body: new FormData(formContacto),
    });
    const json = await res.json();

    if (json.success) {
      contactoStatus.textContent = 'Guardado ✓';
      contactoStatus.classList.add('show');
      showToast('Los cambios ya están publicados en la página.');
    } else {
      throw new Error(json.error || 'No se pudo guardar.');
    }
  } catch (err) {
    contactoStatus.textContent = 'Error al guardar';
    contactoStatus.classList.add('show', 'error');
    showToast(err.message || 'Ocurrió un error al guardar.', true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar cambios';
  }
});

// ===== Galería: subir fotos =====
document.querySelectorAll('.upload-input').forEach(input => {
  input.addEventListener('change', () => {
    if (input.files && input.files[0]) {
      uploadPhoto(input.dataset.slot, input.files[0]);
    }
  });
});

async function uploadPhoto(slot, file) {
  const preview = document.getElementById(`preview-${slot}`);
  const hint = document.getElementById(`hint-${slot}`);
  const progress = document.getElementById(`progress-${slot}`);

  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
    showToast('Solo se permiten imágenes JPG, PNG o WEBP.', true);
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    showToast('La imagen pesa demasiado (máximo 8MB).', true);
    return;
  }

  // Vista previa local instantánea, antes de que termine de subir.
  const localUrl = URL.createObjectURL(file);
  preview.style.backgroundImage = `url('${localUrl}')`;
  preview.classList.remove('empty');
  preview.innerHTML = '';
  hint.textContent = 'Subiendo...';
  progress.style.width = '30%';

  const formData = new FormData();
  formData.append('slot', slot);
  formData.append('photo', file);

  try {
    const res = await fetch('upload-photo.php', { method: 'POST', body: formData });
    const json = await res.json();
    progress.style.width = '100%';

    if (json.success) {
      preview.style.backgroundImage = `url('${json.url}')`;
      hint.textContent = 'Foto cargada';
      showToast('Foto actualizada en la galería.');
    } else {
      throw new Error(json.error || 'No se pudo subir la foto.');
    }
  } catch (err) {
    hint.textContent = 'Error al subir';
    showToast(err.message || 'Ocurrió un error al subir la foto.', true);
  } finally {
    setTimeout(() => { progress.style.width = '0%'; }, 500);
  }
}

// Drag & drop sobre cada tile
document.querySelectorAll('.upload-tile').forEach(tile => {
  const slot = tile.dataset.slot;
  ['dragenter', 'dragover'].forEach(evt =>
    tile.addEventListener(evt, (e) => { e.preventDefault(); tile.classList.add('dragover'); })
  );
  ['dragleave', 'drop'].forEach(evt =>
    tile.addEventListener(evt, (e) => { e.preventDefault(); tile.classList.remove('dragover'); })
  );
  tile.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) uploadPhoto(slot, file);
  });
});

// ===== Bolsa de trabajo =====
const candidatosGrid = document.getElementById('candidatosGrid');
const empleoEmptyMsg = document.getElementById('empleoEmptyMsg');
const empleoTabs = document.getElementById('empleoTabs');
const btnRefreshEmpleo = document.getElementById('btnRefreshEmpleo');
const sideBadgeEmpleo = document.getElementById('sideBadgeEmpleo');

let allApplications = [];
let currentFilter = 'todos';

const STATUS_LABELS = {
  recibido: 'Recibido',
  agendado: 'Agendado',
  rechazado: 'Rechazado',
  contratado: 'Contratado',
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function renderCandidatos() {
  const filtered = currentFilter === 'todos'
    ? allApplications
    : allApplications.filter(a => a.status === currentFilter);

  // Contadores
  document.getElementById('count-todos').textContent = allApplications.length;
  ['recibido', 'agendado', 'rechazado', 'contratado'].forEach(s => {
    document.getElementById(`count-${s}`).textContent = allApplications.filter(a => a.status === s).length;
  });

  const nuevos = allApplications.filter(a => a.status === 'recibido').length;
  if (nuevos > 0) {
    sideBadgeEmpleo.textContent = nuevos;
    sideBadgeEmpleo.hidden = false;
  } else {
    sideBadgeEmpleo.hidden = true;
  }

  if (filtered.length === 0) {
    candidatosGrid.innerHTML = '';
    empleoEmptyMsg.textContent = allApplications.length === 0
      ? 'Todavía no hay candidatos. En cuanto alguien envíe su CV desde la página, va a aparecer aquí.'
      : 'No hay candidatos con este estado.';
    candidatosGrid.appendChild(empleoEmptyMsg);
    return;
  }

  candidatosGrid.innerHTML = filtered.map(app => {
    const date = new Date(app.applied_at.replace(' ', 'T'));
    const dateStr = isNaN(date) ? app.applied_at : date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    return `
      <div class="candidato-card" data-id="${escapeHtml(app.id)}">
        <div class="candidato-main">
          <div class="candidato-top">
            <span class="candidato-name">${escapeHtml(app.name)}</span>
            <span class="status-pill status-${app.status}">${STATUS_LABELS[app.status] || app.status}</span>
          </div>
          <div class="candidato-position">${escapeHtml(app.position)}</div>
          <div class="candidato-meta">
            <a href="tel:${escapeHtml(app.phone)}">${escapeHtml(app.phone)}</a>
            <a href="mailto:${escapeHtml(app.email)}">${escapeHtml(app.email)}</a>
          </div>
          ${app.message ? `<div class="candidato-message">${escapeHtml(app.message)}</div>` : ''}
          <div class="candidato-date">Recibido el ${dateStr}</div>
        </div>
        <div class="candidato-actions">
          <a href="download-cv.php?id=${encodeURIComponent(app.id)}" target="_blank" class="btn-cv">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
            Ver CV
          </a>
          <select class="status-select" data-id="${escapeHtml(app.id)}">
            ${Object.entries(STATUS_LABELS).map(([val, label]) =>
              `<option value="${val}" ${app.status === val ? 'selected' : ''}>${label}</option>`
            ).join('')}
          </select>
        </div>
      </div>
    `;
  }).join('');

  candidatosGrid.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', () => updateStatus(select.dataset.id, select.value));
  });
}

async function loadApplications(showSpinner = false) {
  if (showSpinner) btnRefreshEmpleo.classList.add('spinning');
  try {
    const res = await fetch('get-applications.php');
    const json = await res.json();
    if (json.success) {
      allApplications = json.applications;
      renderCandidatos();
    }
  } catch (err) {
    showToast('No se pudo cargar la lista de candidatos.', true);
  } finally {
    if (showSpinner) setTimeout(() => btnRefreshEmpleo.classList.remove('spinning'), 400);
  }
}

async function updateStatus(id, status) {
  try {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('status', status);
    const res = await fetch('update-application-status.php', { method: 'POST', body: formData });
    const json = await res.json();
    if (json.success) {
      const app = allApplications.find(a => a.id === id);
      if (app) app.status = status;
      renderCandidatos();
      showToast('Estado actualizado.');
    } else {
      throw new Error(json.error || 'No se pudo actualizar.');
    }
  } catch (err) {
    showToast(err.message || 'Ocurrió un error.', true);
    loadApplications();
  }
}

empleoTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.empleo-tab');
  if (!btn) return;
  empleoTabs.querySelectorAll('.empleo-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.filter;
  renderCandidatos();
});

btnRefreshEmpleo.addEventListener('click', () => loadApplications(true));

loadApplications();
setInterval(() => loadApplications(), 60000); // revisa cada minuto si hay candidatos nuevos

// ===== Vacantes =====
const vacantesGrid = document.getElementById('vacantesGrid');
const vacantesEmptyMsg = document.getElementById('vacantesEmptyMsg');
const formNuevaVacante = document.getElementById('formNuevaVacante');
const vacanteNuevaStatus = document.getElementById('vacanteNuevaStatus');

let allVacancies = [];

function renderVacantes() {
  if (allVacancies.length === 0) {
    vacantesGrid.innerHTML = '';
    vacantesEmptyMsg.textContent = 'Todavía no has agregado ninguna vacante.';
    vacantesGrid.appendChild(vacantesEmptyMsg);
    return;
  }

  vacantesGrid.innerHTML = allVacancies.map(v => `
    <div class="vacante-card ${v.active ? '' : 'inactive'}" data-id="${escapeHtml(v.id)}">
      <div class="vacante-main">
        <div class="vacante-title-row">
          <input type="text" class="vacante-title-input" value="${escapeHtml(v.title)}" placeholder="Nombre del puesto">
        </div>
        <textarea class="vacante-desc" rows="1" placeholder="Descripción (opcional)">${escapeHtml(v.description)}</textarea>
        <span class="vacante-save-hint">Los cambios se guardan solos al salir del campo</span>
      </div>
      <div class="vacante-actions">
        <label class="toggle-switch" title="${v.active ? 'Vacante activa (visible en el sitio)' : 'Vacante inactiva (oculta)'}">
          <input type="checkbox" class="vacante-active-toggle" ${v.active ? 'checked' : ''}>
          <span class="toggle-track"></span>
        </label>
        <button class="btn-delete-vacante" title="Eliminar vacante">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  vacantesGrid.querySelectorAll('.vacante-card').forEach(card => {
    const id = card.dataset.id;
    const titleInput = card.querySelector('.vacante-title-input');
    const descInput = card.querySelector('.vacante-desc');
    const toggle = card.querySelector('.vacante-active-toggle');
    const deleteBtn = card.querySelector('.btn-delete-vacante');

    const saveThis = () => saveVacante(id, titleInput.value, descInput.value, toggle.checked, card);
    titleInput.addEventListener('blur', saveThis);
    descInput.addEventListener('blur', saveThis);
    toggle.addEventListener('change', saveThis);

    deleteBtn.addEventListener('click', () => {
      if (confirm(`¿Eliminar la vacante "${titleInput.value}"? Esto no se puede deshacer.`)) {
        deleteVacante(id, card);
      }
    });
  });
}

async function loadVacantesAdmin() {
  try {
    const res = await fetch('get-vacancies.php');
    const json = await res.json();
    if (json.success) {
      allVacancies = json.vacancies;
      renderVacantes();
    }
  } catch (err) {
    showToast('No se pudo cargar la lista de vacantes.', true);
  }
}

async function saveVacante(id, title, description, active, card) {
  if (!title.trim()) {
    showToast('El nombre del puesto no puede quedar vacío.', true);
    loadVacantesAdmin();
    return;
  }
  try {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('active', active ? '1' : '0');
    const res = await fetch('save-vacancy.php', { method: 'POST', body: formData });
    const json = await res.json();
    if (json.success) {
      card.classList.toggle('inactive', !active);
      const v = allVacancies.find(x => x.id === id);
      if (v) { v.title = title.trim(); v.description = description.trim(); v.active = active; }
      showToast('Vacante actualizada.');
    } else {
      throw new Error(json.error || 'No se pudo guardar.');
    }
  } catch (err) {
    showToast(err.message || 'Ocurrió un error.', true);
  }
}

async function deleteVacante(id, card) {
  try {
    const formData = new FormData();
    formData.append('id', id);
    const res = await fetch('delete-vacancy.php', { method: 'POST', body: formData });
    const json = await res.json();
    if (json.success) {
      allVacancies = allVacancies.filter(v => v.id !== id);
      card.remove();
      if (allVacancies.length === 0) renderVacantes();
      showToast('Vacante eliminada.');
    } else {
      throw new Error(json.error || 'No se pudo eliminar.');
    }
  } catch (err) {
    showToast(err.message || 'Ocurrió un error.', true);
  }
}

formNuevaVacante.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = formNuevaVacante.querySelector('.btn-save');
  const title = formNuevaVacante.title.value.trim();
  if (!title) {
    vacanteNuevaStatus.textContent = 'Escribe un nombre de puesto.';
    vacanteNuevaStatus.classList.add('show', 'error');
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Agregando...';
  try {
    const formData = new FormData();
    formData.append('id', '');
    formData.append('title', title);
    formData.append('description', formNuevaVacante.description.value.trim());
    formData.append('active', '1');
    const res = await fetch('save-vacancy.php', { method: 'POST', body: formData });
    const json = await res.json();
    if (json.success) {
      formNuevaVacante.reset();
      vacanteNuevaStatus.classList.remove('show', 'error');
      showToast('Vacante agregada.');
      loadVacantesAdmin();
    } else {
      throw new Error(json.error || 'No se pudo agregar.');
    }
  } catch (err) {
    vacanteNuevaStatus.textContent = err.message || 'Ocurrió un error.';
    vacanteNuevaStatus.classList.add('show', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '+ Agregar vacante';
  }
});

loadVacantesAdmin();

// ===== Cambiar contraseña =====
const formPassword = document.getElementById('formPassword');
const passwordStatus = document.getElementById('passwordStatus');

formPassword.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPass = formPassword.new_password.value;
  const confirmPass = formPassword.confirm_password.value;

  if (newPass !== confirmPass) {
    passwordStatus.textContent = 'Las contraseñas no coinciden';
    passwordStatus.classList.add('show', 'error');
    return;
  }

  const btn = formPassword.querySelector('.btn-save');
  btn.disabled = true;
  btn.textContent = 'Actualizando...';
  passwordStatus.classList.remove('show', 'error');

  try {
    const res = await fetch('change-password.php', {
      method: 'POST',
      body: new FormData(formPassword),
    });
    const json = await res.json();

    if (json.success) {
      passwordStatus.textContent = 'Contraseña actualizada ✓';
      passwordStatus.classList.add('show');
      showToast('Tu contraseña se actualizó correctamente.');
      formPassword.reset();
    } else {
      throw new Error(json.error || 'No se pudo actualizar.');
    }
  } catch (err) {
    passwordStatus.textContent = 'Error';
    passwordStatus.classList.add('show', 'error');
    showToast(err.message || 'Ocurrió un error.', true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Actualizar contraseña';
  }
});
