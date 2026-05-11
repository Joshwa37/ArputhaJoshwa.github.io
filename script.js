// ==================== CANVAS CURSOR (colorful flowing lines) ====================

(function initCanvasCursor() {
  if (window.innerWidth <= 768) return;

  function Oscillator(opts) {
    this.phase     = opts.phase     || 0;
    this.offset    = opts.offset    || 0;
    this.frequency = opts.frequency || 0.001;
    this.amplitude = opts.amplitude || 1;
  }
  Oscillator.prototype.update = function () {
    this.phase += this.frequency;
    return this.offset + Math.sin(this.phase) * this.amplitude;
  };

  function Node() {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
  }

  var E = {
    friction:   0.5,
    trails:     20,
    size:       50,
    dampening:  0.25,
    tension:    0.98,
  };

  var ctx, colorOsc;
  var pos    = { x: 0, y: 0 };
  var lines  = [];

  function Line(opts) {
    this.spring   = opts.spring + 0.1 * Math.random() - 0.02;
    this.friction = E.friction  + 0.01 * Math.random() - 0.002;
    this.nodes    = [];
    for (var i = 0; i < E.size; i++) {
      var n = new Node();
      n.x = pos.x; n.y = pos.y;
      this.nodes.push(n);
    }
  }
  Line.prototype.update = function () {
    var spring = this.spring;
    var t = this.nodes[0];
    t.vx += (pos.x - t.x) * spring;
    t.vy += (pos.y - t.y) * spring;
    for (var i = 0; i < this.nodes.length; i++) {
      t = this.nodes[i];
      if (i > 0) {
        var prev = this.nodes[i - 1];
        t.vx += (prev.x - t.x) * spring;
        t.vy += (prev.y - t.y) * spring;
        t.vx += prev.vx * E.dampening;
        t.vy += prev.vy * E.dampening;
      }
      t.vx *= this.friction;
      t.vy *= this.friction;
      t.x  += t.vx;
      t.y  += t.vy;
      spring *= E.tension;
    }
  };
  Line.prototype.draw = function () {
    var n0 = this.nodes[0];
    var x  = n0.x, y = n0.y;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (var i = 1; i < this.nodes.length - 2; i++) {
      var a = this.nodes[i];
      var b = this.nodes[i + 1];
      x = 0.5 * (a.x + b.x);
      y = 0.5 * (a.y + b.y);
      ctx.quadraticCurveTo(a.x, a.y, x, y);
    }
    var a = this.nodes[this.nodes.length - 2];
    var b = this.nodes[this.nodes.length - 1];
    ctx.quadraticCurveTo(a.x, a.y, b.x, b.y);
    ctx.stroke();
    ctx.closePath();
  };

  function spawnLines() {
    lines = [];
    for (var i = 0; i < E.trails; i++) {
      lines.push(new Line({ spring: 0.4 + (i / E.trails) * 0.025 }));
    }
  }

  function onPointerMove(e) {
    if (e.touches) {
      pos.x = e.touches[0].pageX;
      pos.y = e.touches[0].pageY;
    } else {
      pos.x = e.clientX;
      pos.y = e.clientY;
    }
    e.preventDefault && e.preventDefault();
  }

  function render() {
    if (!ctx.running) return;

    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    var h = Math.round(colorOsc.update());
    ctx.strokeStyle = 'hsla(' + h + ',80%,60%,0.25)';
    ctx.lineWidth   = 1.2;

    for (var i = 0; i < lines.length; i++) {
      lines[i].update();
      lines[i].draw();
    }

    window.requestAnimationFrame(render);
  }

  function resizeCanvas() {
    ctx.canvas.width  = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
  }

  function boot() {
    var canvas = document.getElementById('canvas');
    if (!canvas) return;

    ctx          = canvas.getContext('2d');
    ctx.running  = true;

    colorOsc = new Oscillator({
      phase:     Math.random() * 2 * Math.PI,
      amplitude: 85,
      frequency: 0.0015,
      offset:    285,
    });

    resizeCanvas();

    function firstMove(e) {
      document.removeEventListener('mousemove', firstMove);
      document.removeEventListener('touchstart', firstMove);
      onPointerMove(e);
      spawnLines();
      render();
    }
    document.addEventListener('mousemove', firstMove);
    document.addEventListener('touchstart', firstMove);

    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('touchmove',  onPointerMove, { passive: false });

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('focus', function () { if (!ctx.running) { ctx.running = true; render(); } });
    window.addEventListener('blur',  function () { ctx.running = true; });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { 
    boot();
  }
})();


// ==================== NAVIGATION ====================

const navbar           = document.getElementById('navbar');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu          = document.getElementById('navMenu');
const navLinks         = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 100);
});

