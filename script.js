const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

async function loadProfile() {
  for (const url of ['/api/profile', './data/profile.json']) {
    try { const response = await fetch(url); if (response.ok) return await response.json(); } catch {}
  }
  return null;
}

function renderProjects(projects) {
  const list = $('#project-list');
  if (!Array.isArray(projects) || !projects.length) { list.innerHTML = '<p class="loading">作品資料暫時無法載入。</p>'; return; }
  list.innerHTML = projects.map((project, index) => `<article class="project reveal" tabindex="0" aria-label="${escapeHtml(project.title)}，${escapeHtml(project.type)}"><span class="project-number">${escapeHtml(project.number || String(index + 1).padStart(2, '0'))}</span><div class="project-info"><span class="project-type">${escapeHtml(project.type)}</span><h3>${escapeHtml(project.title)}</h3></div><div class="project-description"><p>${escapeHtml(project.description)}</p><div class="project-tags">${(project.tags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div></div><span class="project-arrow" aria-hidden="true">↗</span></article>`).join('');
  observeReveals(); setupTilt();
}

function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]); }

function observeReveals() {
  const targets = $$('.reveal:not(.is-visible)');
  if (!('IntersectionObserver' in window) || reduceMotion.matches) { targets.forEach(node => node.classList.add('is-visible')); return; }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: .12 });
  targets.forEach(node => observer.observe(node));
}

function setupTilt() {
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion.matches) {
    $$('.project').forEach(card => {
      card.addEventListener('pointermove', event => { const box = card.getBoundingClientRect(); const y = (event.clientX - box.left) / box.width - .5; card.style.transform = `perspective(900px) rotateY(${y * 1.4}deg)`; });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }
}

function setupNavigation() {
  const toggle = $('.menu-toggle'); const nav = $('#site-nav');
  toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); });
  $$('#site-nav a').forEach(link => link.addEventListener('click', () => { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }));
}

function setupContact() {
  $('#contact-form').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget; const status = $('#form-status');
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '送出失敗，請檢查資料。');
      status.textContent = result.message; form.reset();
    } catch {
      status.textContent = '靜態展示版不連接後端。這是表單示範，訊息沒有送出。';
    }
  });
}

function setupParticles() {
  const canvas = $('.particle-canvas'); const ctx = canvas.getContext('2d'); let width = 0, height = 0, points = [], frame = 0; let pointer = { x: -1000, y: -1000 };
  const palette = [[132,224,238],[156,177,255],[192,163,255],[255,156,133]];
  const count = () => Math.min(innerWidth < 640 ? 30 : innerWidth < 1000 ? 52 : 90, Math.floor(width * height / 15500));
  function resize() { const ratio = Math.min(devicePixelRatio || 1, 1.6); const box = canvas.getBoundingClientRect(); width = box.width; height = box.height; canvas.width = width * ratio; canvas.height = height * ratio; ctx.setTransform(ratio,0,0,ratio,0,0); points = Array.from({ length: count() }, () => ({ x: Math.random()*width, y: Math.random()*height, vx: (Math.random()-.5)*.19, vy:(Math.random()-.5)*.19, r:.45+Math.random()*1.1, c:palette[Math.floor(Math.random()*palette.length)], a:.28+Math.random()*.5 })); }
  function draw() { ctx.clearRect(0,0,width,height); for (let i=0;i<points.length;i++) { const p=points[i]; if (!reduceMotion.matches) { p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>width)p.vx*=-1; if(p.y<0||p.y>height)p.vy*=-1; } const dx=pointer.x-p.x,dy=pointer.y-p.y,d=Math.hypot(dx,dy); if(d<110&&d>1&&!reduceMotion.matches){p.x-=dx/d*.08;p.y-=dy/d*.08;} ctx.beginPath();ctx.fillStyle=`rgba(${p.c.join(',')},${p.a})`;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill(); if(d<125&&i%3===0){ctx.beginPath();ctx.strokeStyle=`rgba(126,190,220,${(1-d/125)*.12})`;ctx.lineWidth=.6;ctx.moveTo(p.x,p.y);ctx.lineTo(pointer.x,pointer.y);ctx.stroke();} }
    for(let i=0;i<points.length;i+=3){const a=points[i],b=points[(i+1)%points.length],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<94){ctx.beginPath();ctx.strokeStyle=`rgba(130,165,210,${(1-d/94)*.085})`;ctx.lineWidth=.5;ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
    if(!reduceMotion.matches) frame=requestAnimationFrame(draw);
  }
  const hero = $('.hero'); hero.addEventListener('pointermove', event => { const box=canvas.getBoundingClientRect(); pointer={x:event.clientX-box.left,y:event.clientY-box.top}; }); hero.addEventListener('pointerleave',()=>{pointer={x:-1000,y:-1000};});
  addEventListener('resize',()=>{cancelAnimationFrame(frame);resize();draw();},{passive:true}); reduceMotion.addEventListener?.('change',()=>{cancelAnimationFrame(frame);draw();}); resize(); draw();
}

async function init() {
  $('#year').textContent = new Date().getFullYear(); setupNavigation(); setupContact(); setupParticles();
  const profile = await loadProfile();
  if (profile) {
    $$('[data-profile]').forEach(node => { const key=node.dataset.profile; if(profile[key]) node.textContent=profile[key]; });
    $$('[data-profile-email]').forEach(node => { node.href=`mailto:${profile.email}`; });
    renderProjects(profile.projects);
  } else $('#project-list').innerHTML='<p class="loading">無法載入作品資料，請稍後重新整理。</p>';
  observeReveals();
}
init();
