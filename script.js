// ===== Datos de contacto dinámicos (editados desde /admin) =====
// Si el archivo no existe o falla la carga (por ejemplo, al abrir el HTML
// directo con doble clic en vez de por un servidor), el sitio simplemente
// conserva los valores que ya están escritos en el HTML.
async function loadSiteData() {
  try {
    const res = await fetch('data/site-data.json', { cache: 'no-store' });
    if (!res.ok) return;
    const d = await res.json();

    const setText = (id, value) => { const el = document.getElementById(id); if (el && value) el.textContent = value; };
    const setHref = (id, value) => { const el = document.getElementById(id); if (el && value) el.href = value; };

    // Teléfono
    setText('navPhoneText', d.phone_display);
    if (d.phone_tel) {
      setHref('navPhoneLink', `tel:${d.phone_tel}`);
      setHref('ubicPhoneLink', `tel:${d.phone_tel}`);
      setHref('footerPhoneLink', `tel:${d.phone_tel}`);
    }
    setText('ubicPhoneLink', d.phone_display);
    setText('footerPhoneLink', d.phone_display);

    // WhatsApp
    if (d.whatsapp_number) {
      setHref('empresasWhatsappLink', `https://wa.me/${d.whatsapp_number}`);
      setHref('floatWhatsappLink', `https://wa.me/${d.whatsapp_number}`);
    }

    // Correo
    if (d.email) {
      setHref('ubicEmailLink', `mailto:${d.email}`);
      setHref('footerEmailLink', `mailto:${d.email}`);
    }
    setText('ubicEmailLink', d.email);
    setText('footerEmailLink', d.email);

    // Dirección
    const ubicAddress = document.getElementById('ubicAddress');
    if (ubicAddress && (d.address_line1 || d.address_line2)) {
      const mapsHref = d.maps_link || '#';
      ubicAddress.innerHTML =
        `${d.address_line1 || ''}<br>${d.address_line2 || ''}<br>` +
        `<a class="dd-link" href="${mapsHref}" target="_blank" rel="noopener" id="ubicMapsLink">Ver ruta en Google Maps →</a>`;
    }
    setHref('footerMapsLink', d.maps_link);

    // Horario
    const ubicHours = document.getElementById('ubicHours');
    if (ubicHours && (d.hours_weekday || d.hours_sunday)) {
      ubicHours.innerHTML = `${d.hours_weekday || ''}<br>${d.hours_sunday || ''}`;
    }

    // Mapa embebido
    const mapEmbed = document.getElementById('ubicMapEmbed');
    if (mapEmbed && d.maps_embed_query) {
      mapEmbed.src = `https://www.google.com/maps?q=${encodeURIComponent(d.maps_embed_query)}&output=embed`;
    }
  } catch (err) {
    // Silencioso: el sitio sigue funcionando con los valores por defecto del HTML.
  }
}
loadSiteData();

