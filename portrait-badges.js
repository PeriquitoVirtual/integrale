(() => {
 const hero=document.querySelector('.hero'),badges=[...document.querySelectorAll('.portrait-badge')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,x=0,y=0;
 function paint(){frame=0;badges.forEach((el,i)=>{const depth=i?6:8;el.style.setProperty('--badge-x',`${x*depth}px`);el.style.setProperty('--badge-y',`${y*depth}px`);});}
 hero.addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType!=='mouse')return;const r=hero.getBoundingClientRect();x=(e.clientX-r.left)/r.width-.5;y=(e.clientY-r.top)/r.height-.5;if(!frame)frame=requestAnimationFrame(paint);},{passive:true});
 hero.addEventListener('pointerleave',()=>{x=y=0;if(!frame)frame=requestAnimationFrame(paint);});
 new IntersectionObserver(entries=>{badges.forEach(el=>el.querySelector('.portrait-badge-body').style.animationPlayState=entries[0].isIntersecting?'running':'paused');}).observe(hero);
})();