(() => {
  'use strict';
  document.documentElement.classList.toggle('is-standalone', navigator.standalone === true || matchMedia('(display-mode: standalone)').matches);
  const stage = document.querySelector('.playground');
  const grid = document.querySelector('.tiles');
  const modes = document.querySelectorAll('[data-mode]');
  const sizeX = document.querySelector('#width');
  const sizeY = document.querySelector('#height');
  const intensity = document.querySelector('#intensity');
  const radius = document.querySelector('#radius');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animated = typeof gsap !== 'undefined';
  const palette = ['#ed5008', '#0065a6', '#008858', '#ffbc00', '#f2bdcb', '#20211f'];
  let mode = 'swap';
  let tiles = [], slots = [], occupants = [], bounds, cols, rows, width, height;
  let frame = 0, last = 0, previous = null;
  let sizeTimer = 0;
  let renderFrame = 0, building = false;
  let activity = performance.now();
  function pause() { activity = performance.now(); }
  function place(tile, slot, delay = 0) {
    tile.slot = slot;
    const target = slots[slot];
    if (!animated || reduced.matches) {
      if (animated) gsap.set(tile.el, { x: target.x, y: target.y });
      else tile.el.style.transform = `translate(${target.x}px, ${target.y}px)`;
      tile.busy = false;
      return;
    }
    tile.busy = true;
    gsap.to(tile.el, { x: target.x, y: target.y, duration: .6 - +intensity.value / 100 * .35, delay,
      ease: 'power2.inOut', overwrite: true, onComplete: () => { tile.busy = false; } });
  }
  function build() {
    cancelAnimationFrame(renderFrame);
    building = true;
    stage.setAttribute('aria-busy', 'true');
    clearTimeout(sizeTimer);
    sizeTimer = 0;
    pause();
    if (animated) gsap.killTweensOf(tiles.map(tile => tile.el));
    bounds = stage.getBoundingClientRect();
    const base = bounds.width / (bounds.width < 600 ? 10 : 20);
    cols = Math.max(2, Math.min(40, Math.round(bounds.width / (base * +sizeX.value / 100))));
    width = bounds.width / cols;
    rows = Math.max(2, Math.min(60, Math.round(bounds.height / (base * .28 * +sizeY.value / 100))));
    height = bounds.height / rows;
    const count = cols * rows;
    while (tiles.length > count) tiles.pop().el.remove();
    slots = []; occupants = []; previous = null;
    const fragment = document.createDocumentFragment();
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const id = row * cols + col;
        slots.push({ x: col * width, y: row * height });
        const band = Math.floor((row + (col % 4) * 2) / 5);
        const blank = (band + col * 3) % 7 < 2 || row < col * 7 % 5;
        let tile = tiles[id];
        if (!tile) {
          const el = document.createElement('div');
          el.className = 'tile';
          el.style.visibility = 'hidden';
          tile = { el };
          tiles.push(tile);
          fragment.append(el);
        }
        Object.assign(tile, { home: id, slot: id, blank, color: (band * 3 + col * 5 + Math.floor(row / 3)) % 6, busy: false });
        occupants.push(tile);
      }
    }
    grid.append(fragment);
    let index = 0;
    function render() {
      const batch = tiles.slice(index, index + 96);
      const start = index;
      batch.forEach(tile => {
        tile.el.style.width = `${width + .2}px`;
        tile.el.style.height = `${height + .2}px`;
        tile.el.style.background = tile.blank ? 'transparent' : palette[tile.color % palette.length];
      });
      if (animated) gsap.set(batch.map(tile => tile.el), { x: i => slots[start + i].x, y: i => slots[start + i].y });
      batch.forEach(tile => {
        if (!animated) tile.el.style.transform = `translate(${slots[tile.home].x}px, ${slots[tile.home].y}px)`;
        tile.el.style.visibility = '';
      });
      index += batch.length;
      if (index < tiles.length) renderFrame = requestAnimationFrame(render);
      else {
        renderFrame = 0; building = false;
        stage.setAttribute('aria-busy', 'false');
        pause();
      }
    }
    render();
  }
  function restore() {
    pause();
    if (sizeTimer) { build(); return; }
    if (building) return;
    const moved = tiles.filter(tile => tile.slot !== tile.home || tile.busy);
    if (animated) gsap.killTweensOf(moved.map(tile => tile.el));
    occupants = [...tiles];
    moved.forEach(tile => place(tile, tile.home, reduced.matches ? 0 : tile.home % cols * .012));
    previous = null;
  }
  function swap(a, b, delay) {
    const first = occupants[a], second = occupants[b];
    if (!first || !second || first.busy || second.busy) return;
    occupants[a] = second; occupants[b] = first;
    place(first, b, delay); place(second, a, delay);
  }
  function move(event) {
    if (reduced.matches || !animated || (event.pointerType !== 'mouse' && !event.buttons)) return;
    pause();
    const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
    const now = performance.now();
    if (+intensity.value === 0 || now - last < 90 || (previous && Math.hypot(x - previous.x, y - previous.y) < width * .35)) return;
    const direction = previous && x < previous.x ? -1 : 1;
    previous = { x, y }; last = now;
    rearrange(x, y, direction);
  }
  function rearrange(x, y, direction) {
    if (building || sizeTimer || +intensity.value === 0) return;
    const reach = +radius.value * height;
    const candidates = [];
    const minCol = Math.max(0, Math.ceil((x - reach) / width - .5));
    const maxCol = Math.min(cols - 1, Math.floor((x + reach) / width - .5));
    const minRow = Math.max(0, Math.ceil((y - reach) / height - .5));
    const maxRow = Math.min(rows - 1, Math.floor((y + reach) / height - .5));
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const id = row * cols + col;
        const slot = slots[id];
        const distance = Math.hypot(slot.x + width / 2 - x, slot.y + height / 2 - y);
        if (distance < reach) candidates.push({ id, distance });
      }
    }
    candidates.sort((a, b) => a.distance - b.distance);
    const used = new Set();
    for (const candidate of candidates) {
      const a = candidate.id, row = Math.floor(a / cols), col = a % cols;
      const vertical = mode === 'cascade' || (mode === 'weave' && col % 2 === 0);
      const b = vertical ? (row + 1 < rows ? a + cols : a - cols) : (col + direction >= 0 && col + direction < cols ? a + direction : a - direction);
      const target = slots[b];
      if (used.has(a) || used.has(b) || occupants[a].busy || occupants[b].busy ||
          Math.hypot(target.x + width / 2 - x, target.y + height / 2 - y) >= reach) continue;
      swap(a, b, mode === 'cascade' ? candidate.distance / reach * .3 : 0);
      used.add(a); used.add(b);
    }
  }
  stage.addEventListener('pointermove', move);
  stage.addEventListener('pointerdown', event => { stage.setPointerCapture(event.pointerId); previous = null; move(event); });
  for (const name of ['pointerleave', 'pointercancel', 'pointerup']) stage.addEventListener(name, () => { previous = null; });
  modes.forEach(button => button.addEventListener('click', () => {
    pause();
    mode = button.dataset.mode;
    modes.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    previous = null;
  }));
  document.querySelector('.reset').addEventListener('click', event => {
    restore();
    const button = event.currentTarget;
    button.classList.remove('is-active');
    void button.offsetWidth;
    button.classList.add('is-active');
  });
  function updateRangeVisual(input) {
    const progress = (+input.value - +input.min) / (+input.max - +input.min);
    input.parentElement.style.setProperty('--range-progress', progress);
  }
  [intensity, radius, sizeX, sizeY].forEach(updateRangeVisual);
  [intensity, radius, sizeX, sizeY].forEach(input => input.addEventListener('input', () => {
    updateRangeVisual(input);
    pause();
    document.querySelector(`#${input.id}-value`).value = input.value + (input === radius ? '칸' : '%');
    if (input === sizeX || input === sizeY) {
      cancelAnimationFrame(renderFrame);
      clearTimeout(sizeTimer);
      sizeTimer = setTimeout(build, 160);
    }
  }));
  [sizeX, sizeY].forEach(input => input.addEventListener('change', () => {
    if (sizeTimer) build();
  }));
  reduced.addEventListener('change', restore);
  new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(build); }).observe(stage);
  build();
  if (animated) setInterval(() => {
    if (document.hidden || reduced.matches || building || sizeTimer || performance.now() - activity < 1800) return;
    const slot = slots[Math.floor(Math.random() * slots.length)];
    rearrange(slot.x + width / 2, slot.y + height / 2, Math.random() < .5 ? -1 : 1);
  }, 1400);
  document.addEventListener('visibilitychange', pause);
  if (!animated) {
    const status = document.querySelector('.status');
    status.textContent = 'Connect to the internet and reload to enable block exchanges.';
    status.hidden = false;
  }
})();