// ===== Bolsa de trabajo: formulario público =====
// El formulario ahora se envía de forma 100% nativa (sin fetch ni JavaScript
// interceptando el envío) porque algunos antivirus/software de seguridad
// bloquean en silencio los envíos hechos por JavaScript cuando detectan un
// formulario que junta datos personales + un archivo adjunto. Con un envío
// nativo de HTML, el navegador maneja todo directamente — es el mecanismo
// más básico y compatible que existe en la web.
const formEmpleo = document.getElementById('formEmpleo');
if (formEmpleo) {
  const cvDrop = document.getElementById('cvDrop');
  const cvInput = document.getElementById('cvInput');
  const cvFileName = document.getElementById('cvFileName');
  const empleoStatus = document.getElementById('empleoStatus');

  // Esto SOLO controla la selección bonita del archivo (arrastrar/soltar,
  // mostrar el nombre). El envío en sí lo hace el navegador de forma normal.
  cvDrop.addEventListener('click', () => cvInput.click());
  cvInput.addEventListener('change', () => {
    if (cvInput.files && cvInput.files[0]) setCvFile(cvInput.files[0]);
  });

  ['dragenter', 'dragover'].forEach(evt =>
    cvDrop.addEventListener(evt, (e) => { e.preventDefault(); cvDrop.classList.add('dragover'); })
  );
  ['dragleave', 'drop'].forEach(evt =>
    cvDrop.addEventListener(evt, (e) => { e.preventDefault(); cvDrop.classList.remove('dragover'); })
  );
  cvDrop.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      cvInput.files = dt.files;
      setCvFile(file);
    }
  });

  function setCvFile(file) {
    const okTypes = ['application/pdf'];
    if (!okTypes.includes(file.type) && !/\.pdf$/i.test(file.name)) {
      showEmpleoStatus('Solo se aceptan archivos PDF.', true);
      cvInput.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showEmpleoStatus('El archivo pesa demasiado (máximo 5MB).', true);
      cvInput.value = '';
      return;
    }
    cvFileName.textContent = file.name;
    cvDrop.classList.add('has-file');
  }

  function showEmpleoStatus(msg, isError) {
    empleoStatus.textContent = msg;
    empleoStatus.classList.remove('ok', 'error');
    empleoStatus.classList.add('show', isError ? 'error' : 'ok');
  }

  // Después de que el navegador envía el formulario, api/submit-application.php
  // redirige de vuelta aquí con ?empleo_ok=1 o ?empleo_error=mensaje en la URL.
  // Leemos eso al cargar la página para mostrar el mensaje correspondiente,
  // y luego limpiamos la URL para que un refresh no repita el mensaje.
  const params = new URLSearchParams(window.location.search);
  if (params.has('empleo_ok')) {
    showEmpleoStatus('¡Listo! Recibimos tu solicitud. Te contactaremos si tu perfil encaja.', false);
  } else if (params.has('empleo_error')) {
    showEmpleoStatus(params.get('empleo_error') || 'Ocurrió un error. Intenta de nuevo.', true);
  }
  if (params.has('empleo_ok') || params.has('empleo_error')) {
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState(null, '', cleanUrl);
  }
}

// ===== Vacantes activas (editadas desde /admin) =====
// Igual que loadSiteData: si falla la carga, el formulario simplemente se
// queda con la única opción "Otro" en vez de romperse.
async function loadVacancies() {
  const tagsContainer = document.getElementById('empleoPuestosTags');
  const select = document.getElementById('empleoPositionSelect');
  const otroOption = document.getElementById('otroOption');
  const detalle = document.getElementById('vacanteDetalle');
  const detalleTitle = document.getElementById('vacanteDetalleTitle');
  const detalleDesc = document.getElementById('vacanteDetalleDesc');
  const detalleClose = document.getElementById('vacanteDetalleClose');
  const detallePostular = document.getElementById('vacanteDetallePostular');
  if (!tagsContainer || !select) return;

  function closeDetalle() {
    detalle.hidden = true;
    tagsContainer.querySelectorAll('.puesto-tag').forEach(t => t.classList.remove('active'));
  }

  function openDetalle(vacancy, tagEl) {
    tagsContainer.querySelectorAll('.puesto-tag').forEach(t => t.classList.remove('active'));
    tagEl.classList.add('active');
    detalleTitle.textContent = vacancy.title;
    detalleDesc.textContent = vacancy.description && vacancy.description.trim()
      ? vacancy.description
      : 'Escríbenos y con gusto te damos más detalles sobre horarios y requisitos de este puesto.';
    detallePostular.dataset.title = vacancy.title;
    detalle.hidden = false;
  }

  try {
    const res = await fetch('data/vacancies.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo cargar');
    const vacancies = await res.json();
    const activas = vacancies.filter(v => v.active);

    if (activas.length === 0) {
      tagsContainer.innerHTML = '<span>Por el momento no tenemos vacantes abiertas, pero puedes enviarnos tu CV de todos modos.</span>';
    } else {
      tagsContainer.innerHTML = activas.map((v, i) => `
        <button type="button" class="puesto-tag" data-index="${i}">
          ${escapeHtmlPublic(v.title)}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        </button>
      `).join('');

      activas.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.title;
        opt.textContent = v.title;
        select.insertBefore(opt, otroOption);
      });

      tagsContainer.querySelectorAll('.puesto-tag').forEach(tagEl => {
        tagEl.addEventListener('click', () => {
          const vacancy = activas[parseInt(tagEl.dataset.index, 10)];
          if (tagEl.classList.contains('active')) {
            closeDetalle();
          } else {
            openDetalle(vacancy, tagEl);
          }
        });
      });
    }
  } catch (err) {
    tagsContainer.innerHTML = '<span>Escríbenos y cuéntanos en qué te gustaría trabajar.</span>';
  }

  if (detalleClose) detalleClose.addEventListener('click', closeDetalle);
  if (detallePostular) {
    detallePostular.addEventListener('click', () => {
      select.value = detallePostular.dataset.title || '';
      closeDetalle();
      document.getElementById('formEmpleo').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}
function escapeHtmlPublic(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
loadVacancies();

// Nav solid on scroll
const header = document.getElementById('siteHeader');
window.addEventListener('scroll',()=>{
  header.classList.toggle('solid', window.scrollY > 60);
},{passive:true});

// Scroll reveal
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('in-view'); io.unobserve(e.target); }
  });
},{threshold:.15});
document.querySelectorAll('.reveal, .reveal-stagger').forEach(el=>io.observe(el));

