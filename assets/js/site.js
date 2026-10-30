(function(){
  var root=document.querySelector('.sbh'); if(!root) return; root.classList.add('js');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fade-up on scroll
  var els=root.querySelectorAll('.rv');
  if('IntersectionObserver' in window && !reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(el){io.observe(el);});
  } else { els.forEach(function(el){el.classList.add('in');}); }

  // "A bit about me": words darken as you scroll
  root.querySelectorAll('[data-words]').forEach(function(p){
    var words=p.textContent.trim().split(/\s+/);
    p.innerHTML=words.map(function(w){return '<span class="w">'+w+'</span> ';}).join('');
    var spans=p.querySelectorAll('.w');
    var paint=function(){
      var r=p.getBoundingClientRect(), vh=window.innerHeight;
      var prog=reduce?1:Math.min(1,Math.max(0,(vh*0.85-r.top)/(r.height+vh*0.35)));
      var n=Math.round(prog*spans.length);
      spans.forEach(function(s,i){s.classList.toggle('on',i<n);});
    };
    window.addEventListener('scroll',paint,{passive:true}); window.addEventListener('resize',paint); paint();
  });

  // Timeline fills as you scroll
  var tl=root.querySelector('[data-tline]');
  if(tl){
    var fill=tl.querySelector('.tl-fill'), items=tl.querySelectorAll('.ti');
    var tick=function(){
      var r=tl.getBoundingClientRect(), mid=window.innerHeight*0.55;
      var prog=reduce?1:Math.min(1,Math.max(0,(mid-r.top)/r.height));
      fill.style.height=(prog*100)+'%';
      items.forEach(function(li){li.classList.toggle('lit',reduce||li.getBoundingClientRect().top<mid);});
    };
    window.addEventListener('scroll',tick,{passive:true}); window.addEventListener('resize',tick); tick();
  }

  // Result bars grow to their real length
  var rows=root.querySelector('[data-bars]');
  if(rows){
    var grow=function(){
      rows.querySelectorAll('.row').forEach(function(row){
        var bar=row.querySelector('.bar'); if(!bar) return;
        var w=parseFloat(bar.getAttribute('data-w'));
        bar.style.width=w+'%';
        row.querySelector('.val').style.left='calc('+w+'% - 8px)';
      });
    };
    rows.querySelectorAll('.row .bar').forEach(function(b){var v=b.parentNode.querySelector('.val');v.style.left='calc(40% - 8px)';b.style.width='40%';});
    if('IntersectionObserver' in window && !reduce){
      var io2=new IntersectionObserver(function(es){if(es[0].isIntersecting){grow();io2.disconnect();}},{threshold:.3});
      io2.observe(rows);
    } else grow();
  }
  // Blog topic filter
  var tb=root.querySelector('.bl-topics'), cards=root.querySelectorAll('[data-posts] .bl-card');
  if(tb){tb.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
    tb.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b);});
    var t=b.getAttribute('data-topic');cards.forEach(function(c){c.hidden=!(t==='all'||c.getAttribute('data-topic')===t);c.classList.add('in');});});}
})();
