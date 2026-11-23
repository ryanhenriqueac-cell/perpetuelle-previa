/* Studio Perpetuélle · prévia do site */
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

  /* ===== cachos: ilustração no lugar das fotos/vídeos reais (até chegarem) ===== */
  const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const PALETAS = {
    mel:      {fundo: ['#4a2e18', '#1c1009'], cores: ['#F3D9A6', '#E2BC7E', '#C99A5C', '#A8784A', '#FBEBC8', '#DDAA77']},
    castanho: {fundo: ['#3a2415', '#140b06'], cores: ['#A9714A', '#C68E5E', '#8A5636', '#DDAA77', '#6B4A2E']},
    preto:    {fundo: ['#221c1d', '#0a0809'], cores: ['#4A3E41', '#6B5C5F', '#2F2628', '#8C7C7E', '#3a3033']},
    loiro:    {fundo: ['#5a4126', '#24180c'], cores: ['#FBEBC8', '#F3D9A6', '#EBCB92', '#E2BC7E', '#FFF4DC']},
    cobre:    {fundo: ['#4a2210', '#180a04'], cores: ['#C8693A', '#E08A55', '#A4512A', '#F0A877', '#7E3A1C']},
    antes:    {fundo: ['#1c1714', '#0b0908'], cores: ['#6B4A2E', '#8A5636', '#5A3423', '#7a5a3e']}
  };
  function criaCachos(W, H, {seed, comp = 1, cores, escala = 1, pMul = 1, BMul = 1}) {
    const r = rng(seed), base = Math.max(7, W * .042 * escala), lista = [];
    for (const camada of [0, 1]) {               // 0 = fundo (mais escuro e transparente), 1 = frente
      const n = Math.ceil((W + base * 2) / (base * (camada ? 1.5 : 1.8)));
      for (let i = 0; i < n; i++) {
        const A = base * (.65 + r() * .7);
        lista.push({
          x: -base + r() * (W + base * 2), A, B: A * (.22 + r() * .22) * BMul, p: A * (.3 + r() * .14) * pMul,
          fase: r() * 6.28, f2: r() * 6.28, f3: r() * 6.28, deriva: A * (.4 + r() * .6),
          y0: -20 - r() * 50 + (camada ? r() * H * .1 : 0), fim: H * comp * (.78 + r() * .26),
          fios: Array.from({length: 7}, () => ({
            dx: (r() - .5) * A * .55, df: (r() - .5) * 1.1, cor: cores[Math.floor(r() * cores.length)],
            w: .7 + r() * 1.4, a: camada ? .5 + r() * .5 : .18 + r() * .25
          }))
        });
      }
    }
    return lista;
  }
  function pintaCachos(c, W, H, cachos, fundo, t = 0) {
    if (fundo) { const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, fundo[0]); g.addColorStop(1, fundo[1]); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const k of cachos) {
      for (const f of k.fios) {
        c.beginPath();
        let y = k.y0, th = 0, primeiro = true;
        while (y < k.fim) {
          const amp = k.A * (.8 + .3 * Math.sin(th * .13 + k.f2));          // diâmetro do cacho varia
          const x = k.x + f.dx + k.deriva * Math.sin(th * .05 + k.f3) + amp * Math.sin(th + k.fase + f.df);
          const yy = y + k.B * Math.cos(th + k.fase + f.df);
          primeiro ? c.moveTo(x, yy) : c.lineTo(x, yy); primeiro = false;
          th += .42; y += k.p * .42 * (1 + .25 * Math.sin(th * .07 + k.f3));  // passo do cacho varia
        }
        c.strokeStyle = f.cor; c.globalAlpha = f.a; c.lineWidth = f.w; c.stroke();
      }
    }
    c.globalAlpha = 1;
  }
  function preparaCanvas(cv) {
    const r = cv.getBoundingClientRect();
    if (!r.width) return null;
    const dpr = Math.min(devicePixelRatio || 1, 2), c = cv.getContext('2d');
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return {c, W: r.width, H: r.height};
  }
  function cachosEstaticos(cv, nome, opts = {}) {
    const p = preparaCanvas(cv); if (!p) return;
    const pal = PALETAS[nome];
    pintaCachos(p.c, p.W, p.H, criaCachos(p.W, p.H, {seed: opts.seed || 7, comp: opts.comp || 1.1, escala: opts.escala || 1.3, pMul: opts.pMul || 1, BMul: opts.BMul || 1, cores: pal.cores}), pal.fundo);
  }

  /* abertura: cachos animados dentro do losango.
     Os cachos são desenhados uma vez em 5 camadas; a cada quadro cada camada só balança (inclinação leve). */
  const canvas = document.getElementById('fios');
  let heroC = null, camadas = [];
  function preparaHero() {
    heroC = preparaCanvas(canvas); if (!heroC) return;
    const {W, H} = heroC, dpr = Math.min(devicePixelRatio || 1, 1.5);
    const todos = criaCachos(W, H, {seed: 11, comp: 1.15, cores: [...PALETAS.mel.cores, ...PALETAS.castanho.cores]});
    camadas = Array.from({length: 5}, (_, g) => {
      const off = document.createElement('canvas'); off.width = Math.round(W * dpr); off.height = Math.round(H * dpr);
      const oc = off.getContext('2d'); oc.setTransform(dpr, 0, 0, dpr, 0, 0);
      pintaCachos(oc, W, H, todos.filter((_, i) => i % 5 === g), null);
      return {off, fase: g * 1.3};
    });
  }
  function desenhaHero(t) {
    if (!heroC) return;
    const {c, W, H} = heroC, dpr = Math.min(devicePixelRatio || 1, 2), f = PALETAS.castanho.fundo;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, f[0]); g.addColorStop(1, f[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (const k of camadas) {
      const balanco = Math.sin(t * .0007 + k.fase) * W * .012, mola = 1 + Math.sin(t * .0011 + k.fase) * .012;
      c.setTransform(dpr, 0, dpr * balanco / H, dpr * mola, 0, 0);
      c.drawImage(k.off, 0, 0, W, H);
    }
  }
  let visivel = true;
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }).observe(canvas);
  function loop(t) { if (visivel) desenhaHero(t); requestAnimationFrame(loop); }
  preparaHero(); desenhaHero(0); if (!reduz) requestAnimationFrame(loop);
  addEventListener('resize', () => { preparaHero(); desenhaHero(performance.now()); });

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

  /* transformações: antes e depois + mosaico (ilustrações até chegarem as fotos reais) */
  const ad = document.getElementById('ad'), adR = document.getElementById('ad-range');
  function pintaTransf() {
    cachosEstaticos(document.getElementById('ad-antes'), 'antes', {seed: 5, comp: .42, escala: 1});
    cachosEstaticos(document.getElementById('ad-depois'), 'mel', {seed: 9, comp: 1.15, escala: 1.25});
    document.querySelectorAll('canvas[data-cachos]').forEach((cv, i) => cachosEstaticos(cv, cv.dataset.cachos, {seed: 20 + i * 7}));
  }
  adR.addEventListener('input', () => ad.style.setProperty('--pos', adR.value + '%'));
  pintaTransf(); addEventListener('resize', pintaTransf);

  /* o cabelo: escolha com prévia ilustrada + mensagem pronta no WhatsApp */
  const form = document.getElementById('monte');
  const valor = n => form.querySelector(`input[name="${n}"]:checked`)?.value || '';
  const FORMAS = {
    Ondulado: {escala: 1.7, pMul: 2.8, BMul: .25},
    Cacheado: {escala: 1.2, pMul: 1, BMul: 1},
    Crespo:   {escala: .62, pMul: .75, BMul: 1.4}
  };
  const COR_PALETA = {Preto: 'preto', Castanho: 'castanho', Mel: 'mel', Loiro: 'loiro', Acobreado: 'cobre'};
  const COMP = {'Médio': .62, 'Longo': .9, 'Extra longo': 1.15, 'Ainda não sei': .9};
  function previaCabelo() {
    const cv = document.getElementById('previa-cabelo');
    cachosEstaticos(cv, COR_PALETA[valor('cor')] || 'castanho', {seed: 31, comp: COMP[valor('comprimento')] || .9, ...FORMAS[valor('curvatura')]});
  }
  function miniaturas() {
    document.querySelectorAll('canvas[data-forma]').forEach(cv => {
      const nome = cv.dataset.forma[0].toUpperCase() + cv.dataset.forma.slice(1);
      cachosEstaticos(cv, 'castanho', {seed: 13, comp: 1.2, ...FORMAS[nome], escala: FORMAS[nome].escala * 1.6});
    });
  }
  function atualizaResumo() {
    ['curvatura', 'cor', 'comprimento', 'servico'].forEach(n => { document.getElementById('r-' + n).textContent = valor(n); });
    previaCabelo();
  }
  form.addEventListener('change', atualizaResumo);
  miniaturas(); atualizaResumo();
  addEventListener('resize', () => { miniaturas(); previaCabelo(); });
  document.getElementById('enviar-monte').addEventListener('click', () => {
    const nome = document.getElementById('r-nome').value.trim();
    const msg = `Olá! ${nome ? 'Sou ' + nome + ' e ' : ''}montei meu cabelo no site da Perpetuélle:\n\n` +
      `• Curvatura: ${valor('curvatura')}\n• Cor: ${valor('cor')}\n• Comprimento: ${valor('comprimento')}\n• Quero: ${valor('servico')}\n\n` +
      (valor('servico') === 'Só o cabelo' ? 'Gostaria de saber os valores e como comprar no salão.' : 'Gostaria de saber os valores e marcar uma avaliação.');
    window.open(linkWhats(msg), '_blank', 'noopener');
  });

  /* jornada: no computador a lista desliza na horizontal conforme a rolagem; no celular a linha vertical se preenche */
  const jornada = document.getElementById('jornada'), trilho = document.getElementById('jornada-trilho');
  const lista = jornada.querySelector('.jornada__lista'), etapas = [...lista.children], linhaJ = jornada.querySelector('.jornada__linha');
  const ehCelular = () => innerWidth <= 900;
  let deslize = 0;
  function medeJornada() {
    document.querySelectorAll('canvas[data-etapa]').forEach((cv, i) =>
      cachosEstaticos(cv, cv.dataset.etapa, {seed: 50 + i * 9, comp: cv.dataset.etapa === 'antes' ? .45 : 1.15, escala: 1.4}));
    if (ehCelular() || reduz) { jornada.style.height = ''; deslize = 0; lista.style.setProperty('--x', '0px'); return; }
    deslize = Math.max(0, lista.scrollWidth - trilho.clientWidth + parseFloat(getComputedStyle(trilho).paddingLeft) * 2);
    jornada.style.height = (innerHeight + deslize) + 'px';
  }
  function rolaJornada() {
    const r = jornada.getBoundingClientRect();
    let p;
    if (ehCelular() || reduz) {
      const rl = linhaJ.getBoundingClientRect();
      p = clamp((innerHeight * .7 - rl.top) / rl.height);
    } else {
      p = deslize ? clamp(-r.top / deslize) : 0;
      lista.style.setProperty('--x', (-p * deslize).toFixed(1) + 'px');
    }
    linhaJ.style.setProperty('--prog', p.toFixed(3));
    etapas.forEach((e, i) => e.classList.toggle('ativa', p >= i / (etapas.length - 1) - .02));
  }
  medeJornada(); rolaJornada();
  addEventListener('resize', () => { medeJornada(); rolaJornada(); });
  addEventListener('scroll', rolaJornada, {passive: true});

  /* tradição: contador 0 → 15 quando aparece na tela */
  const contador = document.getElementById('contador');
  if (!reduz) {
    contador.textContent = '0';
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return; o.disconnect();
      const ate = +contador.dataset.ate, t0 = performance.now(), dur = 1600;
      const passo = t => { const p = clamp((t - t0) / dur), ease = 1 - Math.pow(1 - p, 3);
        contador.textContent = Math.round(ease * ate); if (p < 1) requestAnimationFrame(passo); };
      requestAnimationFrame(passo);
    }, {threshold: .6}).observe(contador);
  }

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
