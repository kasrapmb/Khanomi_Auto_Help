import './effects.css';

// Decorative effects never intercept clicks or replace the native cursor.
export function initEffects() {
 const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
 const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
 let preference = null;
 try { preference = localStorage.getItem('khanomi-motion'); } catch { /* storage may be disabled */ }
 const ambient = document.createElement('div');
 ambient.className = 'ambient';
 ambient.setAttribute('aria-hidden', 'true');
 ambient.innerHTML = '<span class="aurora aurora-one"></span><span class="aurora aurora-two"></span><span class="ambient-grid"></span>';
 document.body.prepend(ambient);
 const toggle = document.createElement('button');
 toggle.className = 'motion-toggle plain';
 toggle.type = 'button';
 toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/><path d="m20 2 .7 1.3L22 4l-1.3.7L20 6l-.7-1.3L18 4l1.3-.7Z"/></svg>';
 document.querySelector('.notification').before(toggle);
 let enabled = false;
 let frame = 0;
 let lastEvent;
 let illuminated = [];
 const resetPointer = () => {
  cancelAnimationFrame(frame); frame = 0;
  illuminated.forEach(el=>el.classList.remove('pointer-lit'));
  illuminated = [];
 };
 const applyMotion = () => {
  // The operating system's accessibility preference always takes priority.
  enabled = !systemMotion.matches && preference !== 'off';
  document.body.dataset.motion = enabled ? 'on' : 'off';
  toggle.setAttribute('aria-pressed', String(enabled));
  toggle.setAttribute('aria-label', systemMotion.matches ? 'حرکت طبق تنظیمات سیستم غیرفعال است' : enabled ? 'خاموش کردن جلوه‌های حرکتی' : 'روشن کردن جلوه‌های حرکتی');
  toggle.title = toggle.getAttribute('aria-label');
  if (!enabled) resetPointer();
 };
 toggle.onclick = () => {
  if(systemMotion.matches) return;
  preference = enabled ? 'off' : 'on';
  try { localStorage.setItem('khanomi-motion', preference); } catch { /* session-only preference */ }
  applyMotion();
 };
 systemMotion.addEventListener('change', applyMotion);
 finePointer.addEventListener('change', resetPointer);
 applyMotion();
 document.addEventListener('pointermove', event => {
  if (!enabled || !finePointer.matches || event.pointerType === 'touch') return;
  lastEvent = event;
  if(frame) return;
  frame = requestAnimationFrame(() => {
   frame = 0;
   const target = lastEvent.target;
   const targets = [...new Set([target.closest('.panel, .upgrade'), target.closest('button, .search')].filter(Boolean))];
   illuminated.filter(el=>!targets.includes(el)).forEach(el=>el.classList.remove('pointer-lit'));
   targets.forEach(el=>{
    const rect=el.getBoundingClientRect();
    el.style.setProperty('--pointer-x', `${lastEvent.clientX-rect.left}px`);
    el.style.setProperty('--pointer-y', `${lastEvent.clientY-rect.top}px`);
    el.classList.add('pointer-lit');
   });
   illuminated = targets;
  });
 }, {passive:true});
 document.documentElement.addEventListener('pointerleave', resetPointer);
 window.addEventListener('blur', resetPointer);
 document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('effects-paused', document.hidden);
  if(document.hidden) resetPointer();
 });
 document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if(!enabled || !button || button.disabled || button.classList.contains('plain')) return;
  const rect = button.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className='click-ripple'; ripple.setAttribute('aria-hidden','true');
  ripple.style.left=`${event.detail ? event.clientX-rect.left : rect.width/2}px`;
  ripple.style.top=`${event.detail ? event.clientY-rect.top : rect.height/2}px`;
  button.append(ripple);
  ripple.addEventListener('animationend', ()=>ripple.remove(), {once:true});
  // Cleanup also covers changing the motion preference during an animation.
  setTimeout(()=>ripple.remove(), 700);
 });
 const observer = new IntersectionObserver(entries=>{
  for(const entry of entries) if(entry.isIntersecting){
   entry.target.classList.add('effect-enter');
   observer.unobserve(entry.target);
  }
 }, {threshold:.12});
 document.querySelectorAll('.hero, .panel').forEach((el,i)=>{
  el.style.setProperty('--enter-delay', `${Math.min(i%5*65,260)}ms`);
  observer.observe(el);
 });
 // Stop observing after the one-time entrance sequence is complete.
 window.addEventListener('pagehide',()=>{observer.disconnect();resetPointer();},{once:true});
}
