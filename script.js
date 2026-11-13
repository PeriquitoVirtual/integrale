(() => {
  // Personalize o WhatsApp com DDI + DDD + número. Vazio = demonstração, sem envio.
  const CONFIG = { whatsapp: '', businessName: document.body.dataset.brand };
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionOff = reduced.matches;
  const motionButton = document.querySelector('.motion-toggle');
  const updateMotion = () => { root.classList.toggle('motion-off', motionOff); motionButton.textContent = motionOff ? 'Ativar animações' : 'Pausar animações'; motionButton.setAttribute('aria-pressed', String(motionOff)); };
  updateMotion(); motionButton.addEventListener('click', () => { motionOff = !motionOff; updateMotion(); });
  reduced.addEventListener('change', e => { motionOff = e.matches; updateMotion(); });
  const nav = document.querySelector('.navigation'), menu = document.querySelector('.menu-toggle');
  const closeMenu = () => { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); };
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if(e.key==='Escape') closeMenu(); });
  document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if(!a) return; const id=a.getAttribute('href').slice(1); const target=id?document.getElementById(id):document.body; if(!target)return; e.preventDefault(); target.scrollIntoView({behavior:motionOff?'auto':'smooth',block:'start'}); });
  if('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => { for(const e of entries) if(e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }, {threshold:.09});
    document.querySelectorAll('[data-reveal]').forEach((el,i) => { el.classList.add('will-reveal'); el.style.transitionDelay = `${(i%3)*70}ms`; io.observe(el); });
    const floater = document.querySelector('.floating-cta');
    new IntersectionObserver(entries => { floater.classList.toggle('is-visible',!entries[0].isIntersecting); floater.tabIndex = entries[0].isIntersecting ? -1 : 0; },{threshold:0}).observe(document.querySelector('.hero'));
  }
  const dialog=document.querySelector('.dialog'), form=dialog.querySelector('form'), service=dialog.querySelector('select'), output=dialog.querySelector('output');
  let opener;
  document.querySelectorAll('[data-contact]').forEach(button=>button.addEventListener('click',()=>{ opener=button; closeMenu(); form.reset(); output.textContent=''; dialog.querySelector('.message-ready').hidden=true; dialog.querySelector('.send-ready').hidden=true; if(button.dataset.service)service.value=button.dataset.service; dialog.showModal(); document.body.classList.add('modal-open'); }));
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');if(opener)opener.focus();});
  form.addEventListener('submit',e=>{
    e.preventDefault(); if(!form.reportValidity())return;
    const message=`Olá, ${CONFIG.businessName}! Gostaria de saber mais sobre ${service.value.toLowerCase()}. ${dialog.querySelector('textarea').value.trim()}`.trim();
    const box=dialog.querySelector('.message-ready');box.textContent=message;box.hidden=false;
    const link=dialog.querySelector('.send-ready');
    if(/^\d{10,15}$/.test(CONFIG.whatsapp)){link.href='https://wa.me/'+CONFIG.whatsapp+'?text='+encodeURIComponent(message);link.hidden=false;output.textContent='Mensagem pronta. Abra o WhatsApp para revisar e enviar.';}
    else{output.textContent='Prévia do modelo: nenhuma mensagem foi enviada. O WhatsApp será habilitado após configurar o número do negócio.';}
  });
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    const container=button.closest('.services');
    container.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    container.querySelectorAll('.service-shell').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.group!==button.dataset.filter;});
  }));
})();
