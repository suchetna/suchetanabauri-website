(function(){
  var root=document.querySelector('.sbh'); if(!root) return; root.classList.add('js');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fade-up on scroll
  var els=root.querySelectorAll('.rv');
  if('IntersectionObserver' in window && !reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(el){io.observe(el);});
  } else { els.forEach(function(el){el.classList.add('in');}); }

  // Words darken as you scroll (any element with data-words; keeps <em>, <br> etc.)
  root.querySelectorAll('[data-words]').forEach(function(p){
    var walk=document.createTreeWalker(p,NodeFilter.SHOW_TEXT),nodes=[],n;
    while((n=walk.nextNode()))nodes.push(n);
    nodes.forEach(function(t){
      if(!t.nodeValue.trim())return;
      var f=document.createDocumentFragment();
      t.nodeValue.split(/(\s+)/).forEach(function(w){
        if(!w)return;
        if(/^\s+$/.test(w)){f.appendChild(document.createTextNode(w));return;}
        var s=document.createElement('span');s.className='w';s.textContent=w;f.appendChild(s);
      });
      t.parentNode.replaceChild(f,t);
    });
    var spans=p.querySelectorAll('.w');
    var paint=function(){
      var r=p.getBoundingClientRect(), vh=window.innerHeight;
      var prog=reduce?1:Math.min(1,Math.max(0,(vh*0.85-r.top)/(r.height+vh*0.35)));
      var k=Math.round(prog*spans.length);
      spans.forEach(function(s,i){s.classList.toggle('on',i<k);});
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

  // Service hero: rotating sphere of dots that connect (original animation)
  root.querySelectorAll('canvas[data-orb]').forEach(function(cv){
    var ctx=cv.getContext('2d'),N=340,pts=[],ga=Math.PI*(3-Math.sqrt(5));
    for(var i=0;i<N;i++){var y=1-(i/(N-1))*2,r=Math.sqrt(1-y*y),t=ga*i;pts.push({x:Math.cos(t)*r,y:y,z:Math.sin(t)*r,lit:0,d:Math.random()*6});}
    // pairs of near neighbours for connecting lines
    var links=[];for(var a=0;a<N;a++){for(var b=a+1;b<N;b++){var dx=pts[a].x-pts[b].x,dy=pts[a].y-pts[b].y,dz=pts[a].z-pts[b].z;if(dx*dx+dy*dy+dz*dz<0.034)links.push([a,b]);}}
    var W=0,H=0,dpr=Math.min(2,window.devicePixelRatio||1),rotY=0,tiltX=-0.35,tx=0,ty=0,cx=0,cy=0,start=performance.now(),vis=true;
    function size(){var r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
    size();window.addEventListener('resize',size);
    window.addEventListener('mousemove',function(e){var r=cv.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5);ty=((e.clientY-r.top)/r.height-.5);},{passive:true});
    if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;}).observe(cv);
    function frame(now){
      if(vis||reduce){
        var t=(now-start)/1000;
        if(!reduce)rotY+=0.0032;cx+=(tx-cx)*.05;cy+=(ty-cy)*.05;
        var ay=rotY+cx*0.9,ax=tiltX+cy*0.7,sy=Math.sin(ay),cyy=Math.cos(ay),sx=Math.sin(ax),cxx=Math.cos(ax);
        var R=Math.min(W,H)*0.40,ox=W/2,oy=H/2,grow=reduce?1:Math.max(0.001,Math.min(1,t/2.2));grow=1-Math.pow(1-grow,3);grow=Math.max(0.001,grow);
        ctx.clearRect(0,0,W,H);
        var P=pts.map(function(p,i){var x=p.x*cyy+p.z*sy,z=-p.x*sy+p.z*cyy,y=p.y*cxx-z*sx;z=p.y*sx+z*cxx;
          var on=reduce?(i%5===0):((Math.sin(t*0.9+p.d*3)+1)/2>0.82);p.lit+=((on?1:0)-p.lit)*.06;
          return {x:ox+x*R*grow,y:oy+y*R*grow,z:z,l:p.lit};});
        ctx.lineWidth=1;
        links.forEach(function(k){var A=P[k[0]],B=P[k[1]],l=Math.min(A.l,B.l),depth=(A.z+B.z)/2;if(l<0.05)return;
          ctx.strokeStyle='rgba(26,26,26,'+(l*(0.25+0.45*(depth+1)/2)).toFixed(3)+')';ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();});
        P.forEach(function(p){var f=(p.z+1)/2,s=0.9+f*1.7+p.l*1.6;ctx.fillStyle='rgba(26,26,26,'+(0.12+f*0.55+p.l*0.3).toFixed(3)+')';ctx.beginPath();ctx.arc(p.x,p.y,s,0,6.283);ctx.fill();});
        // soft core
        var g=ctx.createRadialGradient(ox,oy,0,ox,oy,R*0.55*grow);g.addColorStop(0,'rgba(26,26,26,.10)');g.addColorStop(1,'rgba(26,26,26,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(ox,oy,R*0.55*grow,0,6.283);ctx.fill();
      }
      if(!reduce)requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
  // Custom cursor: a black dot that follows the mouse (desktop only)
  var fine=window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if(fine){
    var dot=document.createElement('div'); dot.className='cursor-dot'; dot.setAttribute('aria-hidden','true'); document.body.appendChild(dot);
    document.documentElement.classList.add('has-dot');
    var tx=-100,ty=-100,x=-100,y=-100,shown=false;
    window.addEventListener('mousemove',function(e){tx=e.clientX;ty=e.clientY;if(!shown){x=tx;y=ty;shown=true;dot.classList.add('on');}},{passive:true});
    document.addEventListener('mouseleave',function(){dot.classList.remove('on');shown=false;});
    document.addEventListener('mouseover',function(e){dot.classList.toggle('big',!!e.target.closest('a,button,summary,.wk-card,.bl-card'));});
    document.addEventListener('mousedown',function(){dot.classList.add('press');});
    document.addEventListener('mouseup',function(){dot.classList.remove('press');});
    (function loop(){var k=reduce?1:.22;x+=(tx-x)*k;y+=(ty-y)*k;dot.style.transform='translate3d('+x+'px,'+y+'px,0) translate(-50%,-50%)';requestAnimationFrame(loop);})();
  }
})();
