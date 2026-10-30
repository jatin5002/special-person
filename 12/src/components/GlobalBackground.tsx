import { useEffect, useRef } from "react";

type Heart = { x:number; y:number; size:number; speed:number; drift:number; alpha:number; phase:number; rot:number };

export default function GlobalBackground({ intensity = 1 }: { intensity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let w=0,h=0,raf=0;
    const hearts:Heart[] = [];
    const count = Math.round(42 * Math.min(1.35, Math.max(.75,intensity)));
    const resize=()=>{ w=canvas.width=window.innerWidth; h=canvas.height=window.innerHeight; };
    resize(); window.addEventListener("resize",resize);
    for(let i=0;i<count;i++) hearts.push({x:Math.random()*w,y:Math.random()*h,size:10+Math.random()*28,speed:.18+Math.random()*.42,drift:(Math.random()-.5)*.22,alpha:.12+Math.random()*.34,phase:Math.random()*Math.PI*2,rot:(Math.random()-.5)*18});
    const heart=(x:number,y:number,s:number)=>{ ctx.beginPath(); ctx.moveTo(x,y+s*.28); ctx.bezierCurveTo(x-s*.72,y-s*.18,x-s*.58,y-s*.72,x,y-s*.28); ctx.bezierCurveTo(x+s*.58,y-s*.72,x+s*.72,y-s*.18,x,y+s*.28); ctx.closePath(); };
    const draw=()=>{
      ctx.clearRect(0,0,w,h);
      const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,"#8f123b"); g.addColorStop(.48,"#5e0b2a"); g.addColorStop(1,"#260613"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
      const glow=ctx.createRadialGradient(w*.5,h*.72,20,w*.5,h*.72,h*.8); glow.addColorStop(0,"rgba(255,95,145,.20)"); glow.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle=glow; ctx.fillRect(0,0,w,h);
      const now=performance.now()*.001;
      for(const p of hearts){ p.y-=p.speed; p.x+=p.drift+Math.sin(now+p.phase)*.08; if(p.y<-p.size*2){p.y=h+p.size;p.x=Math.random()*w;} if(p.x<-40)p.x=w+40;if(p.x>w+40)p.x=-40; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate((p.rot+Math.sin(now+p.phase)*4)*Math.PI/180); ctx.globalAlpha=p.alpha*(.82+.18*Math.sin(now*1.2+p.phase)); ctx.shadowBlur=16; ctx.shadowColor="rgba(255,105,155,.65)"; const hg=ctx.createLinearGradient(-p.size,-p.size,p.size,p.size); hg.addColorStop(0,"#ff9fbe"); hg.addColorStop(.55,"#f24f82"); hg.addColorStop(1,"#a40d43"); ctx.fillStyle=hg; heart(0,0,p.size); ctx.fill(); ctx.restore(); }
      raf=requestAnimationFrame(draw);
    };
    draw(); return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize)};
  },[intensity]);
  return <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden"><canvas ref={ref} className="h-full w-full" /></div>;
}