mobileMenuToggle.addEventListener('click', () => {
  mobileMenuToggle.classList.toggle('active');
  navMenu.classList.toggle('active');
  document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
});

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileMenuToggle.classList.remove('active');
    navMenu.classList.remove('active');
    document.body.style.overflow = '';
  });
});

const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  const scrollY = window.pageYOffset;
  sections.forEach(section => {
    const top = section.offsetTop - 100;
    const id  = section.getAttribute('id');
    if (scrollY > top && scrollY <= top + section.offsetHeight) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + id) link.classList.add('active');
      });
    }
  });
});

// ==================== SMOOTH SCROLL ====================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
  });
});

// ==================== SCROLL ANIMATIONS ====================

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

const downloadResumeBtn = document.getElementById('downloadResume');

function triggerResumeDownload() {
  downloadResumeBtn && downloadResumeBtn.click();
}

downloadResumeBtn.addEventListener('click', (e) => {
  e.preventDefault();
  window.open('https://drive.google.com/file/d/1tFkQegqIbkAqQto67JUrYWfDC7HgdEDg/view?usp=sharing', '_blank');
});


// Embedded resume PDF (base64)
const RESUME_B64 = 'JVBERi0xLjQKJfbk/N8KMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovVmVyc2lvbiAvMS40Ci9QYWdlcyAyIDAgUgovTWV0YWRhdGEgMyAwIFIKL1N0cnVjdFRyZWVSb290IDQgMCBSCi9NYXJrSW5mbyA1IDAgUgovTGFuZyAoZW4pCi9WaWV3ZXJQcmVmZXJlbmNlcyA2IDAgUgo+PgplbmRvYmoK';


// ==================== COPY TO CLIPBOARD ====================

function copyToClipboard(text, cardEl) {
  if (!navigator.clipboard) {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    _showCopiedFeedback(cardEl, text);
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    _showCopiedFeedback(cardEl, text);
  }).catch(() => {
    showNotification('Could not copy. Please copy manually: ' + text, 'error');
  });
}

function _showCopiedFeedback(cardEl, text) {
  if (cardEl) {
    cardEl.classList.add('copied');
    const actionEl = cardEl.querySelector('.cc-action');
    if (actionEl) {
      const prev = actionEl.textContent;
      actionEl.textContent = '✓ Copied to clipboard!';
      setTimeout(() => {
        cardEl.classList.remove('copied');
        actionEl.textContent = prev;
      }, 2000);
    }
  }
  showNotification('Email address copied to clipboard!', 'success');
}


// ==================== NOTIFICATION ====================

function showNotification(message, type) {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const n = document.createElement('div');
  n.className = 'notification notification-' + type;

  const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
  n.innerHTML = '<i class="fas fa-' + (icons[type] || 'info-circle') + '" style="font-size:1.2rem"></i><span>' + message + '</span>';
  document.body.appendChild(n);

  setTimeout(() => {
    n.style.animation = 'slideOutRight 0.4s ease forwards';
    setTimeout(() => n.remove(), 400);
  }, 3500);
}


// ==================== PARALLAX ====================

window.addEventListener('scroll', () => {
  const bg = document.querySelector('.hero-background');
  if (bg) bg.style.transform = 'translateY(' + (window.pageYOffset * 0.5) + 'px)';
});


// ==================== PAGE LOAD ====================

window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  setTimeout(() => {
    document.body.style.transition = 'opacity 0.5s ease';
    document.body.style.opacity    = '1';
  }, 100);
});

console.log('%c🚀 Portfolio Loaded! ', 'background:#ffffff;color:#000;font-size:16px;padding:10px;border-radius:5px;font-weight:bold;');
console.log('%cDeveloped by Deva Jeshurun', 'color:#ffffff;font-size:12px;');
