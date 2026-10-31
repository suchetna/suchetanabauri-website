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
    size();window.addEventListener('resize',size);if('ResizeObserver' in window)new ResizeObserver(size).observe(cv);window.addEventListener('load',size);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(size);
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

  // Service hero: ripples spreading to an audience, with small replies coming back (original animation)
  root.querySelectorAll('canvas[data-ripple]').forEach(function(cv){
    var ctx=cv.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1),W=0,H=0,vis=true,tx=0,ty=0,mx=0,my=0;
    var dots=[];for(var i=0;i<110;i++){var a=Math.random()*6.283,r=0.16+Math.sqrt(Math.random())*0.82;dots.push({a:a,r:r,s:0.9+Math.random()*1.6,lit:0,hit:-1});}
    var waves=[],replies=[],last=-9,start=performance.now();
    function size(){var b=cv.getBoundingClientRect();W=b.width;H=b.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
    size();window.addEventListener('resize',size);if('ResizeObserver' in window)new ResizeObserver(size).observe(cv);window.addEventListener('load',size);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(size);
    window.addEventListener('mousemove',function(e){var b=cv.getBoundingClientRect();tx=((e.clientX-b.left)/b.width-.5);ty=((e.clientY-b.top)/b.height-.5);},{passive:true});
    if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;}).observe(cv);
    function frame(now){
      var t=Math.max(0,(now-start)/1000);
      if(vis||reduce){
        mx+=(tx-mx)*.05;my+=(ty-my)*.05;
        var R=Math.min(W,H)*0.46,cx=W/2+mx*R*0.12,cy=H/2+my*R*0.12;
        if(!reduce&&t-last>1.7){waves.push({b:t,id:Math.random()});last=t;}
        ctx.clearRect(0,0,W,H);
        // expanding rings
        waves=waves.filter(function(w){var p=(t-w.b)/4.2;if(p>1)return false;
          ctx.strokeStyle='rgba(26,26,26,'+(0.45*(1-p)).toFixed(3)+')';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(cx,cy,p*R,0,6.283);ctx.stroke();
          dots.forEach(function(d){if(d.hit!==w.id&&Math.abs(p-d.r)<0.012){d.hit=w.id;d.lit=1;if(Math.random()<0.18)replies.push({d:d,b:t});}});
          return true;});
        // replies: small ripples from audience back
        replies=replies.filter(function(q){var p=(t-q.b)/1.4;if(p>1)return false;var x=W/2+Math.cos(q.d.a)*q.d.r*R+mx*R*0.04,y=H/2+Math.sin(q.d.a)*q.d.r*R+my*R*0.04;
          ctx.strokeStyle='rgba(26,26,26,'+(0.5*(1-p)).toFixed(3)+')';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,4+p*22,0,6.283);ctx.stroke();return true;});
        // audience dots
        dots.forEach(function(d){var x=W/2+Math.cos(d.a+t*0.02)*d.r*R+mx*R*0.04,y=H/2+Math.sin(d.a+t*0.02)*d.r*R+my*R*0.04;
          if(reduce)d.lit=0.4;d.lit*=0.975;ctx.fillStyle='rgba(26,26,26,'+(0.22+d.lit*0.7).toFixed(3)+')';ctx.beginPath();ctx.arc(x,y,d.s+d.lit*2.2,0,6.283);ctx.fill();});
        // source
        ctx.fillStyle='#1A1A1A';ctx.beginPath();ctx.arc(cx,cy,7+Math.sin(t*2.2)*1.2,0,6.283);ctx.fill();
      }
      if(!reduce)requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  // Service hero: scattered dots that gather into clear lines of "text", then loosen (original animation)
  root.querySelectorAll('canvas[data-clarity]').forEach(function(cv){
    var ctx=cv.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1),W=0,H=0,vis=true,mx=-9,my=-9,start=performance.now();
    // target layout: 9 lines of ragged-right text inside the unit square
    var targets=[],lens=[0.92,0.86,0.95,0.7,0.9,0.82,0.94,0.6,0.38],gap=0.075;
    lens.forEach(function(L,li){var y=0.2+li*gap,words=[],x=0.14,end=0.14+L*0.8;
      while(x<end){var w=0.04+Math.random()*0.1;if(x+w>end)w=end-x;if(w>0.015)words.push([x,x+w]);x+=w+0.025;}
      words.forEach(function(wd){for(var t=wd[0];t<=wd[1];t+=0.011)targets.push([t,y]);});});
    var pts=targets.map(function(t){return {tx:t[0],ty:t[1],hx:Math.random(),hy:Math.random(),x:Math.random(),y:Math.random(),vx:0,vy:0,ph:Math.random()*6.283,s:0.7+Math.random()*0.9};});
    function size(){var b=cv.getBoundingClientRect();W=b.width;H=b.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
    size();window.addEventListener('resize',size);if('ResizeObserver' in window)new ResizeObserver(size).observe(cv);window.addEventListener('load',size);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(size);
    window.addEventListener('mousemove',function(e){var b=cv.getBoundingClientRect();mx=(e.clientX-b.left)/b.width;my=(e.clientY-b.top)/b.height;},{passive:true});
    if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;}).observe(cv);
    function ease(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;}
    function frame(now){
      var t=Math.max(0,(now-start)/1000);
      if((vis||reduce)&&W>0){
        // cycle: 0-2.5 scattered, 2.5-4.5 gather, 4.5-9 clear, 9-10.5 loosen
        var c=(t+1.5)%10.5,k=reduce?1:(c<2.5?0:c<4.5?ease((c-2.5)/2):c<9?1:1-ease((c-9)/1.5));
        ctx.clearRect(0,0,W,H);
        pts.forEach(function(p){
          var nx=p.hx+Math.sin(t*0.5+p.ph)*0.04,ny=p.hy+Math.cos(t*0.4+p.ph*1.3)*0.04;
          var gx=nx+(p.tx-nx)*k,gy=ny+(p.ty-ny)*k;
          var dx=p.x-mx,dy=p.y-my,d2=dx*dx+dy*dy;
          if(d2<0.012&&!reduce){var f=(0.012-d2)*0.9;p.vx+=dx*f*8;p.vy+=dy*f*8;}
          p.vx+=(gx-p.x)*0.06;p.vy+=(gy-p.y)*0.06;p.vx*=0.78;p.vy*=0.78;
          if(reduce){p.x=gx;p.y=gy;}else{p.x+=p.vx;p.y+=p.vy;}
          var a=0.42+0.45*k;ctx.fillStyle='rgba(26,26,26,'+a.toFixed(3)+')';
          ctx.beginPath();ctx.arc(p.x*W,p.y*H,(p.s*1.2+k*0.5)*(W/480),0,6.283);ctx.fill();
        });
        // a cursor-like caret at the end of the last line once text is clear
        if(k>0.95&&Math.floor(t*1.6)%2===0){var last=targets[targets.length-1];ctx.fillStyle='#1A1A1A';ctx.fillRect(last[0]*W+W*0.02,(last[1]-0.025)*H,W*0.006,H*0.05);}
      }
      if(!reduce)requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  // Service hero: dots that rebuild one mark after another (original animation)
  root.querySelectorAll('canvas[data-morph]').forEach(function(cv){
    var ctx=cv.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1),W=0,H=0,vis=true,mx=-9,my=-9,start=performance.now(),N=240;
    function onPath(fn){var a=[];for(var i=0;i<N;i++)a.push(fn(i/N));return a;}
    function poly(vs){return function(u){var n=vs.length,s=u*n,i=Math.floor(s),f=s-i,A=vs[i%n],B=vs[(i+1)%n];return [A[0]+(B[0]-A[0])*f,A[1]+(B[1]-A[1])*f];};}
    var shapes=[
      onPath(function(u){var a=u*6.283;return [.5+Math.cos(a)*.36,.5+Math.sin(a)*.36];}),
      onPath(poly([[.21,.21],[.79,.21],[.79,.79],[.21,.79]])),
      onPath(poly([[.5,.14],[.84,.73],[.16,.73]])),
      onPath(function(u){if(u<.5){var a=u*2*6.283;return [.36+Math.cos(a)*.22,.5+Math.sin(a)*.22];}var b=(u-.5)*2*6.283;return [.64+Math.cos(b)*.22,.5+Math.sin(b)*.22];}),
      onPath(function(u){var a=u*6.283,r=.3+.08*Math.cos(a*6);return [.5+Math.cos(a)*r,.5+Math.sin(a)*r];})
    ];
    var pts=[];for(var i=0;i<N;i++)pts.push({x:.5,y:.5,vx:0,vy:0,s:.8+Math.random()*1.2,j:Math.random()*6.283});
    function size(){var b=cv.getBoundingClientRect();W=b.width;H=b.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
    size();window.addEventListener('resize',size);if('ResizeObserver' in window)new ResizeObserver(size).observe(cv);window.addEventListener('load',size);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(size);
    window.addEventListener('mousemove',function(e){var b=cv.getBoundingClientRect();mx=(e.clientX-b.left)/b.width;my=(e.clientY-b.top)/b.height;},{passive:true});
    if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;}).observe(cv);
    function frame(now){
      var t=Math.max(0,(now-start)/1000);
      if((vis||reduce)&&W>0){
        var per=3.6,idx=Math.floor(t/per)%shapes.length,ph=(t%per)/per,S=shapes[reduce?0:idx],rot=reduce?0:t*0.15;
        ctx.clearRect(0,0,W,H);
        // faint construction circle
        ctx.strokeStyle='rgba(26,26,26,.08)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(W/2,H/2,Math.min(W,H)*.44,0,6.283);ctx.stroke();
        var cr=Math.cos(rot),sr=Math.sin(rot);
        pts.forEach(function(p,i){
          var q=S[(i*13)%N],qx=q[0]-.5,qy=q[1]-.5,gx=.5+qx*cr-qy*sr,gy=.5+qx*sr+qy*cr;
          // short scatter at the start of each new mark
          if(ph<0.12&&!reduce){gx+=Math.cos(p.j+t)*.05;gy+=Math.sin(p.j+t)*.05;}
          var dx=p.x-mx,dy=p.y-my,d2=dx*dx+dy*dy;
          if(d2<0.012&&!reduce){var f=(0.012-d2)*8;p.vx+=dx*f;p.vy+=dy*f;}
          p.vx+=(gx-p.x)*0.05;p.vy+=(gy-p.y)*0.05;p.vx*=0.8;p.vy*=0.8;
          if(reduce){p.x=gx;p.y=gy;}else{p.x+=p.vx;p.y+=p.vy;}
          ctx.fillStyle='rgba(26,26,26,.8)';ctx.beginPath();ctx.arc(p.x*W,p.y*H,(p.s+.6)*(W/480),0,6.283);ctx.fill();
        });
      }
      if(!reduce)requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  // Service hero: a cluttered slide that tidies itself into one clear message (original animation)
  root.querySelectorAll('canvas[data-declutter]').forEach(function(cv){
    var ctx=cv.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1),W=0,H=0,vis=true,mx=0,my=0,tx=0,ty=0,start=performance.now();
    // [type, messy x,y,w,h,rot, clear x,y,w,h, keep]  type: s=solid, l=light, o=outline, t=text line
    var E=[
      ['s',.16,.30,.46,.07,-.06, .13,.31,.4,.075,1],
      ['t',.40,.44,.40,.025,.10, .13,.45,.36,.022,1],
      ['t',.12,.56,.34,.025,-.12,.13,.5,.3,.022,1],
      ['s',.55,.52,.24,.20,.14,  .62,.31,.25,.4,1],
      ['t',.20,.70,.22,.02,.05,  .13,.66,.18,.02,1],
      ['o',.62,.27,.22,.13,-.2, .6,.3,.2,.1,0],
      ['l',.24,.40,.26,.18,.18, .24,.4,.2,.12,0],
      ['o',.10,.62,.18,.12,.25, .1,.62,.12,.1,0],
      ['t',.50,.66,.30,.02,-.3, .5,.66,.2,.02,0],
      ['t',.30,.26,.28,.02,.22, .3,.26,.2,.02,0],
      ['l',.70,.62,.14,.10,-.35, .7,.62,.1,.08,0],
      ['t',.14,.47,.22,.02,.4, .14,.47,.16,.02,0],
      ['o',.42,.58,.12,.12,.6, .42,.58,.08,.08,0],
      ['s',.78,.42,.05,.05,.8, .78,.42,.03,.03,0],
      ['s',.36,.36,.04,.04,-.5, .36,.36,.03,.03,0]
    ];
    function size(){var b=cv.getBoundingClientRect();W=b.width;H=b.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
    size();window.addEventListener('resize',size);if('ResizeObserver' in window)new ResizeObserver(size).observe(cv);window.addEventListener('load',size);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(size);
    window.addEventListener('mousemove',function(e){var b=cv.getBoundingClientRect();tx=((e.clientX-b.left)/b.width-.5);ty=((e.clientY-b.top)/b.height-.5);},{passive:true});
    if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;}).observe(cv);
    function rr(x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
    function ease(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;}
    function frame(now){
      var t=Math.max(0,(now-start)/1000);
      if((vis||reduce)&&W>0){
        mx+=(tx-mx)*.05;my+=(ty-my)*.05;
        // cycle 9s: messy 0-2, tidy 2-4, clear 4-7.6, back 7.6-9
        var c=(t+.5)%9,k=reduce?1:(c<2?0:c<4?ease((c-2)/2):c<7.6?1:1-ease((c-7.6)/1.4));
        ctx.clearRect(0,0,W,H);
        // slide frame
        var fx=.06*W+mx*W*.01,fy=.2*H+my*H*.01,fw=.88*W,fh=.6*H;
        rr(fx,fy,fw,fh,W*.014);ctx.fillStyle='rgba(255,255,255,.4)';ctx.fill();ctx.strokeStyle='#1A1A1A';ctx.lineWidth=1.4;ctx.stroke();
        E.forEach(function(e,i){
          var jitter=reduce?0:(1-k)*Math.sin(t*1.3+i)*.006;
          var x=e[1]+(e[6]-e[1])*k+jitter,y=e[2]+(e[7]-e[2])*k,w=e[3]+(e[8]-e[3])*k,h=e[4]+(e[9]-e[4])*k,r=e[5]*(1-k);
          var a=e[10]?1:Math.max(0,1-k*1.6);if(a<=0)return;
          var dp=.02+i*.002;
          ctx.save();ctx.globalAlpha=a;ctx.translate((x+w/2+mx*dp)*W,(y+h/2+my*dp)*H);ctx.rotate(r);
          var X=-w*W/2,Y=-h*H/2,WW=w*W,HH=h*H;
          if(e[0]==='s'){rr(X,Y,WW,HH,W*.006);ctx.fillStyle='#1A1A1A';ctx.fill();}
          else if(e[0]==='l'){rr(X,Y,WW,HH,W*.006);ctx.fillStyle='rgba(26,26,26,.13)';ctx.fill();}
          else if(e[0]==='o'){rr(X,Y,WW,HH,W*.006);ctx.strokeStyle='#1A1A1A';ctx.lineWidth=1.2;ctx.stroke();}
          else{rr(X,Y,WW,HH,HH/2);ctx.fillStyle='rgba(26,26,26,.28)';ctx.fill();}
          ctx.restore();
        });
        // once clear: the key block gets a quiet highlight ring
        if(k>.98&&!reduce){var e3=E[3],p=((c-4)/3.6);ctx.strokeStyle='rgba(26,26,26,'+(.35*(1-p)).toFixed(2)+')';ctx.lineWidth=1;rr((e3[6]-.015+mx*.026)*W,(e3[7]-.02+my*.026)*H,(e3[8]+.03)*W,(e3[9]+.04)*H,W*.012);ctx.stroke();}
      }
      if(!reduce)requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  // Service hero: content pulses draw scattered people into a growing, orbiting audience (original animation)
  root.querySelectorAll('canvas[data-audience]').forEach(function(cv){
    var ctx=cv.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1),W=0,H=0,vis=true,mx=0,my=0,tx=0,ty=0,start=performance.now(),N=170;
    var P=[];for(var i=0;i<N;i++)P.push({x:Math.random(),y:Math.random(),vx:0,vy:0,f:-1,ring:0,ang:0,s:.8+Math.random()*1.2,ph:Math.random()*6.283});
    var pulses=[],lastP=-9,cycleStart=0,joined=0;
    function size(){var b=cv.getBoundingClientRect();W=b.width;H=b.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
    size();window.addEventListener('resize',size);if('ResizeObserver' in window)new ResizeObserver(size).observe(cv);window.addEventListener('load',size);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(size);
    window.addEventListener('mousemove',function(e){var b=cv.getBoundingClientRect();tx=((e.clientX-b.left)/b.width-.5);ty=((e.clientY-b.top)/b.height-.5);},{passive:true});
    if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;}).observe(cv);
    function frame(now){
      var t=Math.max(0,(now-start)/1000);
      if((vis||reduce)&&W>0){
        mx+=(tx-mx)*.05;my+=(ty-my)*.05;
        var cx=.5+mx*.06,cy=.5+my*.06,ct=t-cycleStart;
        if(reduce){P.forEach(function(p,i){if(p.f<0&&i%2===0){p.f=1;p.ring=i%3;p.ang=i*0.7;}});}
        else{
          if(ct<13&&t-lastP>0.9){pulses.push(t);lastP=t;
            // each pulse wins over a few of the nearest free dots
            var free=P.filter(function(p){return p.f<0;}).sort(function(a,b){return Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy);});
            free.slice(0,7).forEach(function(p){p.f=t;p.ring=joined%3;p.ang=Math.atan2(p.y-cy,p.x-cx);joined++;});}
          if(ct>15){P.forEach(function(p){if(p.f>=0){p.f=-1;p.vx+=(Math.random()-.5)*.02;p.vy+=(Math.random()-.5)*.02;}});joined=0;cycleStart=t;}
        }
        ctx.clearRect(0,0,W,H);
        var S=Math.min(W,H);
        // orbit guides
        [.16,.26,.36].forEach(function(r){ctx.strokeStyle='rgba(26,26,26,.07)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx*W,cy*H,r*S,0,6.283);ctx.stroke();});
        pulses=pulses.filter(function(b){var p=(t-b)/2;if(p>1)return false;ctx.strokeStyle='rgba(26,26,26,'+(.4*(1-p)).toFixed(2)+')';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(cx*W,cy*H,(.05+p*.45)*S,0,6.283);ctx.stroke();return true;});
        P.forEach(function(p){
          var gx,gy;
          if(p.f>=0){var rr=[.16,.26,.36][p.ring],sp=[.35,.24,.16][p.ring];p.ang+=reduce?0:sp*0.016;gx=cx+Math.cos(p.ang)*rr*S/W;gy=cy+Math.sin(p.ang)*rr*S/H;
            p.vx+=(gx-p.x)*.04;p.vy+=(gy-p.y)*.04;p.vx*=.82;p.vy*=.82;}
          else{p.vx+=Math.sin(t*.4+p.ph)*.00012;p.vy+=Math.cos(t*.35+p.ph*1.7)*.00012;p.vx*=.98;p.vy*=.98;
            var dx=p.x-.5,dy=p.y-.5,d=Math.hypot(dx,dy);if(d>.44){p.vx-=dx*.0006;p.vy-=dy*.0006;}if(d<.2){p.vx+=dx*.0004;p.vy+=dy*.0004;}}
          if(reduce&&p.f>=0){p.x=gx;p.y=gy;}else{p.x+=p.vx;p.y+=p.vy;}
          var on=p.f>=0;ctx.fillStyle=on?'rgba(26,26,26,.85)':'rgba(26,26,26,.25)';
          ctx.beginPath();ctx.arc(p.x*W,p.y*H,(p.s+(on?.7:0))*(W/480),0,6.283);ctx.fill();
        });
        // the source: a small content card
        var cw=S*.075,chh=S*.06,X=cx*W-cw/2,Y=cy*H-chh/2;ctx.fillStyle='#1A1A1A';ctx.fillRect(X,Y,cw,chh);
        ctx.fillStyle='#EBEBEB';ctx.fillRect(X+cw*.15,Y+chh*.25,cw*.55,chh*.12);ctx.fillRect(X+cw*.15,Y+chh*.5,cw*.7,chh*.1);ctx.fillRect(X+cw*.15,Y+chh*.68,cw*.45,chh*.1);
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
