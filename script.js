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
