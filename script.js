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
