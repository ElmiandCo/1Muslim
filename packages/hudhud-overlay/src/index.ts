export type Motion = 'rise' | 'left' | 'right' | 'fade';
export interface OverlayComment { id: string; text: string; author?: string; color?: string; at?: number }
export interface OverlayOptions { target: HTMLElement; motion?: Motion; durationMs?: number; opacity?: number; fontSize?: number; maxVisible?: number }
export class HudHudOverlay {
  private root: HTMLDivElement;
  private options: Required<Omit<OverlayOptions, 'target'>>;
  private active = new Map<string, HTMLElement>();
  constructor(private target: HTMLElement, options: Omit<OverlayOptions, 'target'> = {}) {
    this.options = { motion: options.motion ?? 'rise', durationMs: options.durationMs ?? 4500, opacity: options.opacity ?? .92, fontSize: options.fontSize ?? 15, maxVisible: options.maxVisible ?? 12 };
    if (getComputedStyle(target).position === 'static') target.style.position = 'relative';
    this.root = document.createElement('div');
    this.root.className = 'hudhud-overlay';
    Object.assign(this.root.style, {position:'absolute',inset:'0',overflow:'hidden',pointerEvents:'none',zIndex:'10'});
    target.appendChild(this.root);
  }
  configure(options: Partial<Omit<OverlayOptions,'target'>>) { Object.assign(this.options, options); }
  show(comment: OverlayComment) {
    if (this.active.has(comment.id)) return;
    if (this.active.size >= this.options.maxVisible) this.active.values().next().value?.remove();
    const el = document.createElement('div');
    el.textContent = comment.author ? `${comment.author}: ${comment.text}` : comment.text;
    el.setAttribute('role','note');
    Object.assign(el.style, {position:'absolute',bottom:'12%',left:'8%',maxWidth:'84%',color:comment.color ?? '#fff',fontSize:`${this.options.fontSize}px`,opacity:String(this.options.opacity),padding:'6px 12px',borderRadius:'18px',background:'rgba(0,0,0,.38)',textShadow:'0 1px 3px #000',willChange:'transform, opacity',pointerEvents:'auto',overflowWrap:'anywhere'});
    this.root.appendChild(el); this.active.set(comment.id,el);
    const motion = this.options.motion;
    const frames = motion === 'rise' ? [{transform:'translateY(20px)',opacity:0},{transform:'translateY(-110px)',opacity:this.options.opacity},{transform:'translateY(-180px)',opacity:0}] : motion === 'left' ? [{transform:'translateX(110vw)'},{transform:'translateX(-110vw)'}] : motion === 'right' ? [{transform:'translateX(-110vw)'},{transform:'translateX(110vw)'}] : [{opacity:0},{opacity:this.options.opacity},{opacity:0}];
    const animation = el.animate(frames,{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?100:this.options.durationMs,easing:'linear',fill:'forwards'});
    animation.finished.catch(()=>{}).finally(()=>{el.remove();this.active.delete(comment.id)});
    el.addEventListener('click',e=>{e.stopPropagation();this.root.dispatchEvent(new CustomEvent('hudhud:comment-click',{detail:comment}));});
  }
  destroy() {this.active.clear();this.root.remove();}
}
