console.log("SCRIPT.JS IS LOADED");

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
const text = ["Software Engineer.", "Full Stack Web Developer.", "Problem Solver."];
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

window.customCursorEnabled = false;
function enableCursor() {
  window.customCursorEnabled = true;
  document.body.classList.add('loaded');
  document.documentElement.style.cursor = 'none';
}

function handleLoader() {
  const overlay = document.getElementById('loaderOverlay');
  if (!overlay) return;

  const hideOverlay = () => {
    document.body.classList.remove('loading');
    overlay.classList.add('hidden');
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      enableCursor();
    }, 600);
  };

  const delay = 1600;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(hideOverlay, delay));
  } else {
    setTimeout(hideOverlay, delay);
  }
}

handleLoader();

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
  
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let cursorEnabled = false;

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
    if (!window.customCursorEnabled) {
      requestAnimationFrame(animate);
      return;
    }

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
/* =========================================================
   CERTIFICATE DATA
========================================================= */

const certificateData = {

    walmart: {
        title: "Advanced Software Engineering Job Simulation",
        issuer: "WALMART USA · FORAGE",
        year: "2026",
        description:
            "Successfully completed Walmart's Advanced Software Engineering Virtual Experience Program through Forage. Worked on practical software engineering tasks involving Java, data structures, UML design and database modeling.",
        skills: [
            "Java",
            "Data Structures",
            "UML",
            "Database Modeling",
            "Software Engineering"
        ],
          image: "images/Advance Software Engineering.png",
        link: "documents/Walmart Advance Software Engineering Job Simulation.pdf"
    },

    "wells-fargo": {
        title: "Software Engineering Job Simulation",
        issuer: "WELLS FARGO · FORAGE",
        year: "2026",
        description:
            "Designed a financial portfolio management system by gathering requirements, modeling data through an Entity Relationship Diagram (ERD) and implementing the system using IntelliJ.",
        skills: [
            "Java",
            "ERD",
            "Database Design",
            "IntelliJ",
            "Software Engineering"
        ],
        image: "images/Software Engineering.png",
        link: "documents/Software Engineering Job Certificate.pdf"
    },

    "deloitte-technology": {
        title: "Technology Job Simulation",
        issuer: "DELOITTE · FORAGE",
        year: "2026",
        description:
            "Completed a virtual job simulation focused on technology development and coding practices within a consulting context. Drafted a professional proposal for the design and implementation of a data dashboard.",
        skills: [
            "Technology Development",
            "Coding",
            "Data Dashboards",
            "Technical Proposal",
            "Consulting"
        ],
        image: "images/Technology.png",
        link: "documents/Deloitte Technology job simulation certificate.pdf"
    },

    "deloitte-data": {
        title: "Data Analyst Job Simulation",
        issuer: "DELOITTE · FORAGE",
        year: "2026",
        description:
            "Analyzed industrial telemetry data to identify operational inefficiencies across multiple factory locations. Structured nested JSON datasets and created interactive dashboards in Tableau Public.",
        skills: [
            "Data Analysis",
            "JSON",
            "Tableau",
            "Data Visualization",
            "Dashboard Development"
        ],
        image: "images/Data Analyst.png",
        link: "documents/Deloitte Data Analyst certificate.pdf"
    },

    "deloitte-cyber": {
        title: "Cyber Security Job Simulation",
        issuer: "DELOITTE · FORAGE",
        year: "2026",
        description:
            "Gained practical experience in cybersecurity investigations, log analysis, threat detection and incident response through real-world simulation exercises.",
        skills: [
            "Cybersecurity",
            "Log Analysis",
            "Threat Detection",
            "Incident Response"
        ],
        image: "images/Cybersecurity.png",
        link: "documents/Deloitte cyber security job completion_certificate.pdf"
    },

    tevta: {
        title: "Certificate in Computer Applications (CCA)",
        issuer: "TEVTA",
        year: "2022",
        description:
            "Demonstrated foundational proficiency in computer applications including MS Office, basic IT concepts and digital productivity tools.",
        skills: [
            "MS Office",
            "Computer Applications",
            "Basic IT",
            "Digital Productivity"
        ],
        image: "images/CCA.png",
        link: "documents/TEVTA certificate.jpg"
    }

};


/* OPEN CERTIFICATE */

function openCertificate(certificateId) {

    const certificate = certificateData[certificateId];

    if (!certificate) {
        console.error("Certificate not found:", certificateId);
        return;
    }

    const modal = document.getElementById("certificateModal");
    const title = document.getElementById("certificateTitle");
    const issuer = document.getElementById("certificateIssuer");
    const year = document.getElementById("certificateYear");
    const description = document.getElementById("certificateDescription");
    const image = document.getElementById("certificatePreviewImage");
    const skills = document.getElementById("certificateSkills");
    const link = document.getElementById("certificateLink");

    /* Check required elements */
    if (
        !modal ||
        !title ||
        !issuer ||
        !year ||
        !description ||
        !image ||
        !skills ||
        !link
    ) {
        console.error("Certificate modal HTML is missing!");

        console.table({
            certificateModal: !!modal,
            certificateTitle: !!title,
            certificateIssuer: !!issuer,
            certificateYear: !!year,
            certificateDescription: !!description,
            certificatePreviewImage: !!image,
            certificateSkills: !!skills,
            certificateLink: !!link
        });

        return;
    }

    /* Fill certificate information */
    title.textContent = certificate.title;
    issuer.textContent = certificate.issuer;
    year.textContent = certificate.year;
    description.textContent = certificate.description;

    image.src = certificate.image;
    image.alt = certificate.title;

    link.href = certificate.link;

    /* Skills */
    skills.innerHTML = "";

    certificate.skills.forEach(skill => {

        const skillTag = document.createElement("span");

        skillTag.textContent = skill;

        skills.appendChild(skillTag);

    });

    /* Open modal */
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("certificate-modal-open");
}