// Cut map interactivity
const cuts = {};
document.querySelectorAll('.zone').forEach(z=>{
  z.setAttribute('tabindex','0');
  z.setAttribute('role','button');
  z.setAttribute('aria-label', z.dataset.name);
});
const cutName = document.getElementById('cutName');
const cutDesc = document.getElementById('cutDesc');
let activeZone = null;

function selectZone(zone){
  if(activeZone) activeZone.classList.remove('active');
  zone.classList.add('active');
  activeZone = zone;
  cutName.textContent = zone.dataset.name;
  cutDesc.textContent = zone.dataset.desc;
  cutName.classList.remove('cut-fade'); cutDesc.classList.remove('cut-fade');
  void cutName.offsetWidth;
  cutName.classList.add('cut-fade'); cutDesc.classList.add('cut-fade');
}

document.querySelectorAll('.zone').forEach(zone=>{
  zone.addEventListener('mouseenter',()=>selectZone(zone));
  zone.addEventListener('click',()=>selectZone(zone));
  zone.addEventListener('keydown',(e)=>{
    if(e.key==='Enter' || e.key===' '){ e.preventDefault(); selectZone(zone); }
  });
});

// Gallery lightbox
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
const lightbox = document.getElementById('lightbox');
const lightboxContent = document.getElementById('lightboxContent');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
let currentIndex = 0;

function renderLightbox(index){
  currentIndex = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[currentIndex];
  const img = item.querySelector('img');
  const placeholder = item.querySelector('.gallery-placeholder');
  lightboxContent.innerHTML = '';

  if(img.style.display !== 'none'){
    const bigImg = document.createElement('img');
    bigImg.src = img.src;
    bigImg.alt = img.alt;
    lightboxContent.appendChild(bigImg);
  } else {
    const lbPlaceholder = document.createElement('div');
    lbPlaceholder.className = 'lb-placeholder';
    lbPlaceholder.innerHTML = placeholder.querySelector('svg').outerHTML +
      '<span>' + placeholder.querySelector('span').textContent + '</span>';
    lightboxContent.appendChild(lbPlaceholder);
  }
}

galleryItems.forEach((item, i)=>{
  item.addEventListener('click', ()=>{
    renderLightbox(i);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

function closeLightbox(){
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) closeLightbox(); });
lightboxPrev.addEventListener('click', ()=>renderLightbox(currentIndex - 1));
lightboxNext.addEventListener('click', ()=>renderLightbox(currentIndex + 1));
document.addEventListener('keydown', (e)=>{
  if(!lightbox.classList.contains('open')) return;
  if(e.key === 'Escape') closeLightbox();
  if(e.key === 'ArrowLeft') renderLightbox(currentIndex - 1);
  if(e.key === 'ArrowRight') renderLightbox(currentIndex + 1);
});

// stop pulsing dots after first interaction
let interacted = false;
document.querySelectorAll('.zone').forEach(z=>{
  z.addEventListener('mouseenter',()=>{
    if(!interacted){
      interacted = true;
      document.querySelectorAll('.zone-dot').forEach(d=>d.classList.remove('pulse'));
    }
  });
});
