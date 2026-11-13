(() => {
 document.querySelectorAll('[data-contact]').forEach(a => {
 const message = a.dataset.service ? `Olá, Clínica Integrale! Gostaria de informações sobre a avaliação para ${a.dataset.service}.` : 'Olá, Clínica Integrale! Gostaria de informações para agendar uma avaliação.';
 a.href='https://wa.me/5562992858823?text='+encodeURIComponent(message); a.target='_blank'; a.rel='noopener noreferrer';
 });
 const menu=document.querySelector('.menu'), nav=document.querySelector('#nav');
 function closeMenu(){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');}
 menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
 nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
 const privacy=document.querySelector('#privacy');
 document.querySelector('#privacy-open').addEventListener('click',()=>privacy.showModal());
 document.querySelector('#privacy-close').addEventListener('click',()=>privacy.close());
})();