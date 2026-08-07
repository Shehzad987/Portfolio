// Connecting Lines Particle Effect
const canvas = document.createElement('canvas');
canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
document.body.insertBefore(canvas, document.body.firstChild);
const ctx = canvas.getContext('2d');

let width, height, particles = [];
const particleCount = 80;
const maxDistance = 150;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

function initParticles() {
  particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1
    });
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  
  // Draw particles
  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    
    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 245, 255, 0.6)';
    ctx.fill();
    
    // Draw connecting lines
    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j];
      const dx = p.x - p2.x;
      const dy = p.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < maxDistance) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(0, 245, 255, ${0.15 * (1 - dist / maxDistance)})`;
        ctx.stroke();
      }
    }
  });
  
  requestAnimationFrame(draw);
}

resize();
initParticles();
draw();
window.addEventListener('resize', () => { resize(); initParticles(); });

// Typing Animation
const text = ["Software Engineer", "Full Stack Web Developer", "Problem Solver"];
let i = 0, j = 0, current = "", isDeleting = false;

function type() {
  current = text[i];

  if (isDeleting) j--;
  else j++;

  document.getElementById("typing").textContent = current.substring(0, j);

  if (!isDeleting && j === current.length) {
    isDeleting = true;
    setTimeout(type, 1000);
    return;
  }

  if (isDeleting && j === 0) {
    isDeleting = false;
    i = (i + 1) % text.length;
  }

  setTimeout(type, isDeleting ? 50 : 100);
}

type();
// Hamburger Menu Toggle
function toggleMenu() {
  const navLinks = document.getElementById("navLinks");
  if (!navLinks) return;
  const isActive = navLinks.classList.toggle("active");
  const hb = document.getElementById('hamburger');
  if (hb) {
    hb.classList.toggle('open', isActive);
    hb.setAttribute('aria-expanded', isActive ? 'true' : 'false');
  }
  // Prevent background scroll when menu is open
  if (isActive) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

// Custom 3D Cursor (glowing cyan-blue)
(function(){
  const cursor = document.getElementById('cursor3d');
  if(!cursor) return;

  // Hide native cursor
  document.documentElement.style.cursor = 'none';

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  const hoverSelector = [
    'a',
    'button',
    '.btn',
    '.project',
    '.skill',
    '.edu-card',
    '.social-btn'
  ].join(',');

  function lerp(a,b,t){ return a + (b-a)*t; }

  function animate(){
    currentX = lerp(currentX, targetX, 0.16);
    currentY = lerp(currentY, targetY, 0.16);

    const dx = targetX - currentX;
    const dy = targetY - currentY;

    const rot = Math.max(-18, Math.min(18, dy * 0.02));
    const rot2 = Math.max(-18, Math.min(18, -dx * 0.02));

    cursor.style.left = currentX + 'px';
    cursor.style.top = currentY + 'px';
    cursor.style.transform = `translate3d(-50%, -50%, 0) rotateX(${rot}deg) rotateY(${rot2}deg)`;

    for(let k=0;k<2;k++){
      const dot = document.createElement('div');
      dot.style.cssText = `position:fixed;left:${currentX}px;top:${currentY}px;width:4px;height:4px;border-radius:50%;
        background: rgba(0,245,255,0.85);
        box-shadow: 0 0 10px rgba(0,245,255,0.6), 0 0 18px rgba(0,119,255,0.35);
        transform: translate(-50%,-50%);
        pointer-events:none;z-index:999998;`;
      document.body.appendChild(dot);
      const driftX = (Math.random()-0.5)*18;
      const driftY = (Math.random()-0.5)*18;
      const drift = `translate(${driftX}px, ${driftY}px) scale(${0.8+Math.random()*0.6})`;
      dot.animate([
        {opacity:0.9, transform:'translate(-50%,-50%) scale(1)'},
        {opacity:0.0, transform:`translate(-50%,-50%) ${drift}`}
      ], {duration:450+Math.random()*250, easing:'ease-out', fill:'forwards'});
      setTimeout(()=>dot.remove(), 800);
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  }, { passive: true });

  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest(hoverSelector);
    if(el){
      document.body.classList.add('cursor-hover');

      const r = el.getBoundingClientRect();
      const cx = r.left + r.width/2;
      const cy = r.top + r.height/2;
      targetX = lerp(targetX, cx, 0.35);
      targetY = lerp(targetY, cy, 0.35);
    }
  });

  document.addEventListener('mouseout', (e) => {
    const related = e.relatedTarget;
    const leaving = e.target.closest(hoverSelector);
    if(leaving){
      const stillHovering = related && related.closest ? related.closest(hoverSelector) : false;
      if(!stillHovering) document.body.classList.remove('cursor-hover');
    }
  });

  document.addEventListener('click', () => {
    const pulse = document.createElement('div');
    pulse.style.cssText = `position:fixed;left:${currentX}px;top:${currentY}px;width:10px;height:10px;border-radius:50%;
      background: rgba(0,245,255,0.35);
      box-shadow: 0 0 22px rgba(0,245,255,0.55), 0 0 45px rgba(0,119,255,0.25);
      transform: translate(-50%,-50%);
      pointer-events:none;z-index:999998;`;
    document.body.appendChild(pulse);
    pulse.animate([
      {opacity:1, transform:'translate(-50%,-50%) scale(0.9)'},
      {opacity:0.0, transform:'translate(-50%,-50%) scale(3.2)'}
    ], {duration:520, easing:'ease-out', fill:'forwards'});
    setTimeout(()=>pulse.remove(), 650);
  });

  cursor.style.left = currentX + 'px';
  cursor.style.top = currentY + 'px';
  animate();
})();