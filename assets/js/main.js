/* Studio Perpetuélle · proposta de abertura v1 */
(() => {
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* menu */
  const nav = document.getElementById('nav'), botao = document.getElementById('abrir-menu'), menu = document.getElementById('menu');
  botao.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto');
    botao.setAttribute('aria-expanded', aberto);
    document.body.style.overflow = aberto ? 'hidden' : '';
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('aberto'); botao.setAttribute('aria-expanded', false); document.body.style.overflow = '';
  }));

  /* fios animados dentro do losango */
  const canvas = document.getElementById('fios'), ctx = canvas.getContext('2d');
  const CORES = ['#F3D9A6', '#E2BC7E', '#C99A5C', '#A8784A', '#FBEBC8', '#8A5636', '#C68E5E', '#DDAA77', '#5A3423', '#6B4A2E'];
  let W = 0, H = 0, fios = [];
  let semente = 11; const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
  function prepara() {
    const dpr = Math.min(devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
    W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    semente = 11; const n = Math.round(clamp(W * .75, 160, 420));
    fios = Array.from({length: n}, () => ({
      x: -W * .2 + rnd() * W * 1.4, cor: CORES[Math.floor(rnd() * CORES.length)],
      w: .5 + rnd() * 1.9, a: .3 + rnd() * .65, f: rnd() * Math.PI * 2, amp: .6 + rnd() * .8
    }));
  }
  function desenha(t) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#9C6E3E'); g.addColorStop(.5, '#5C3A22'); g.addColorStop(1, '#22150D');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const A = W * .09, s = t * .00045;
    for (const f of fios) {
      const o1 = Math.sin(s + f.f) * A * .35 * f.amp, o2 = Math.cos(s * .8 + f.f) * A * .3 * f.amp;
      ctx.beginPath(); ctx.moveTo(f.x, -20);
      ctx.bezierCurveTo(f.x + A + o1, H * .3, f.x - A + o2, H * .62, f.x + A * .5 + o1 * .5, H + 20);
      ctx.strokeStyle = f.cor; ctx.globalAlpha = f.a; ctx.lineWidth = f.w; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  let visivel = true;
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }).observe(canvas);
  function loop(t) { if (visivel) desenha(t); requestAnimationFrame(loop); }
  prepara(); desenha(0); if (!reduz) requestAnimationFrame(loop);
  addEventListener('resize', () => { prepara(); desenha(performance.now()); });

  /* rolagem: abertura + Ponto Brasileiro */
  const hero = document.getElementById('hero'), ponto = document.getElementById('ponto-brasileiro');
  const frase = document.getElementById('frase');
  // quebra a frase em palavras, preservando o <em>
  (function quebra(no) {
    [...no.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) frag.append(p);
          else { const s = document.createElement('span'); s.className = 'pal'; s.textContent = p; frag.append(s); }
        });
        n.replaceWith(frag);
      } else quebra(n);
    });
  })(frase);
  const palavras = [...frase.querySelectorAll('.pal')];
  const pa = document.getElementById('pb-a'), pb = document.getElementById('pb-b');
  const la = pa.getTotalLength(), lb = pb.getTotalLength();
  pa.style.strokeDasharray = la; pb.style.strokeDasharray = lb;

  function rolar() {
    const y = scrollY, vh = innerHeight;
    nav.classList.toggle('rolou', y > 40);
    hero.style.setProperty('--p', reduz ? 0 : clamp(y / (hero.offsetHeight * .9)).toFixed(3));

    const r = ponto.getBoundingClientRect();
    const p = reduz ? 1 : clamp(-r.top / (r.height - vh));
    pa.style.strokeDashoffset = la * (1 - clamp(p / .45));
    pb.style.strokeDashoffset = lb * (1 - clamp((p - .1) / .45));
    ponto.style.setProperty('--pc', clamp((p - .5) / .15).toFixed(3));
    const nPal = Math.round(clamp((p - .05) / .6) * palavras.length);
    palavras.forEach((w, i) => w.classList.toggle('on', i < nPal));
    ponto.style.setProperty('--fim', clamp((p - .68) / .15).toFixed(3));
  }

  /* revelar ao rolar */
  const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); obs.unobserve(e.target); } }), {threshold: .15});
  document.querySelectorAll('.revela').forEach(el => obs.observe(el));

  /* WhatsApp do salão: preencher com DDI+DDD+número (ex.: 5551999999999) quando o salão enviar */
  const WHATSAPP = '';
  const linkWhats = msg => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  document.getElementById('whats-contato').href = linkWhats('Olá! Vim pelo site da Perpetuélle e quero agendar uma avaliação.');

  /* monte seu mega hair */
  const form = document.getElementById('monte');
  const valor = n => form.querySelector(`input[name="${n}"]:checked`)?.value || '';
  function atualizaResumo() { ['metodo', 'comprimento', 'cor'].forEach(n => { document.getElementById('r-' + n).textContent = valor(n); }); }
  form.addEventListener('change', atualizaResumo); atualizaResumo();
  document.getElementById('enviar-monte').addEventListener('click', () => {
    const nome = document.getElementById('r-nome').value.trim();
    const msg = `Olá! ${nome ? 'Sou ' + nome + ' e ' : ''}montei meu mega hair no site da Perpetuélle:\n\n` +
      `• Método: ${valor('metodo')}\n• Comprimento: ${valor('comprimento')}\n• Cor: ${valor('cor')}\n\nGostaria de agendar uma avaliação.`;
    window.open(linkWhats(msg), '_blank', 'noopener');
  });

  /* antes e depois (ilustrações até chegarem as fotos reais) */
  function pintaFios(cv, {seed, comp, fundo, cores}) {
    const r = cv.getBoundingClientRect();
    if (!r.width) return;
    const dpr = Math.min(devicePixelRatio || 1, 2), c = cv.getContext('2d');
    cv.width = r.width * dpr; cv.height = r.height * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = r.width, h = r.height; let sd = seed; const rn = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, fundo[0]); g.addColorStop(1, fundo[1]);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const A = w * .08;
    for (let i = 0; i < 380; i++) {
      const x = w * .08 + rn() * w * .84, fim = h * comp * (.86 + rn() * .14);
      c.beginPath(); c.moveTo(x, -10);
      c.bezierCurveTo(x + A, fim * .35, x - A, fim * .7, x + A * .4, fim);
      c.strokeStyle = cores[Math.floor(rn() * cores.length)]; c.globalAlpha = .3 + rn() * .65; c.lineWidth = .5 + rn() * 1.7; c.stroke();
    }
    c.globalAlpha = 1;
  }
  const ad = document.getElementById('ad'), adR = document.getElementById('ad-range');
  function pintaAD() {
    pintaFios(document.getElementById('ad-antes'), {seed: 5, comp: .38, fundo: ['#1c1714', '#0b0908'], cores: ['#6B4A2E', '#8A5636', '#5A3423', '#A8784A']});
    pintaFios(document.getElementById('ad-depois'), {seed: 9, comp: 1.08, fundo: ['#2a1d12', '#120c07'], cores: ['#F3D9A6', '#E2BC7E', '#C99A5C', '#A8784A', '#FBEBC8', '#8A5636', '#DDAA77']});
  }
  adR.addEventListener('input', () => ad.style.setProperty('--pos', adR.value + '%'));
  pintaAD(); addEventListener('resize', pintaAD);

  /* botão fixo de agendar (celular): aparece depois da abertura e some no contato */
  const fixo = document.getElementById('agendar-fixo'), contato = document.getElementById('agendar');
  function botaoFixo() {
    const passouHero = scrollY > hero.offsetHeight * .8;
    const noContato = contato.getBoundingClientRect().top < innerHeight;
    const rm = form.getBoundingClientRect(), noMonte = rm.top < innerHeight && rm.bottom > 0;
    fixo.classList.toggle('mostra', passouHero && !noContato && !noMonte);
  }
  addEventListener('scroll', botaoFixo, {passive: true});

  addEventListener('scroll', rolar, {passive: true}); addEventListener('resize', rolar); rolar();

})();
