(() => {
 const cards=Array.from(document.querySelectorAll('[data-clinic-photo]'));
 const order=cards.slice(1).concat(cards.slice(0,1));
 function arrange(){order.forEach((card,i)=>{const front=i===order.length-1;card.classList.toggle('is-front',front);card.classList.toggle('is-middle',!front&&i>0);card.style.zIndex=String(i+1);card.setAttribute('aria-pressed',String(front));});}
 cards.forEach(card=>card.addEventListener('click',()=>{if(order[order.length-1]===card)order.unshift(order.pop());else{order.splice(order.indexOf(card),1);order.push(card);}arrange();}));
 arrange();
})();