(() => {
 document.querySelectorAll('[data-contact]').forEach(a => {
 const prefix = 'Olá, estive no site de vocês';
 const label = (a.getAttribute('aria-label') || a.querySelector('.upw-btn-plane__label, .upw-btn-ink__label')?.textContent || a.textContent).trim();
 const service = a.dataset.service;
 const message = service
   ? `${prefix} e gostaria de informações sobre ${service.charAt(0).toLowerCase() + service.slice(1)}.`
   : /consulta/i.test(label)
     ? `${prefix} e gostaria de marcar uma consulta.`
     : /avaliação/i.test(label)
       ? `${prefix} e gostaria de agendar uma avaliação.`
       : `${prefix} e gostaria de conversar com a equipe sobre o atendimento da clínica.`;
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