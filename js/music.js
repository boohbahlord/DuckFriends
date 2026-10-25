/* ---------- music, made on the spot (no sound files) ----------
   The songs come from Nous Within Kenoma's Ether's Crossroads (its ec-music.js): the same player, its instruments and its
   mix, so a song from there can be copied in as it is. Music plays in the lobby and in the game, at the volume of the
   Music slider in Settings (times Volume). Between two songs there are 20 seconds of quiet; the next song is picked at
   random, and the songs heard most recently are the least likely to come again. When each song was last heard is kept on
   this device ("duckfriends-music"). Browsers only start sound after a click or a key. */
import { profile } from './store.js';
import { activeRoom } from './net.js';
import { now as clockNow } from './clock.js';
export const music = (function(){
  const N={C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11};
  // "A4:2 F4:1:.5 r:2 D5+E5:1 G5:2::a …" (lengths in eighths, may be fractions; then a loudness and tags: a = a falling
  // breath of a note, s = the melody is swept away after it) -> [[midi|[midi…]|null,len,vel,tags]]
  const mel=s=>s.trim().split(/\s+/).map(t=>{const [n,l,v,tag]=t.split(":");if(n==="r")return [null,+l];
    const ms=n.split("+").map(x=>{const m=/^([A-G][b#]?)(\d)$/.exec(x);return 12*(+m[2]+1)+N[m[1]]});
    return [ms.length>1?ms:ms[0],+l,v==null||v===""?1:+v,tag||""]});
  // chords: "Dm G/D Fmaj7 E7b5 Faug" -> {r: root midi (octave 3), b: bass, iv: the chord's notes above the root}
  const IV={"":[0,4,7],m:[0,3,7],dim:[0,3,6],aug:[0,4,8],maj7:[0,4,7,11],m7:[0,3,7,10],"7":[0,4,7,10],"7b5":[0,4,6,10],
    sus4:[0,5,7],m7b5:[0,3,6,10],add9:[0,4,7,14],madd9:[0,3,7,14],"maj7#11":[0,4,7,11,18]};
  const chords=s=>s.trim().split(/\s+/).map(c=>{const m=/^([A-G][b#]?)([^/]*)(?:\/([A-G][b#]?))?$/.exec(c),r=48+N[m[1]],iv=IV[m[2]];
    let b=r;if(m[3]){b=48+N[m[3]];if(b>r)b-=12}return {r,b,iv,third:iv[1],fifth:iv[2]}});
  /* Glow: Lantern in the Fog and Bubble Bath in the Sky put together, a felt piano like
     Minecraft's, a harp and a muffled bass from Hollow Knight's caves, wind and a far, out-of-tune bell from an old foggy
     town. It glows in slowly; bobs a little; puts its head down and walks off into the hollow; goes quiet; then everything
     comes back in, one by one, and the tune it earned plays full, with chimes. In D Dorian (it can be heard in D Lydian too). */
  const GLOW_MEL=`r:3 A4:.333 C#5:.333 E5:.334 G#5:4:.8
        r:1 F#5:1:.3:a C#5:2:.2:a r:4
        r:2 B4:.333 E5:.333 G#5:.334 B5:3:.8 r:2
        A5:1:.3:a F#5:2:.2:a r:5
        D5:3:.75 E5:1:.75 F#5:2:.8 A5:2:.85
        G#5:4:.9 F#5:1 E5:1 C#5:2
        D5:2 B4:1 F#4:1 A4:3 B4:1
        C#5:5 r:1 E5:.5 F#5:1.5
        A5:3 G#5:1 F#5:2 E5:1 D5:1
        E5:1.5 F#5:.5 G#5:2 B5:3 r:1
        G#5:1 E5:1 C#5:1.5 B4:.5 E5:3 r:1
        C#6:2 B5:1 A5:1 E5:2 G#5:2
        F#5:3 D5:1 B4:2 C#5:1 D5:1
        E5:6 r:2
        A5:.5 r:.5 F#5:.5 r:.5 A5:.5 r:.5 B5:1 A5:.5 F#5:.5 E5:.5 r:2.5
        G#5:.5 r:.5 E5:.5 r:.5 G#5:.5 B5:.5 C#6:1 B5:.5 G#5:.5 r:3
        F#5:.5 r:.5 D5:.5 r:.5 F#5:.5 A5:.5 B5:1.5 A5:.5 F#5:1 r:2
        E5:.333 F#5:.333 G#5:.334 A5:.5 r:.5 G#5:.5 r:1.5 E5:.5:.7 r:3.5
        E5:2:.8 C#5:1:.75 B4:1:.7 G#4:3:.7 r:1
        B4:2:.65 A4:2:.6 F#4:2:.55 E4:2:.5
        D4:3:.5 C#4:1:.45 B3:3:.4 r:1
        r:2 E4:2:.3:a r:4
        r:8
        r:5 G#5:1:.22:a r:2
        r:8
        r:4 D5:1:.5 E5:1:.55 F#5:2:.6
        A5:4:.65 r:4
        C#5:2:.7 E5:1:.75 F#5:1:.8 G#5:3:.85 r:1
        A5:2:.9 B5:1:.95 C#6:1 E6:4
        D6:3 C#6:1 A5:2 F#5:2
        G#5:3 A5:1 B5:2 E5:2
        D6:2 B5:1 F#5:1 A5:3 B5:1
        C#6:4 E6:1 C#6:1 A5:2
        A5:2 B5:.5 C#6:.5 E6:1 F#6:3 E6:1
        E6:2 C#6:1 B5:1 G#5:2 E5:2
        C#6:3 B5:1 A5:2 G#5:1 A5:1
        F#5:3 E5:1 D5:2 C#5:1 D5:1
        E5:4 r:1 A5:.333 C#6:.333 E6:.334 G#6:2:.7
        A5:6:.6 r:2
        r:2 E6:1:.22:a D6:2:.16:a r:3`;
  const toDorian=s=>s.replace(/(F|G|C)#(\d)/g,"$1$2");   // D Lydian (D E F# G# A B C#) -> D Dorian (D E F G A B C)
  const GLOW_SEC=[[0,"intro"],[6,"theme"],[14,"bob"],[18,"walk"],[22,"quiet"],[25,"return"],[29,"full"]];
  const glowSec=a=>{let s="intro";for(const [k,n] of GLOW_SEC)if(a>=k)s=n;return s};
  const h01=n=>{const x=Math.sin(n*12.9898+4.1)*43758.5453;return x-Math.floor(x)};   // a fixed chance for each bar
  const glow=(name,mode,ch)=>({name,bpm:66,trim:.5,bar:8,lead:"felt",leadV:.3,rel:1.1,leg:1.05,lp:3600,echo:.16,fb:.24,dly:.68,
    dyn:.8,contrast:.85,hum:.012,rv:.4,ds:.16,rev:[6,.55],wow:[.0011,.23],bed:.003,
    chords:chords(ch),mel:mel(mode==="dorian"?toDorian(GLOW_MEL):GLOW_MEL),
    // never quite steady: it lilts as it bobs, drags as it walks away, breathes at a phrase's end, and no two bars match
    tempo:(b,i,a)=>{const s=glowSec(a);let v=s==="intro"?.9:s==="bob"?(i%2?1.22:.84):s==="walk"?.97-.035*(a-18):s==="quiet"?.82:s==="return"?.88+.03*(a-25):1;
      if(s!=="bob"&&i>=6&&[5,13,28,38,39].includes(a))v*=.86;return v*(.97+.06*h01(a))},
    onNote:(e,t,E8,x)=>{const s=glowSec(x.abs);GL=null;
      if(s==="bob"&&e.l<=1){on(send(.5,.3));voice("softbox",hz(e.m[0]+12),t,E8*.5,.07*e.vel,.6);return}   // a music box bobs along
      if(e.l<3||rnd()>(s==="full"?.85:.5))return;const C=x.C,base=e.m[0],c=[...C.iv,12].map(v=>C.r+v+24).filter(m=>m>base&&m<=base+12);if(!c.length)return;
      on(send(1,.6));GL={r:1,fall:Math.pow(2,14/1200),ft:.2,fd:1.2};   // a soft note floats up off a long one, as in Bubble Bath in the Sky
      voice("softbox",hz(c[Math.floor(rnd()*c.length)]),t+E8*(1.5+rnd()*1.5),E8*2,.055*e.vel,1.4);GL=null},
    onBar:x=>{const {t,abs:a,E8,C}=x,B=E8*8,s=glowSec(a);GL=null;
      // hollow <-> filled: how bright the tune is, and how loud the whole song swells
      const open={intro:900+300*a,theme:a===11?4800:3300,bob:4200,walk:3000-650*(a-18),quiet:520,return:900+700*(a-25),full:a>=38?2400:6500}[s];
      const swell={intro:.45+.1*a,theme:a>=10&&a<=12?1.05:.9,bob:.95,walk:.85-.08*(a-18),quiet:.5,return:.6+.1*(a-25),full:a>=33&&a<=36?1.12:1}[s];
      BUS.leadLP.frequency.setTargetAtTime(open,t,B*.35);BUS.swl.gain.setTargetAtTime(swell,t,B*.4);
      // the muffled bass: it bounces when the song bobs, fades as it walks away, holds one low note in the quiet
      on(send(.15,0,BUS.bass));
      if(s==="bob"){voice("mbass",hz(C.b-12),t,B*.3,.5,.25);voice("mbass",hz(C.b-12+C.fifth),t+B*.5,B*.25,.35,.25)}
      else if(s==="quiet"){if(a===22)voice("mbass",hz(C.b-12),t,B*3,.3,1.5)}
      else{const v=s==="intro"?.3+.04*a:s==="walk"?.42-.06*(a-18):s==="return"&&a===25?0:.48;if(v>0)voice("mbass",hz(C.b-12),t,B*.98,v,.6);
        if(v>0&&(s==="full"||s==="theme"&&a%2))voice("mbass",hz(C.b-12+C.fifth),t+B*.625,B*.3,v*.5,.4)}
      // wind and a hollow open fifth, far off (the start, walking away, the quiet)
      if(s==="intro"&&a<4||s==="walk"&&a>=20||s==="quiet"){wind(t,B*1.3,s==="quiet"?.05:.03,h01(a)>.5?-.8:.8,h01(a)>.5?.8:-.8);
        on(send(.9,.2,BUS.bass));voice("warm",hz(C.r),t,B*1.05,.022,1.2);voice("warm",hz(C.r+7),t+B*.2,B*.9,.016,1.2)}
      // a far bell, a little out of tune, from one side
      if([1,21,23].includes(a)||a===24&&h01(a)>.3){const st=t+B*(.3+.4*h01(a+3)),side=h01(a+7)>.5?-.7:.7;on(panTo(side,side*.6,st,B,1.4,.5));
        voice("fmbell",hz(C.r+24)*Math.pow(2,-28/1200),st,.4,.02,1.2)}
      // the warm pad, under the tune
      const pv={bob:.018,theme:a>=8?.028:0,return:a>=27?.024:0,full:a>=38?.03:.04}[s]||0;
      if(pv){on(send(.6,.1,BUS.bass));voice("warm",C.iv.slice(0,3).map(v=>hz(C.r+v+12)),t,B*1.02,pv,.8)}
      // a harp runs from the left ear to the right (or back), its notes never quite in the same place
      if(s==="theme"&&a>=8&&a%2===0||s==="return"&&a>=26||s==="full"&&a<38||s==="bob"&&a===16){const up=a%4!==2,p=panTo(up?-.85:.85,up?.85:-.85,t,B*.9,.5,.25);
        const ns=[...C.iv.slice(0,3),12,12+C.iv[1],12+C.iv[2]],pos=[[0,1,1.5,3,4.5,5.5],[0,.5,2,3,3.5,5],[.5,1.5,2,3.5,4,6]][Math.floor(h01(a+11)*3)],hv=s==="full"?.11:.07;
        pos.forEach((q,k)=>{on(p);voice("harp",hz(C.r+12+ns[up?k:ns.length-1-k]),t+q*E8,E8,hv*(.7+.3*Math.sin(Math.PI*k/pos.length)),.9)})}
      // chimes with glee: a sparkle that runs up, across the ears
      if(s==="full"&&a>=31&&a<=37||s==="bob"&&a===15||s==="return"&&a===28){const st=t+E8*(2+Math.floor(h01(a+5)*4)),dir=h01(a+9)>.5?1:-1,p=panTo(-.8*dir,.8*dir,st,E8*2,.7,.4);
        [0,C.iv[1],C.iv[2],12,12+C.iv[1],24].forEach((v,k)=>{on(p);voice("softbox",hz(C.r+24+v),st+k*E8*.22,E8*.6,.05,1.2)})}}});
  /* Jester's Stair: a little of Halo 3: ODST's "Rain", with everything of Glow. Long-legged jesters climb
     a stair of blocks that grows further out, each step further than the last, until they stop; it fades in hollow,
     mimicking joy, finds a little warmth (Lydian, then major), then falls away from ear to ear, far off. Then the minor:
     a breathy voice rushes, slows to breathe, rushes again, explaining what it lost, while a music box and a circus bass
     try to look happy. It works its way down, lets go, and ends on a false joy: a music box winding down, out of tune. */
  const JEST_SEC=[[0,"stair"],[10,"joy"],[18,"warm"],[22,"fall"],[30,"minor"],[50,"down"],[58,"false"]];
  const jestSec=a=>{let s="stair";for(const [k,n] of JEST_SEC)if(a>=k)s=n;return s};
  let jestSide=1;
  const JESTERS={name:"Jester's Stair",bpm:80,trim:.6,bar:6,lead:"felt",leadV:.3,rel:1.1,leg:1.04,lp:3400,echo:.16,fb:.24,dly:.62,
    dyn:.8,contrast:.85,hum:.014,rv:.42,ds:.16,rev:[6.5,.55],wow:[.0012,.21],bed:.002,
    chords:chords("Dmaj7 Dmaj7 E/D E/D Dmaj7 Dmaj7 Amaj7 Dmaj7 Bm7 Dmaj7 Dmaj7 E/D Bm7 F#m7 Dmaj7 F#m7 C#m7 Bm7 G D/F# Em7 A D G Bm7 G D Em7 G D Dm Bb F C Dm Gm Bb A Dm Bb F C Gm Dm Bb A Dm F Gm A7 Dm Bb Gm A Dm Bb Gm A7 D D D"),
    mel:mel(`D4:1 E4:1.5 F#4:2 A4:1.5
        r:1 C#5:3 G#5:2
        r:2 E6:1.5 r:2.5
        r:6
        r:3 B5:1.5:.4:a G#5:1.5:.3:a
        E4:1 F#4:1.5 A4:2 D5:1.5
        r:1 A5:3.5 E6:1.5
        r:6
        r:2 C#6:1:.35:a A5:1:.28:a F#5:2:.2:a
        r:6
        A4:2:.7 D5:1:.7 F#5:2:.75 E5:1:.75
        G#5:3:.8 F#5:1 E5:1 B4:1
        D5:2 C#5:1 B4:2 F#4:1
        A4:4 r:.5 C#5:.5 E5:1
        F#5:2 A5:1 G#5:1.5 F#5:.5 E5:1
        G#5:2 B5:1 A5:2 G#5:1
        E5:3 C#5:1 B4:1 G#4:1
        F#4:3 r:1 A4:.5 B4:.5 C#5:1
        D5:2 G5:1 B5:2 A5:1
        A5:3 F#5:1 D5:1 E5:1
        G5:2 F#5:1 E5:2 D5:1
        E5:1 F#5:1 G5:1 A5:3
        F#5:3 E5:1 D5:2
        B4:3 D5:1 G5:2
        F#5:2 D5:1 B4:3
        r:1 A4:1 B4:1 D5:3
        F#4:3:.7 A4:1:.65 D5:2:.6
        E5:2:.55 D5:1:.5 B4:3:.5
        r:2 D5:2:.4:a B4:2:.3:a
        r:3 A4:3:.25:a
        A4:1 D5:1 F5:1 E5:1 D5:1 C5:1
        D5:2 Bb4:1 A4:1 G4:1 F4:1
        A4:1.5 C5:.5 F5:2 E5:1 F5:1
        G5:3 r:3
        F5:1 E5:1 D5:1 A5:2 G5:1
        F5:1 D5:1 Bb4:2 r:2
        D5:1 F5:1 Bb5:2 A5:.5 G5:.5 F5:1
        E5:3 C#5:1 r:2
        D5:3 F5:1.5 E5:1.5
        D5:4 r:2
        C5:2 A4:1 F4:3
        r:3 G4:1 A4:1 C5:1
        D5:1 G5:1 Bb5:1 A5:1 G5:1 F5:1
        A5:2 F5:1 D5:1 E5:1 F5:1
        G5:1.5 F5:.5 D5:2 F5:1 G5:1
        A5:4:1.1 G5:1 E5:1
        F5:2 E5:1 D5:2 C#5:1
        D5:3 r:1 C5:1 A4:1
        Bb4:2 A4:1 G4:2 F4:1
        E4:3 G4:1 A4:2
        F4:3:.7 E4:1:.65 D4:2:.6
        r:1 D5:2:.55 Bb4:1:.5 A4:2:.5
        G4:3:.45 F4:1:.4 D4:2:.4
        E4:4:.35 r:2
        r:2 A4:1:.3:a F4:3:.25:a
        r:6
        r:3 D5:3:.2:a
        r:6
        r:6
        r:6
        r:6`),
    leadFor:a=>jestSec(a)==="minor"?"wisp":"felt",leadVFor:a=>jestSec(a)==="minor"?.2:.3,   // the minor is breathed, not played
    // the minor rushes, slows to breathe, rushes again; the false joy winds down like a music box
    tempo:(b,i,a)=>{const s=jestSec(a),k=a-30;let v=s==="stair"?.9:s==="joy"?.94:s==="warm"?1:s==="fall"?1-.02*(a-22):
        s==="minor"?(k<8?1.08+.035*k:k<11?[1.05,.82,.78][k-8]:k<16?.95+.08*(k-11):1.3-.07*(k-15)):s==="down"?.9-.025*(a-50):.75-.06*((a-58)+i/6);
      if((s==="minor"&&[33,35,39].includes(a)||a===13)&&i>=3)v*=.8;   // a breath
      return v*(.97+.06*h01(a+50))},
    onNote:(e,t,E8,x)=>{const a=x.abs,s=jestSec(a);GL=null;
      if(s==="stair"){if(e.tag.includes("a"))return;on(BUS.perc);wood(t,.022+.01*rnd());on(send(.5,.2,BUS.bass));voice("harp",hz(e.m[0]-12),t,E8,.05*e.vel,.7);return}   // a long-legged step onto a block
      if(s==="fall"||s==="down"){jestSide=-jestSide;BUS.leadPan.pan.setTargetAtTime(jestSide*(s==="fall"?.45+.04*(a-22):.7),t,.06)}   // from one ear to the other
      else BUS.leadPan.pan.setTargetAtTime(s==="minor"?(rnd()-.5)*.4:0,t,.2);
      if((s==="joy"||s==="warm")&&e.l>=2&&rnd()<.45){const C=x.C,base=e.m[0],c=[...C.iv,12].map(v=>C.r+v+24).filter(m=>m>base&&m<=base+12);if(!c.length)return;
        on(send(1,.6));GL={r:1,fall:Math.pow(2,14/1200),ft:.2,fd:1.2};voice("softbox",hz(c[Math.floor(rnd()*c.length)]),t+E8*(1.5+rnd()*1.5),E8*2,.05*e.vel,1.4);GL=null}},
    onBar:x=>{const {t,abs:a,E8,C}=x,B=E8*6,s=jestSec(a);GL=null;
      // hollow <-> warm: how bright the tune is, and how loud the whole song swells
      const open={stair:1400,joy:2400+250*(a-10),warm:5200,fall:4600-500*(a-22),minor:a===45?3000:1900+60*((a-30)%5),down:1700-150*(a-50),false:2600}[s];
      const swell={stair:.55+.02*a,joy:.72+.03*(a-10),warm:1.05,fall:1-.07*(a-22),minor:a===45?1.08:.82+.04*((a-30)%4),down:.75-.06*(a-50),false:.45}[s];
      BUS.leadLP.frequency.setTargetAtTime(open,t,B*.35);BUS.swl.gain.setTargetAtTime(swell,t,B*.45);
      // the muffled bass: long slow legs on the stair, an oom-pah circus in the minor, trying
      on(send(.15,0,BUS.bass));
      if(s==="stair"){if(a%2===0)voice("mbass",hz(C.b-12),t,B*1.9,.32,.9)}
      else if(s==="minor"){voice("mbass",hz(C.b-12),t,B*.25,.5,.2);voice("mbass",hz(C.b-12+C.fifth),t+B*.5,B*.22,.38,.2);
        on(send(.3,.1));for(const q of [1,2,4,5])for(const v of C.iv.slice(1,3))voice("harp",hz(C.r+12+v),t+q*E8,E8*.5,.022,.25)}
      else if(s==="false"){if(a===58)voice("mbass",hz(C.b-12),t,B*2.5,.22,1.5)}
      else{const v=s==="down"?.42-.05*(a-50):s==="fall"?.46-.03*(a-22):.46;voice("mbass",hz(C.b-12),t,B*.98,v,.6);
        if(s==="warm"||s==="joy"&&a%2)voice("mbass",hz(C.b-12+C.fifth),t+B*.5,B*.4,v*.5,.4)}
      // the warm pad, and Rain's strings where the warmth is
      const pv={joy:.022,warm:.04,fall:.035-.003*(a-22),minor:.018,down:.02-.002*(a-50),false:.014}[s]||0;
      if(pv){on(send(.6,.1,BUS.bass));voice("warm",C.iv.slice(0,3).map(v=>hz(C.r+v+12)),t,B*1.02,pv,.8)}
      if(s==="warm"||s==="fall"&&a<26||s==="minor"&&a>=42&&a<=46){on(send(.7,.2,BUS.bass));voice("viol",hz(C.r+12+C.third),t,B*1.05,.018,.8);voice("viol",hz(C.r+C.fifth),t+.05,B*1.05,.014,.8)}
      // a harp from the left ear to the right (or back)
      if(s==="joy"&&a%2===0||s==="warm"){const up=a%4!==2,p=panTo(up?-.8:.8,up?.8:-.8,t,B*.9,.5,.25),ns=[...C.iv.slice(0,3),12,12+C.iv[1],12+C.iv[2]];
        [0,1,2,3,4,5].forEach((q,k)=>{if(s==="joy"&&h01(a+k)<.25)return;on(p);voice("harp",hz(C.r+12+ns[up?k:5-k]),t+q*E8,E8,(s==="warm"?.1:.065)*(.7+.3*Math.sin(Math.PI*k/6)),.9)})}
      // in the minor, a music box looks happy: a cheery run that hops from ear to ear
      if(s==="minor"&&![33,35,39].includes(a)){const side=a%2?-.6:.6,p=panTo(side,-side,t,B,.6,.3),pat=[0,C.iv[1],C.iv[2],12,C.iv[2],C.iv[1]];
        pat.forEach((v,k)=>{if(k%2&&h01(a*7+k)<.3)return;on(p);voice("softbox",hz(C.r+24+v),t+k*E8,E8*.7,.032,.7)})}
      // false joy: the music box winds down, a little out of tune, far away
      if(s==="false"){const p=panTo(a%2?-.5:.5,a%2?.5:-.5,t,B,1,.5),tune=[[4,7,12,7,4,7],[9,7,4,2,4,-3],[0]][a-58];
        tune.forEach((v,k)=>{on(p);GL={r:1,fall:Math.pow(2,-(10+25*k/6)/1200),ft:.15,fd:1};voice("softbox",hz(C.r+24+v),t+k*E8,E8*.8,.05-.008*(a-58),1.2);GL=null})}
      // a far bell, a little out of tune
      if([3,7,29,55].includes(a)){const st=t+B*.4,side=h01(a+7)>.5?-.7:.7;on(panTo(side,side*.6,st,B,1.4,.5));voice("fmbell",hz(C.r+24)*Math.pow(2,-28/1200),st,.4,.018,1.2)}}};
  /* Spring in a Box: a jack-in-the-box of joy, a happy Hollow Knight. A music box opens with the spring (a leap up and a
     step back down). A harp ripples from ear to ear while a bowed voice sings the tune, Greenpath's harp and strings in
     sunlight; the felt piano answers it. The felt piano takes the tune as it flowers, and dances on plucked strings and a
     soft kit; it all quiets down to the music box; then the bowed voice brings it back, and it lifts a whole step into G,
     where the choir sings with it (the "omg"); and the box closes in peace. F major, then G major, in straight time. */
  const SPR_SEC=[[0,"open"],[4,"flow"],[12,"flower"],[16,"dance"],[24,"quiet"],[28,"back"],[32,"omg"],[40,"peace"]];
  const sprSec=a=>{let s="open";for(const [k,n] of SPR_SEC)if(a>=k)s=n;return s};
  const sprLead=a=>{const s=sprSec(a);return s==="open"||s==="quiet"||s==="peace"?"softbox":s==="flower"||s==="dance"?"felt":"bow"};
  const SPRING={name:"Spring in a Box",bpm:88,trim:.7,bar:8,lead:"bow",leadV:.26,rel:.45,leg:1,lp:4200,echo:.14,fb:.22,dly:.68,
    dyn:.85,contrast:.8,hum:.008,rv:.36,ds:.14,rev:[5,.5],wow:[.0008,.25],
    chords:chords("F Bb/F F C F Dm7 Bbmaj7 C F/A Bb Gm7 C7 Fmaj7 Am7 Bbmaj7 C F C/E Dm7 Bb F C Bb C7 Fmaj7 Dm7 Bbmaj7 Bbm F Dm7 Bb D7 G Em7 Cmaj7 D G/B C Am7 D7 G Cmaj7 Em7 D G"),
    mel:mel(`C5:1 F5:1 A5:1 C6:3 Bb5:1 A5:1
        D6:3 C6:1 Bb5:2 F5:2
        C5:1 F5:1 A5:1 C6:3 D6:1 C6:1
        G5:4 r:4
        C4:1 F4:1 A4:1 C5:3 Bb4:1 A4:1
        A4:3 G4:1 F4:2 D4:2
        D4:1 F4:1 A4:1 D5:3 C5:1 Bb4:1
        C5:4 G4:2 E4:2
        C4:1 F4:1 A4:1 C5:3 D5:1 E5:1
        F5:3 D5:1 Bb4:2 C5:1 D5:1
        C5:2 Bb4:1 A4:1 G4:2 F4:1 G4:1
        E4:2 G4:2 Bb4:2 C5:2
        A5:4 G5:1 F5:1 E5:2
        C6:3 A5:1 G5:2 E5:2
        D6:3 C6:1 Bb5:1 A5:1 F5:2
        G5:6 r:2
        F5:1 A5:1 C6:1 A5:1 F5:1 A5:1 C6:2
        E5:1 G5:1 C6:1 G5:1 E5:1 G5:1 C6:2
        D5:1 F5:1 A5:1 F5:1 C6:2 A5:2
        Bb5:2 A5:1 G5:1 F5:2 D5:2
        C5:1 F5:1 A5:1 C6:1 D6:2 C6:2
        E5:1 G5:1 C6:1 E6:1 D6:2 C6:2
        D6:3 C6:1 Bb5:1 A5:1 G5:1 F5:1
        G5:3 E5:1 C5:2 r:2
        C6:2:.7 r:2 A5:1:.6 C6:1:.6 r:2
        A5:2:.6 r:2 F5:1:.55 A5:1:.55 r:2
        D6:4:.6 r:4
        Db6:3:.55 C6:1:.5 r:4
        C4:1:.7 F4:1:.7 A4:1:.75 C5:3:.8 Bb4:1:.8 A4:1:.8
        A4:3:.85 G4:1:.85 F4:2:.85 A4:2:.9
        D4:1:.9 F4:1:.9 Bb4:1:.95 D5:3:1 E5:1 F5:1
        F#5:4:1.05 E5:2 D5:1 C5:1
        D4:1 G4:1 B4:1 D5:3 C5:1 B4:1
        B4:3 A4:1 G4:2 E4:2
        E4:1 G4:1 B4:1 E5:3 D5:1 C5:1
        D5:4 A4:2 F#4:2
        D4:1 G4:1 B4:1 D5:3 E5:1 F#5:1
        G5:3 E5:1 C5:2 D5:1 E5:1
        A5:4:1.1 G5:2 E5:2
        F#5:3 E5:1 D5:2 C5:2
        D5:1:.7 G5:1:.7 B5:1:.7 D6:3:.7 C6:1:.65 B5:1:.65
        B5:4:.6 G5:2:.6 E5:2:.55
        G5:3:.55 F#5:1:.5 E5:2:.5 B4:2:.5
        A5:4:.5 F#5:2:.45 D5:2:.45
        G5:8:.45`),
    leadFor:sprLead,leadVFor:a=>({softbox:.21,felt:.3,bow:.25})[sprLead(a)],
    // steady, but it breathes at the ends of phrases, opens slowly, and slows as the box closes
    tempo:(b,i,a)=>{const s=sprSec(a);let v=s==="open"?.94:s==="quiet"?.9:s==="peace"?.96-.035*(a-40):s==="dance"?1.04:1;
      if(i>=6&&[3,11,15,23,27,31].includes(a))v*=.88;if(a===39&&i>=4)v*=.86;return v*(.99+.02*h01(a+80))},
    onNote:(e,t,E8,x)=>{const a=x.abs,s=sprSec(a),C=x.C,m=e.m.length===1?e.m[0]:null;GL=null;if(m==null)return;
      // the felt piano answers the bowed voice's long notes: three notes of the chord, from the other ear
      if(sprLead(a)==="bow"&&e.l>=3&&h01(a*13+e.s)<.75){const up=[...C.iv,12,12+C.iv[1],12+C.iv[2]].map(v=>C.r+12+v).filter(n=>n>m+2).slice(0,3);
        const p=panTo(.45*(a%2?1:-1),.45*(a%2?1:-1),t,E8*4,.6,.3);up.forEach((n,k)=>{on(p);voice("felt",hz(n+12),t+E8*(1+k*.5),E8*1.5,.07*e.vel*(1-.15*k),.9)})}
      // at the "omg" the felt piano sings along an octave up
      if(s==="omg"){on(send(.5,.2));voice("felt",hz(m+12),t,e.l*E8,.09*e.vel,1)}
      // and a soft bell answers the long notes in the flowering and the dance, as in Bubble Bath in the Sky
      if((s==="flower"||s==="dance")&&e.l>=2&&h01(a*7+e.s)<.4){const c=[...C.iv,12].map(v=>C.r+v+24).filter(n=>n>m&&n<=m+12);if(c.length){on(send(.9,.5));voice("softbox",hz(c[0]),t+E8,E8*2,.045*e.vel,1.2)}}},
    onBar:x=>{const {t,abs:a,E8,C}=x,B=E8*8,s=sprSec(a);GL=null;
      // each section breathes in its own way; now and then a light muffle comes in and leaves again
      const open={open:3200,flow:4200,flower:5600,dance:5000,quiet:2400,back:3000+600*(a-28),omg:6500,peace:3800-450*(a-40)}[s];
      const swell={open:.6+.08*a,flow:.86+.05*(a%4),flower:.85+.07*(a-12),dance:a%2?1:.94,quiet:.6-.04*(a-24),back:.66+.11*(a-28),omg:a===38?1.15:1.02+.04*(a%2),peace:.85-.09*(a-40)}[s];
      BUS.leadLP.frequency.setTargetAtTime(open,t,B*.3);BUS.swl.gain.setTargetAtTime(swell,t,B*.35);
      if((s==="flow"||s==="back")&&a%4===2){BUS.leadLP.frequency.setTargetAtTime(Math.max(1400,open*.4),t+B*.3,B*.15);BUS.leadLP.frequency.setTargetAtTime(open,t+B*.7,B*.2)}
      // the harp: eighths that ripple from one ear to the other, above the bowed voice and below the piano
      const hv={flow:.065,flower:.055,back:.05+.01*(a-28),omg:.075}[s]||(s==="open"&&a>=2?.04:s==="peace"&&a<=42?.04-.008*(a-40):0);
      if(hv){const dir=a%2?1:-1,p=panTo(-.6*dir,.6*dir,t,B,.5,.25),base=C.r+(s==="flower"?0:12),pat=[0,C.fifth,14,12+C.third,12+C.fifth,12+C.third,14,C.fifth],acc=[1,.7,.8,.75,.85,.7,.75,.65];
        pat.forEach((v,k)=>{on(p);voice("harp",hz(base+v),t+k*E8,E8*2,hv*acc[k],.8)})}
      // underneath: a cello holds the root where the tune is bowed; plucked strings walk in the dance
      if(s==="flow"||s==="back"||s==="omg"){on(send(.3,0,BUS.bass));voice("bow",hz(C.b-12),t,B*.98,s==="omg"?.09:.07,.5);voice("mbass",hz(C.b-12),t,B*.95,.17,.6)}
      else if(s==="dance"){on(send(.15,0,BUS.bass));[0,C.fifth,12,C.fifth].forEach((v,k)=>{voice("mbass",hz(C.b-12+v),t+k*2*E8,E8*1.6,k?.24:.3,.4);voice("harp",hz(C.b+v),t+k*2*E8,E8,.07*(k?.8:1),.35)})}
      else if(s==="flower"){on(send(.3,0,BUS.bass));voice("mbass",hz(C.b-12),t,B*.95,.24,.7)}
      else if(a%2===0){on(send(.3,0,BUS.bass));voice("mbass",hz(C.b-12),t,B*1.8,.2,.9)}
      // the pad: warm, and fuller where it flowers and at the "omg"
      const pd={flow:.016,flower:.03,dance:.02,quiet:.022,back:.018,omg:.034,peace:.024}[s]||0;
      if(pd){on(send(.6,.1,BUS.bass));voice("warm",C.iv.slice(0,3).map(v=>hz(C.r+v+12)),t,B*1.02,pd,.8)}
      // strings swell under the flowering and the "omg"
      if(s==="flower"||s==="omg"){on(send(.7,.2,BUS.bass));voice("bow",hz(C.r+12+C.third),t,B*1.04,.03,.8);voice("bow",hz(C.r+12+C.fifth),t+.04,B*1.04,.025,.8)}
      // it flowers: glass on top, from either ear
      if(s==="flower"||s==="omg"&&a%2===1){on(panTo(a%2?.5:-.5,a%2?-.3:.3,t,B,1,.5));voice("glass",hz(C.r+36+C.fifth),t+E8*4,E8*3,.022,1.2)}
      // a soft kit in the dance and the "omg": a brush on 2 and 4, wood on some of the offbeats
      if(s==="dance"||s==="omg"&&a>=34){on(BUS.perc);const pv=s==="omg"?.7:1;for(const k of [2,6])brush(t+k*E8,.022*pv);for(const k of [1,3,5,7])if(h01(a*8+k)<.5)wood(t+k*E8,.011*pv)}
      // a birthday music box skips along in the dance, high up and from the other ear
      if(s==="dance"&&a%2===0){const side=a%4?-.55:.55,p=panTo(side,-side,t,B,.5,.3),pat=[12,C.fifth+12,24,C.fifth+12,12+C.third,C.fifth+12,24,12];
        pat.forEach((v,k)=>{if(h01(a*9+k)<.4)return;on(p);voice("softbox",hz(C.r+24+v),t+k*E8,E8*.6,.022,.6)})}
      // it sings: a choir at the "omg", and a last breath of it as the box closes
      if(s==="omg"||a===40||a===41){on(send(.7,.25));const cv=s==="omg"?.07:.04;for(const v of C.iv.slice(0,3))voice("ooh",hz(C.r+12+v),t+.05,B*.98,cv,.7)}
      // the spring: a little run that leaps up across the ears, as the box opens, before each new part, and as it closes
      const spring=(st,v)=>{const p=panTo(-.7,.7,st,E8*1.5,.7,.4);[0,C.iv[1],C.iv[2],12,12+C.iv[1],12+C.iv[2],24].forEach((n,k)=>{on(p);voice(k<4?"softbox":"glass",hz(C.r+24+n),st+k*E8*.16,E8*.8,v*(1-.05*k),1)})};
      if(a===3||a===15||a===31)spring(t+E8*4.5,.055);if(a===23)spring(t+E8*6,.04);if(a===43)spring(t+E8*5,.045);
      // the quiet: a breath of air before it all comes back
      if(s==="quiet"&&a===27){on(send(1,.4));voice("air",hz(C.r+24+C.fifth),t+E8*4,E8*4,.03,1)}}};
  /* Ducklings in a Row: a mother duck swims out across still water at dusk with a little waddle of a tune (felt piano),
     and her ducklings copy her, two bars late and then four: a music box an octave up from the right ear, a harp two
     octaves up from the left, a little wrong and a little cute, so the song is a round that ripples like a wake. One
     stumbles and has to catch up. In the reeds it all goes hollow and muffled, a heartbeat under the water, and one
     duckling sings alone; nobody answers. Then the mother comes back, the sighing C lifts to C#, and every voice follows
     every other across the ears. They climb out up the bank, last in first out, and the music box is answered by the
     piano: home. D Mixolydian, then D major. Straight time. */
  const DK_SEC=[[0,"still"],[4,"mother"],[12,"row"],[24,"reeds"],[30,"found"],[42,"home"]];
  const dkSec=a=>{let s="still";for(const [k,n] of DK_SEC)if(a>=k)s=n;return s};
  let DK={};   // the mother's notes, bar by bar, for the ducklings to copy
  const DUCKS={name:"Ducklings in a Row",bpm:84,trim:.85,bar:8,lead:"felt",leadV:.3,rel:1,leg:1,lp:3800,echo:.15,fb:.22,dly:.54,
    dyn:.85,contrast:.8,hum:.008,rv:.38,ds:.15,rev:[5.5,.5],wow:[.0009,.25],
    chords:chords("Dadd9 Dadd9 Dadd9 Dadd9 D C/D D C/D D C/D D C/D D C/D D C/D D C/D D C/D D C/D D C/D G Bm7 G Em7 Bm7 A7 D A/C# D A/C# D A/C# D A/C# D A/C# D A/C# D G/D D G/D D D"),
    mel:mel(`A4:8:.7
        r:8
        F#4:4:.75 E4:4:.7
        D4:6:.75 r:2
        D4:1 E4:1 F#4:4 A4:2
        G4:2 E4:2 D4:3 C4:1
        D4:1 E4:1 F#4:2 A4:2 D5:2
        C5:3 G4:1 E4:2 D4:2
        D4:1 E4:1 F#4:4 A4:2
        G4:2 E4:2 D4:3 C4:1
        F#4:1 G4:1 A4:4 F#4:2
        G4:2 E4:1 G4:1 C5:2 E4:2
        D4:1 E4:1 F#4:2 A4:2 D5:2
        C5:3 G4:1 E4:2 D4:2
        F#4:1 G4:1 A4:4 F#4:2
        G4:2 E4:1 G4:1 C5:2 E4:2
        D5:3 A4:1 F#4:2 E4:2
        E4:2 G4:2 C4:4
        D4:1 E4:1 F#4:4 A4:2
        G4:2 E4:2 D4:3 C4:1
        D4:1 E4:1 F#4:2 A4:2 D5:2
        C5:3 G4:1 E4:2 D4:2
        D5:3 A4:1 F#4:2 E4:2
        E4:2 G4:2 C4:4
        r:8
        D5:1 E5:1 F#5:4 r:2
        G5:2 E5:2 D5:4
        r:8
        D5:1:.85 E5:1:.85 F#5:4:.85 r:2
        G5:2:.85 E5:2:.85 C#5:4:.95
        D4:1 E4:1 F#4:4 A4:2
        A4:2 G4:1 E4:1 C#4:4
        D4:1 E4:1 F#4:2 A4:2 D5:2
        C#5:3 A4:1 E4:2 C#4:2
        F#4:1 G4:1 A4:4 F#4:2
        E4:2 C#4:1 E4:1 A4:2 E4:2
        D5:3 A4:1 F#4:2 E4:2
        E4:2 A4:2 C#5:4
        D4:1 E4:1 F#4:2 A4:2 D5:2
        C#5:3 A4:1 E4:2 C#4:2
        D4:1 E4:1 F#4:4 A4:2
        A4:2 G4:1 E4:1 C#4:4
        D4:1:.8 E4:1:.8 F#4:4:.8 A4:2:.75
        G4:2:.7 E4:2:.7 D4:4:.65
        r:8
        r:8
        r:8
        r:8`),
    leadFor:a=>dkSec(a)==="reeds"?"softbox":"felt",leadVFor:a=>dkSec(a)==="reeds"?.22:.3,
    // steady, breathing at the ends of the parts; slow in the reeds; slowing as they climb out
    tempo:(b,i,a)=>{const s=dkSec(a);let v=s==="still"?.95:s==="reeds"?.92:s==="home"?.97-.03*(a-42):1;
      if(i>=6&&[3,23,29,41].includes(a))v*=.86;return v*(.99+.02*h01(a+40))},
    onNote:(e,t,E8,x)=>{const a=x.abs,s=dkSec(a),m=e.m.length===1?e.m[0]:null;GL=null;if(m==null)return;
      (DK[a]=DK[a]||[]).push({p:e.s-a*8,l:e.l,m,v:e.vel});
      // when everyone is found, soft strings sing along with the mother
      if(s==="found"){on(send(.5,.2));voice("bow",hz(m),t,e.l*E8,.05*e.vel,.6)}},
    onBar:x=>{const {t,abs:a,E8,C}=x,B=E8*8,s=dkSec(a);GL=null;if(a===0)DK={};
      // each part has its own breath; the reeds close in over everything, and open again when she comes back
      const swell={still:.7+.05*a,mother:.88+.03*(a%2),row:.82+.015*(a-12),reeds:.66,found:1.06+.04*(a%2)+(a>=38?.08:0),home:.9-.08*(a-42)}[s];
      BUS.swl.gain.setTargetAtTime(swell,t,B*.35);
      if(s==="reeds")BUS.lp.frequency.setTargetAtTime(a===29?2200:1100,t,B*.3);else BUS.lp.frequency.setTargetAtTime(3800,t,a===30?B*.5:B*.2);
      BUS.leadPan.pan.setTargetAtTime(s==="reeds"?.4:s==="found"?0:-.25,t,B*.3);   // the mother a little to the left; the lonely duckling to the right
      // the ducklings: the music box two bars behind her, the harp four; one stumbles (late), and one misses a bar
      const sing=(src,ty,up,v,p)=>{for(const n of DK[src]||[]){let st=t+n.p*E8,d=n.l*E8;if(ty==="softbox"&&(a===18||a===19)){st+=E8*.5;d=Math.max(E8*.5,d-E8*.5)}
        on(p);voice(ty,hz(n.m+up),st,d*.9,v*n.v,ty==="harp"?.8:.9)}};
      const mb=a>=6&&a<=45&&s!=="reeds"&&!["reeds"].includes(dkSec(a-2))&&a!==22&&a!==43,hp=a>=16&&a<=41&&s!=="reeds"&&dkSec(a-4)!=="reeds";
      if(mb){const p=s==="found"?panTo(-.6,.6,t,B*2,.5,.3):panTo(.5,.5,t,B,.5,.3);sing(a-2,"softbox",12,.085,p)}
      if(hp){const p=s==="found"?panTo(.7,-.7,t,B*2,.5,.3):panTo(.6,-.6,t,B,.5,.3);sing(a-4,"harp",24,.065,p)}
      // underneath: a bass note held in the still water; it walks once the row grows; a heartbeat in the reeds
      on(send(.25,0,BUS.bass));
      if(s==="still"||s==="home"){if(a%2===0)voice("mbass",hz(C.b-12),t,B*1.8,.22,.9)}
      else if(s==="mother")voice("mbass",hz(C.b-12),t,B*.95,.2,.6);
      else if(s==="row")[0,C.fifth,12,C.fifth].forEach((v,k)=>voice("mbass",hz(C.b-12+v),t+k*2*E8,E8*1.8,k?.15:.2,.4));
      else if(s==="reeds"){voice("mbass",hz(C.b-12),t,E8*.8,.24,.3);voice("mbass",hz(C.b-12),t+E8*.75,E8*.8,.15,.4)}
      else if(s==="found"){voice("mbass",hz(C.b-12),t,B*.95,.2,.6);voice("bow",hz(C.b-12),t,B*.98,.07,.5)}
      // the pad, low and warm; fuller when everyone is found
      const pd={still:.012,mother:.014,row:.018,reeds:.012,found:.03,home:.02-.003*(a-42)}[s];
      if(pd>0){on(send(.6,.1,BUS.bass));voice("warm",C.iv.slice(0,3).map(v=>hz(C.r+v+12)),t,B*1.02,pd,.8)}
      // strings swell in as the row grows, and under everything when they are found
      if(s==="row"&&a>=16||s==="found"){on(send(.7,.2,BUS.bass));const sv=s==="found"?.03:.012+.002*(a-16);voice("bow",hz(C.r+12+C.third),t,B*1.04,sv,.8);voice("bow",hz(C.r+12+C.fifth),t+.04,B*1.04,sv*.8,.8)}
      // a choir: far off in the reeds, close when they are found
      if(s==="reeds"&&a>=25||s==="found"){on(send(s==="reeds"?1.4:.7,.3));const cv=s==="reeds"?.03:.055;for(const v of C.iv.slice(0,3))voice("ooh",hz(C.r+12+v),t+.05,B*.98,cv,.7)}
      // chimes on the downbeats when they are found, from either ear
      if(s==="found"){on(panTo(a%2?.5:-.5,a%2?.3:-.3,t,B,1,.5));voice("glass",hz(C.r+24+(a%4<2?0:C.fifth)),t,E8*3,.024,1.2)}
      // still water: the faintest ripple of air before she starts to swim
      if(a===2){on(send(1,.4));voice("air",hz(C.r+24+C.fifth),t+E8*4,E8*4,.025,1)}
      // home: the last music box note, and the piano answers
      if(a===46){on(panTo(.4,.4,t,B,.8,.4));voice("softbox",hz(C.r+24+C.fifth),t+E8*2,E8*4,.12,1.4)}
      if(a===47){on(send(.6,.3));voice("felt",hz(C.r+12),t+E8,E8*6,.22,1.6);voice("felt",hz(C.r),t+E8*1.1,E8*6,.14,1.6)}}};
  // TRACK_CONST: POND
  /* Infinite Pond: night, a pond so still the sky lies in it, and one rubber duck that can't tell where the water stops
     and the stars start. A vibraphone is the glow on the water: every note rings out and breathes on its slow tremolo.
     The whole song breathes, two bars in and two bars out, over a slow half-time heartbeat far below (a thump and its
     "dub", a brush on beat 3). It drifts out (Ripple), dips under (Deep: muffled, only the heartbeat and a wisp), takes
     one huge breath and lifts a half step into F Lydian (Other Shore), surfaces for two bars of a wide-open
     Emaj9 (Air), and sinks back, kindly, passing the tune from ear to ear until it stops on C# over
     F#7, unresolved, because the pond doesn't end. E Lydian, 66 bpm, straight eighths. */
  IV["9b5"]=[0,4,6,10,14];IV["maj9"]=[0,4,7,11,14];
  const PND_SEC=[[0,"surface"],[6,"ripple"],[14,"deep"],[22,"shore"],[30,"air"],[34,"infinite"]];
  const pndSec=a=>{let s="surface";for(const [k,n] of PND_SEC)if(a>=k)s=n;return s};
  // breathing in or out: two bars each, and four each in the last part
  const pndIn=a=>a>=34?(a-34)%8<4:(a+2)%4<2;   // Ripple, Deep, Other Shore and Air each start on a breath in
  const POND={name:"Infinite Pond",bpm:66,trim:1.2,bar:8,lead:"vibes",leadV:.4,rel:.8,leg:1.02,lp:4000,echo:.1,fb:.24,dly:.909,
    dyn:.6,contrast:.86,hum:.006,rv:.5,ds:.12,rev:[6.5,.55],wow:[.0007,.2],
    chords:chords(`Emaj7 Emaj7 Emaj7#11 Emaj7#11 Emaj7 Emaj7
      Emaj7 Emaj7#11 F#7 Emaj7#11 C#m7 F#7 Emaj7#11 Emaj7
      Emaj7#11 Emaj7#11 C#m7 C#m7 A#m7b5 A#m7b5 Emaj7#11 Emaj7
      Fmaj7 Fmaj7#11 G7 Fmaj7#11 Dm7 G7 Fmaj7#11 Fmaj7
      Emaj9 Emaj9 F#7/E Emaj7
      Emaj7 Emaj7#11 C#m7 F#7 Emaj7 Emaj7#11 C#m7 Emaj7 F#7/E F#7/E`),
    mel:mel(`r:8
        G#4:8:.75
        r:4 A#4:4:.8
        C#5:8:.85
        r:8
        r:8
        G#4:4 A#4:2 C#5:2
        D#5:6 C#5:2
        A#4:4 G#4:2 E4:2
        F#4:8
        C#5:4 D#5:2 E5:2
        F#5:6 E5:1 D#5:1
        C#5:4 A#4:4
        G#4:6 C#5:2:.5:a
        E4:8:.85
        r:8
        C#4:4:.8 D#4:4:.85
        E4:8:.85
        A#3:8:.8
        r:8
        G#3:4:.75 A#3:4:.8
        r:8
        A4:4:.95 B4:2 D5:2
        E5:6:1.05 D5:2
        B4:4 A4:2 F4:2
        G4:8
        D5:4 E5:2 F5:2
        G5:6:1.1 F5:1 E5:1
        D5:4 B4:4
        A4:6 D5:2:.55:a
        G#4:2:1.05 B4:2:1.05 D#5:4:1.1
        F#5:6:1.15 E5:2:1.05
        D#5:4:.9 C#5:4:.85
        G#4:8:.8
        G#4:4:.75 A#4:2:.75 C#5:2:.75
        D#5:6:.75 C#5:2:.7
        r:8
        C#5:4:.7 D#5:2:.7 E5:2:.7
        F#5:6:.7 E5:1:.65 D#5:1:.65
        r:8
        G#4:4:.6 A#4:4:.6
        C#5:8:.6
        r:8
        r:8`),
    // a breath in is a hair slower, a breath out a hair faster; the ends of the parts hold their breath
    tempo:(b,i,a)=>{let v=pndIn(a)?.97:1.02;if(a<6)v*=.98;if(i>=6&&[5,13,21,29,33,43].includes(a))v*=.88;return v},
    onNote:(e,t,E8,x)=>{const a=x.abs,s=pndSec(a),m=e.m.length===1?e.m[0]:null;GL=null;if(m==null||e.tag.includes("a"))return;
      // in the last part each fragment is answered by a glass chime from the other ear
      if(s==="infinite"){const side=-.4+.8*Math.min(1,(a-34)/9),p=side>0?-.55:.55;on(panTo(p,p*.8,t,E8*6,1,.4));voice("glass",hz(m-12),t+E8*2,E8*2,.026*e.vel,1.5)}
      // at the top, the strings sing the tune an octave down
      if(s==="air"){on(send(.6,.2));voice("bow",hz(m-12),t,e.l*E8,.05*e.vel,.8)}},
    onBar:x=>{const {t,abs:a,E8,C}=x,B=E8*8,s=pndSec(a),inh=pndIn(a);GL=null;
      // each part has a size; inside it the song breathes in (swells, opens) and out (sinks, goes hollow)
      const base={surface:.5+.03*a,ripple:.82,deep:.5,shore:a<24?.75+.18*(a-22):1.02,air:a<32?1.12:.92-.1*(a-32),infinite:.72-.025*(a-34)}[s];
      const sw=s==="deep"?base*(inh?1.06:.92):s==="air"?base:base*(inh?1.14:.8);
      BUS.swl.gain.setTargetAtTime(sw,t,B*(s==="infinite"?.9:.55));
      const lpo={surface:1500,ripple:inh?3800:2600,deep:1100,shore:inh?4300:3000,air:a<32?4500:3200-400*(a-32),infinite:(inh?2900:2100)-60*(a-34)}[s];
      BUS.lp.frequency.setTargetAtTime(lpo,t,B*(a===22?.6:.45));
      const lead={surface:2400,ripple:inh?6000:2600,deep:1300,shore:inh?6500:3200,air:6500,infinite:inh?4200:2200}[s];
      BUS.leadLP.frequency.setTargetAtTime(lead,t,B*.5);
      const pan={surface:0,ripple:-.12,deep:0,shore:.12,air:0,infinite:-.4+.8*(a-34)/9}[s];
      BUS.leadPan.pan.setTargetAtTime(pan,t,B*(s==="infinite"?.6:.35));
      // the heartbeat far below, half time: a thump and its little "dub", a brush on beat 3; the muffled bass with it
      const hb=s==="ripple"?(a<8?.12+.05*(a-6):.2):s==="deep"?.24:s==="shore"?.22:s==="air"?.24:s==="infinite"&&a<40?.18-.02*(a-34):0;
      if(hb){on(BUS.perc);thump(t,hb,50,.12);thump(t+E8*1.05,hb*.45,48,.1);if(s!=="deep")brush(t+E8*4,.012+.006*(hb>.2));
        on(send(.2,0,BUS.bass));voice("mbass",hz(C.b-12),t,E8*1.6,hb*.85,.7);if(s!=="deep")voice("mbass",hz(C.b-12),t+E8*4,E8*.8,hb*.3,.6)}
      // the warm pad: the whole chord, low; not under the water
      const pd={surface:.016,ripple:.016,deep:0,shore:.02+.002*(a-22),air:a<32?.032:.022,infinite:Math.max(.006,.016-.0012*(a-34))}[s];
      if(pd){on(send(.7,.1,BUS.bass));voice("warm",C.iv.slice(0,4).map(v=>hz(C.r+12+v)),t,B*1.04,pd*(inh?1.1:.85),1)}
      // glass chimes on the chord's tones, half notes, travelling left to right (Ripple), right to left (Other Shore), both at the top
      if(s==="ripple"||s==="shore"||s==="air"){const tones=[...C.iv.slice(0,3),12],dir=s==="shore"?-1:s==="air"?(a%2?-1:1):1,p=panTo(-.7*dir,.7*dir,t,B,.9,.35);
        tones.forEach((v,k)=>{on(p);voice("glass",hz(C.r+12+v),t+k*2*E8,E8*2,(s==="air"?.024:.017)*(k?.8:1),1.3)})}
      // a choir very far away, on the long breaths
      if((s==="ripple"&&a>=10||s==="shore"||s==="air"||s==="infinite"&&a<40)&&(s==="air"||a%2===0)){on(send(1.4,.3));const cv=s==="air"?.034:s==="infinite"?.014:.018;
        for(const v of (s==="air"?C.iv:C.iv.slice(0,3)))voice("ooh",hz(C.r+12+v),t+.05,B*(s==="air"?.98:1.9),cv,1.2)}
      // soft strings from the other shore to the top: the root low, a chord tone above
      if(a>=22&&a<=33){on(send(.7,.2,BUS.bass));const bv=s==="air"&&a<32?.05:.032;voice("bow",hz(C.b),t,B*1.02,bv,.9);voice("bow",hz(C.r+12+C.fifth),t+.06,B*1.02,bv*.7,.9)}
      // under the water a wisp answers the vibraphone in the empty bars
      if(s==="deep"&&[15,19,21].includes(a)){on(send(.9,.1));const w=[C.iv[1],C.iv[2],C.iv[3]||12].map(v=>C.r+12+v);
        w.forEach((n,k)=>voice("wisp",hz(n),t+E8*(k*2),E8*(k===2?3.5:1.8),.04*(1-.15*k),.8))}
      // a falling breath sighs at the end of some breaths out (never under the water)
      if((s==="ripple"||s==="shore"||s==="infinite")&&!inh&&pndIn(a+1)&&h01(a*17+3)<.7){on(send(1.2,.4));voice("air",hz(C.r+24+C.fifth),t+E8*5.5,E8*2.5,.016,1)}
      // the surface: the first breath on the water before anything sings
      if(a===1){on(send(1.2,.4));voice("air",hz(C.r+24+C.iv[1]),t+E8*3,E8*4,.018,1.2)}
      // the end: the pond keeps going, one last far chime
      if(a===42){on(panTo(.5,.3,t,B*2,1.2,.5));voice("glass",hz(C.r+12+C.iv[2]),t+E8*3,E8*4,.016,2)}}};
  /* TRACK_CONST: SWIM */
  /* Outer Space Swim Commute: every morning a rubber duck swims to work through space. Eb Lydian dominant (Eb F G A Bb
     C Db), 66 bpm, straight 4/4. A slow celesta tune keeps landing on the raised fourth (A, the wonder note) while soft
     harp sixteenths ripple from ear to ear under it, up and back over two octaves of chord tones, the 9th and the #11.
     Launch Pad (hollow, ripples and pad only), Morning Orbit (the tune, the bass comes in), Rush Hour Comets (a cello on
     the right, then a far choir; it swells and hurries a little), the Dark Side (muffled, the ripples thin to one ear,
     the tune comes apart into far single notes), the Ringed Planet (a half step up into E, the fullest: chimes, choir,
     two ripples crossing both ways), then the Pond of Stars (back in Eb; the choir, the cello and the bass leave one by
     one, the ripples slow to drops) and it ends on A, the #11, still ringing. */
  IV["7#11"]=[0,4,7,10,18];IV["m6"]=[0,3,7,9];IV["maj7#5"]=[0,4,8,11];
  const SWIM_SEC=[[0,"launch"],[4,"orbit"],[12,"rush"],[20,"dark"],[24,"ring"],[34,"home"]];
  const swimSec=a=>{let s="launch";for(const [k,n] of SWIM_SEC)if(a>=k)s=n;return s};
  const SWIM_CH=("Eb7#11 Eb7#11 Eb7#11 Eb7#11 Eb7#11 F/Eb Bbm6 Eb7#11 Eb7#11 Dbmaj7#5 Cm7 Eb7#11 Cm7 F7 Bbm6 Eb7#11 Dbmaj7#5 Cm7 F/Eb Eb7#11 "+
    "Eb7#11 Cm7 Bbm6 Eb7#11 E7#11 F#/E Bm6 E7#11 E7#11 Dmaj7#5 C#m7 E7#11 F#/E E7#11 Eb7#11 F/Eb Bbm6 Eb7#11 Eb7#11 Eb7#11").split(" ");
  // the ripples, as steps above the key's tonic in octave 4: eight notes up (the ninth is the top), then back down
  const SWIM_RIP={I:[0,7,10,14,16,18,19,21,22],II:[0,2,6,9,12,14,18,21,24],v:[-5,2,4,7,10,14,16,19,22],bVII:[-2,2,6,9,10,14,18,21,22],vi:[-3,4,7,9,12,16,18,19,21],II7:[2,6,9,12,14,16,18,21,24]};
  const SWIM_RT={"Eb7#11":"I","E7#11":"I","F/Eb":"II","F#/E":"II","Bbm6":"v","Bm6":"v","Dbmaj7#5":"bVII","Dmaj7#5":"bVII","Cm7":"vi","C#m7":"vi","F7":"II7"};
  const swimRip=bar=>{const r=SWIM_RIP[SWIM_RT[SWIM_CH[bar]]],k=63+(bar>=24&&bar<34?1:0);return [...r.slice(0,8),r[8],...r.slice(1,8).reverse()].map(v=>v+k)};
  let SWIM_P=null;
  const SWIM={name:"Outer Space Swim Commute",bpm:66,trim:1.02,bar:8,lead:"celesta",leadV:.3,rel:.9,leg:1,lp:1200,echo:.1,fb:.2,dly:.68,
    dyn:.7,contrast:.85,hum:.006,rv:.4,ds:.12,rev:[6,.45],wow:[.0006,.2],
    chords:chords(SWIM_CH.join(" ")),
    mel:mel(`r:8 r:8 r:8 r:8
        Bb4:3 G4:1 A4:4
        C5:2 F5:6
        Db5:3 C5:1 Bb4:2 G4:2
        A4:6 r:2
        Bb4:3 G4:1 Eb5:4
        Db5:2 C5:2 A4:4
        G4:3 Bb4:1 C5:4
        Eb5:6 r:2
        G5:2 F5:2 Eb5:2 C5:2
        A5:6 F5:2
        Db5:4 F5:2 G5:2
        Bb5:8
        C6:3 A5:1 F5:4
        Eb5:2 G5:2 Bb5:4
        A5:4 G5:2 F5:2
        G5:6 r:2
        r:4 A5:4:.8
        r:8
        Bb5:2:.75 r:2 G5:4:.7
        r:8
        B5:3 G#5:1 A#5:4
        C#6:2 F#6:6
        D6:3 C#6:1 B5:2 G#5:2
        A#5:6 r:2
        B5:3 G#5:1 E6:4
        D6:2 C#6:2 A#5:4
        G#5:3 B5:1 C#6:4
        E6:6 r:2
        F#5:2 G#5:2 A#5:4
        B5:8
        Bb4:3:.85 G4:1:.85 A4:4:.85
        C5:2:.8 F5:6:.8
        Db5:4:.75 C5:4:.7
        A4:8:.7
        r:8 r:8`),
    // it breathes: a slow at the end of the first orbit, the rush presses, the dark side is slow, the planet is steady,
    // and the glide home slows from .92 to .8
    tempo:(b,i,a)=>{let v=1;const s=swimSec(a);
      if(a===11&&i>=6)v=.92;else if(a>=12&&a<=18)v=1.02;else if(a===19)v=i>=5?.88:.97;
      else if(s==="dark")v=a===23&&i>=5?.85:.94;else if(a===32||a===33)v=.95;else if(s==="home")v=.92-.12*((a-34)+i/8)/6;
      return v},
    onNote:(e,t,E8,x)=>{const a=x.abs,s=swimSec(a),m=e.m.length===1?e.m[0]:null;GL=null;if(m==null)return;
      // on the ringed planet the long notes have a softer celesta an octave under them: full, still small
      if(s==="ring"&&e.l>=3){on(send(.5,.15,BUS.lead));voice("celesta",hz(m-12),t+.012,e.l*E8,.3*.32*e.vel,.9)}},
    step:x=>{const {t,i,E8,abs:a,bar}=x,s=swimSec(a);GL=null;
      if(i===0){const dir=a%2?-1:1;SWIM_P={main:panTo(-.65*dir,.65*dir,t,E8*8,.5,.25),up:s==="ring"?panTo(.7*dir,-.7*dir,t,E8*8,.6,.3):null,
          dark:s==="dark"?panTo(.6,.75,t,E8*8,.9,.3):null,rip:swimRip(bar)}}
      if(!SWIM_P)return;const R=SWIM_P.rip;
      // the harp ripples: sixteenths that rush past like the stars, well under the celesta
      const lv={launch:[.045,.05,.055,.05][a],orbit:.04,rush:.042,ring:.042,home:.038-.004*(a-34)}[s]||0;
      const play=(k,j,n,v,p,d)=>{on(p);voice("c2_harp",hz(n),t+k*E8/2,d,v*(j%4===0?1:j%2?.72:.85),.6)};
      if(s==="dark"){on(SWIM_P.dark);voice("c2_harp",hz(R[i]),t,E8,.032*(i%2?.75:1),.7);return}   // thinned to eighths, in the right ear only
      if(s==="home"&&a>=36){   // they slow to drops
        if(a===36){on(SWIM_P.main);voice("c2_harp",hz(R[i]),t,E8,.03,.8)}
        else if(a===37&&i%2===0){on(SWIM_P.main);voice("c2_harp",hz(R[i*2]),t,E8*2,.028,.9)}
        else if(a>=38&&i===0){on(SWIM_P.main);voice("c2_harp",hz(R[a===38?4:6]),t,E8*4,a===38?.024:.028,1.2)}
        return}
      for(const k of [0,1]){const j=i*2+k;play(k,j,R[j],lv,SWIM_P.main,E8);
        if(SWIM_P.up)play(k,j,R[15-j]+12,.022,SWIM_P.up,E8)}},   // on the ringed planet a second ripple an octave up crosses the other way
    onBar:x=>{const {t,abs:a,E8,C}=x,B=E8*8,s=swimSec(a);GL=null;
      // hollow to full, by section: the whole mix's swell, a low-pass on everything, and one on the tune alone
      const swell={launch:[.75,.8,.85,.85][a],orbit:.8+.025*(a-4)-(a===8?.06:0),rush:.92+.025*(a-12)-(a===19?.05:0),dark:a===20?.6:.52,ring:a<32?1.1:1.04,home:.88-.07*(a-34)}[s];
      const lp={launch:[1200,1700,2300,3000][a],orbit:3800,rush:4200,dark:900,ring:4800,home:3800-250*(a-34)}[s];
      const llp={launch:4500,orbit:4500,rush:5500,dark:2000,ring:6000,home:4500-300*(a-34)}[s];
      BUS.swl.gain.setTargetAtTime(swell,t,B*(s==="ring"&&a===24?.08:.3));BUS.lp.frequency.setTargetAtTime(lp,t,B*(a===24?.06:a===20?.25:.3));
      BUS.leadLP.frequency.setTargetAtTime(llp,t,B*.3);BUS.leadPan.pan.setTargetAtTime(a>=24?0:s==="dark"?-.35:-.2,t,B*.4);
      SWIM.rv=s==="dark"?.95:.4;SWIM.ds=s==="dark"?.35:.12;   // on the dark side the tune's notes float off far into the room
      // a warm pad under it all, fullest on the planet
      const pd={launch:.02,orbit:.016,rush:.02,dark:.013,ring:.028,home:.02-.002*(a-34)}[s];
      on(send(.6,.1,BUS.bass));voice("warm",C.iv.slice(0,3).map(v=>hz(C.r+v+12)),t,B*1.02,pd,.8);
      // the muffled bass, a whole note a bar, from the first orbit until the last two bars
      if(a>=4&&a<=37){on(send(.3,0,BUS.bass));voice("mbass",hz(C.b-12),t,B*.97,s==="dark"?.12:s==="ring"?.21:s==="home"?.17-.02*(a-34):.18,.7)}
      // a cello on the right: long notes from rush hour, two on the planet; gone after bar 36
      if(s==="rush"||s==="ring"||a===34||a===35){on(panTo(.5,.42,t,B,.6,.15));const v=s==="ring"?.04:s==="home"?.032:.03+.003*(a-12);
        voice("bow",hz(C.r+12+(a%2?C.third:C.fifth)),t+.03,B*1.0,v,.8);if(s==="ring")voice("bow",hz(C.r+(a%2?C.fifth:12+C.third)),t+.06,B*1.0,v*.8,.8)}
      // a far choir in the comets, close on the planet, one last breath of it as she glides home
      if(a>=16&&a<=19||s==="ring"||a===34){on(send(s==="rush"?1.3:.75,.25));const cv=s==="rush"?.022+.003*(a-16):s==="ring"?.045:.026;
        for(const v of C.iv.slice(0,3))voice("ooh",hz(C.r+12+v),t+.05,B*.98,cv,.8)}
      // chimes on the planet's downbeats, from either ear
      if(a===24||a===26||a===28||a===30){on(panTo(a%4?.55:-.55,a%4?.25:-.25,t,B,1,.5));voice("glass",hz(C.r+24+C.fifth),t,E8*3,.026,1.3);voice("glass",hz(C.r+24),t+.03,E8*3,.016,1.3)}
      // one soft low thump on beat 1 of every other bar: a paddle stroke
      if(a%2===0&&a>=2&&a<=36){on(BUS.perc);thump(t,s==="dark"?.1:s==="launch"?.12:.17,hz(C.b-12),.16,.012)}
      // coming round the dark side: a run of harp up through the chord across the ears, and the ringed planet lights up
      if(a===23){const p=panTo(-.7,.7,t+E8*5,E8*3,.8,.4),run=[51,55,58,61,63,65,67,69,70,73,75,77];run.forEach((n,k)=>{on(p);voice("c2_harp",hz(n+12),t+E8*(5+k*.25),E8,.03+.002*k,.9)})}
      // the glide home: a falling breath before the key drops back to Eb
      if(a===33){on(send(1,.4));voice("air",hz(C.r+24+C.fifth),t+E8*5,E8*3,.03,1)}}};
  // TRACK_CONST: WADDLE
  /* Waddle before you paddle: a duckling's first walk from the nest to the pond. The kalimba is the duckling, and the
     waltz is its walk: a low note on 1 is the body, the chord on 2 is the left foot (left ear) and the chord on 3 the
     right foot (right ear). The one sad note of G harmonic major (Eb) is the nest: each time the tune touches it, the
     duckling looks back. Halfway it stops and everything goes hollow; then it waddles on, braver, a cello beside it. At
     the water's edge it gets nervous (toe-taps, the tempo leans forward), holds its breath ... splash: up a whole step to
     A harmonic major, and the waddle becomes a glide, kalimba ripples paddling from ear to ear. It floats home, the sad
     note comes back once and is let go, and it lands in plain warm major. 3/4, straight eighths. */
  IV["dim7"]=[0,3,6,9];
  const WDL_SEC=[[0,"nest"],[8,"steps"],[24,"back"],[32,"again"],[48,"wobble"],[56,"paddle"],[76,"home"]];
  const wdlSec=a=>{let s="nest";for(const [k,n] of WDL_SEC)if(a>=k)s=n;return s};
  const WDL_A=`B4:2 D5:2 G5:2  E5:3 D5:1 C5:2  Eb5:4:1.05 D5:2  B4:4 r:2
        G4:2 B4:2 E5:2  C5:3 B4:1 A4:2  A4:2 F#4:2 A4:1 C5:1  B4:4 G4:2`;
  const WDL_B=`G5:2 F#5:2 E5:2  Eb5:4:1.05 B4:2  D5:3 B4:1 G4:2  E5:2 C5:2 E5:2
        A5:3 G5:1 E5:2  Eb5:2:1.05 C5:2 A4:2  F#4:3 A4:1 C5:2  G4:6`;
  const wdlUp=(m,k)=>m.map(([n,l,v,tg])=>[n==null?null:Array.isArray(n)?n.map(y=>y+k):n+k,l,v,tg]);
  const WDL_CTR=[59,60,60,59,59,57,54,55,59,59,59,60,60,60,57,55];   // the cello beside it: B3 C4 C4 B3 B3 A3 F#3 G3, B3 B3 B3 C4 C4 C4 A3 G3
  let WDL_RP=null;   // the paddling ripple's way across the ears, two bars at a time
  const WADDLE={name:"Waddle before you paddle",bpm:96,trim:1.17,bar:6,lead:"kalimba",leadV:.28,rel:1,leg:1,lp:4200,echo:.12,fb:.2,dly:.47,
    dyn:.8,contrast:.85,hum:.006,rv:.32,ds:.12,rev:[4.5,.5],wow:[.0007,.22],
    chords:chords(`G G C Cm G Cm G D7
      G C Cm G Em Am7 D7 G Em Ebaug G/D C Am7 F#dim7 D7 G
      Cm Cm Ebaug Ebaug Am7b5 Am7b5 D7 D7
      G C Cm G Em Am7 D7 G Em Ebaug G/D C Am7 F#dim7 D7 G
      D7 Ebaug D7 Cm G/D F#dim7 D7 D7
      A D Dm A F#m Bm7 E7 A F#m Faug A/E D Bm7 G#dim7 E7 A D Dm A/E E7
      A Dm A Faug Dm A A A`),
    mel:[...mel(`r:24 D5:2:.8 B4:2:.75 G4:2:.7  Eb5:4:.85 D5:2:.7  B4:6:.75  r:6`),
      ...mel(WDL_A),...mel(WDL_B),
      ...mel(`Eb5:6:.85 D5:6:.7 B4:4:.75 G4:2:.65 Eb5:6:.9 C5:6:.7 A4:6:.7 F#4:6:.65 C5:3:.3:a r:3`),
      ...mel(WDL_A),...mel(WDL_B),
      ...mel(`A4:1:.7 A4:1:.55 C5:1:.75 A4:1:.55 F#4:2:.7  B4:1:.7 B4:1:.55 Eb5:1:.8 B4:1:.55 G4:2:.7
        A4:1:.7 A4:1:.55 C5:1:.75 A4:1:.55 D5:2:.8  Eb5:3:.85 D5:3:.75
        D5:1:.7 B4:1:.6 G4:1:.6 B4:1:.65 D5:2:.75  Eb5:2:.8 C5:2:.7 A4:2:.7  F#4:2:.7 A4:2:.75 C5:2:.8  D5:6:.9`),
      ...wdlUp(mel(WDL_A),2),...wdlUp(mel(WDL_B),2),...mel(`r:24`),
      ...mel(`C#5:2:.8 E5:2:.8 A5:2:.85  F5:4:.85 E5:2:.7  C#5:6:.75  F5:2:.75 C#5:2:.7 A4:2:.65  F4:4:.7 E4:2:.6  A4:6:.7
        r:2 A5:3:.4 r:1  r:6`)],
    leadVFor:a=>({nest:.26,steps:.27,back:.22,again:.29,wobble:.24,paddle:a>=64&&a<72?.31:.28,home:.25})[wdlSec(a)],
    // a little careful at the nest; slowing as it looks back; leaning forward at the edge, then a held breath; easing home
    tempo:(b,i,a)=>{const s=wdlSec(a);let v=1;
      if(s==="nest")v=.94;
      else if(s==="back")v=a>=30?.9-.1*Math.min(1,((a-30)*6+i)/11):.9;
      else if(s==="wobble")v=a===55?.7:Math.min(1.04,.98+.012*(a-48)*1.4);
      else if(s==="home")v=1-.15*Math.min(1,((a-76)*6+i)/42);
      if(i>=4&&[7,15,23,39,47,63,71,75].includes(a))v*=.9;
      return v},
    onNote:(e,t,E8,x)=>{GL=null;const a=x.abs,s=wdlSec(a),m=e.m.length===1?e.m[0]:null;if(m==null)return;
      // gliding: in the pond the long notes are held up by a soft cello an octave down
      if(s==="paddle"&&e.l>=3){on(send(.6,.15));voice("bow",hz(m-12),t,e.l*E8,.022*e.vel,.7)}},
    onBar:x=>{const {t,abs:a,E8,C}=x,B=E8*6,s=wdlSec(a);GL=null;
      // the mix breathes: soft at the nest, hollow looking back, full in the pond, thinning home
      const sw={nest:.72+.02*a,steps:.8+.012*(a-8),back:.62,again:.9+.012*(a-32),wobble:.8-.025*(a-48),paddle:a===56?.95:a>=64&&a<72?1.12:1,home:.95-.05*(a-76)}[s];
      BUS.swl.gain.setTargetAtTime(sw,t,B*.35);
      BUS.leadLP.frequency.setTargetAtTime(s==="back"?900:s==="nest"?3200:s==="wobble"?2600:6500,t,B*(s==="back"?.5:.3));
      BUS.lp.frequency.setTargetAtTime(s==="back"?2300:s==="wobble"?3500:4200,t,B*.4);
      BUS.leadPan.pan.setTargetAtTime(s==="back"?-.45:s==="wobble"?.1:0,t,B*.5);   // looking back over its shoulder: the tune drifts left
      const iv=C.iv,lift=n=>C.r+n<52?C.r+n+12:C.r+n,ft1=[iv[1],iv[2]],ft2=[iv[2],iv[3]!=null&&iv[3]<12?iv[3]:12];
      const kal=(ns,st,v,p)=>{ns.forEach((n,k)=>{on(p);voice("kalimba",hz(lift(n)),st+k*.014,E8,v*(1-.12*k),.8)})};
      const at=(pn,rv,ds)=>{const p=ac.createStereoPanner();p.pan.value=pn;p.connect(send(rv,ds));return p};
      const tick=(st,v,pn)=>{on(at(pn,.2,0));wood(st,v)};
      // the waddle: the body on 1, the left foot on 2, the right foot on 3
      if(s==="nest"){const v=a<4?1.25:.95;kal([0],t,.1*v,at(0,.35,.05));kal(ft1,t+E8*2,.05*v,at(0,.35,.05));kal(ft2,t+E8*4,.05*v,at(0,.35,.05))}
      if(s==="steps"||s==="again"){const g=s==="again"?1.1:a<12?.85:1;
        on(send(.25,0,BUS.bass));voice("mbass",hz(C.b-12),t,E8*1.8,.2*g,.5);
        kal(ft1,t+E8*2,.058*g,at(-.45,.3,.06));kal(ft2,t+E8*4,.058*g,at(.45,.3,.06));
        if(a>=12){tick(t+E8*2,.009*g,-.45);tick(t+E8*4,.009*g,.45)}}
      if(s==="back"){kal(ft1,t+E8*2,.042,at(-.3,.6,.1));if(a>=26&&a<31){on(send(1.4,.3));for(const n of iv.slice(0,3))voice("ooh",hz(C.r+12+n),t+.05,B*.98,.026,.8)}}
      if(s==="again"){on(panTo(.4,.15,t,B,.6,.2));voice("bow",hz(WDL_CTR[a-32]),t,B*.98,.05,.5);   // the cello walks beside it
        if(a%2===0){const r=a%4?.5:-.5;on(panTo(r,r*.6,t,B,1,.5));voice("glass",hz(C.r+24+(a%4?C.fifth:0)),t,E8*3,.018,1.2)}}
      // the edge of the water: little nervous toe-taps, then a held breath
      if(s==="wobble"&&a<55){on(send(.25,0,BUS.bass));voice("mbass",hz(C.b-12),t,E8*1.2,.16,.35);
        kal(ft1,t+E8*2,.04,at(-.25,.3,.06));kal(ft2,t+E8*4,.04,at(.25,.3,.06));
        for(let k=0;k<6;k++)tick(t+E8*k+(k%2?E8*.5:0),k%2?.004:.006,k%2?.3:-.3)}
      // splash: a falling breath and a soft low thump, and up a whole step
      if(a===56){on(panTo(-.3,.5,t,B*1.5,1.2,.5));voice("air",hz(81),t,E8*3,.045,1);on(BUS.perc);thump(t,.13,58,.09)}
      if(s==="paddle"){const pk=a>=64&&a<72,end=a>=72;
        if((a-56)%2===0){const d=Math.floor((a-56)/2)%2?-1:1;WDL_RP=panTo(-.75*d,.75*d,t,B*2,.45,.2)}
        const pat=[0,C.fifth,12,12+C.third,12,C.fifth],acc=[1,.7,.8,.85,.75,.7],rv=end?.06:pk?.06:.052;
        pat.forEach((n,k)=>{on(WDL_RP);voice("kalimba",hz(C.r+n),t+k*E8,E8,rv*acc[k],1.2)});   // paddling, from ear to ear
        on(send(.25,0,BUS.bass));voice("mbass",hz(C.b-12),t,B*.98,end?.14:.19,.7);
        if(!end){on(send(.7,.15,BUS.bass));voice("bow",hz(C.r+C.third),t,B*1.02,pk?.03:.022,.8);voice("bow",hz(C.r+C.fifth),t+.04,B*1.02,pk?.024:.018,.8)}
        if(!end&&a>=60){on(send(.8,.2));for(const n of iv.slice(0,3))voice("ooh",hz(C.r+12+n),t+.05,B*.98,pk?.04:.028,.8)}
        if(!end&&a%2===0){const r=a%4?.55:-.55;on(panTo(r,-r*.3,t,B,1,.5));voice("glass",hz(C.r+24+(a%4?C.fifth:0)),t,E8*3,pk?.022:.018,1.2)}}
      // floating home: thinning to the kalimba and the pad, all in the middle
      if(s==="home"&&a<82){const v=1-.1*(a-76);kal([0],t,.08*v,at(0,.4,.05));kal(ft1,t+E8*2,.038*v,at(0,.4,.05));kal(ft2,t+E8*4,.036*v,at(0,.4,.05))}
      // the warm pad, low under everything but the first steps
      const pd={nest:a>=4?.008:0,steps:a>=16?.012:0,back:.015,again:.016,wobble:.012,paddle:a>=72?.016:.02,home:.018-.002*(a-76)}[s];
      if(pd>0){on(send(.6,.1,BUS.bass));voice("warm",iv.slice(0,3).map(n=>hz(C.r+n+12)),t,B*1.02,pd,.8)}}};
  // TRACK_CONST: CHICKS
  /* Bouncy Chicks: morning on the bank. The eggs wobble (tock... tock), one cracks, and out tumble the chicks, all fluff
     and no balance, bouncing like marimba mallets. Mother Duck paddles in twos, slow and sure, in the left ear; the
     chicks paddle in threes in the right ear, never quite in step with her. A splash party gets a little too fast;
     then one chick drifts into the reeds: it all goes hollow and muffled, its tiny threes paddle alone, and the tune
     turns minor without changing a note. Mother's twos come back from far left, closer and closer; when they find each
     other the key lifts to A, and for four bars everyone paddles in twos, in step for the first time. Then out of step
     again, happily, and they pile up in a fluffy heap and fall asleep one by one. G major pentatonic (E minor
     pentatonic in the reeds, A major pentatonic when found), bars of 6 eighths at 120 bpm, 3 against 2, straight time. */
  const CHK_SEC=[[0,"eggs"],[8,"hatch"],[24,"paddle"],[40,"splash"],[56,"lost"],[64,"call"],[68,"step"],[72,"found"],[84,"nap"]];
  const chkSec=a=>{let s="eggs";for(const [k,n] of CHK_SEC)if(a>=k)s=n;return s};
  const CHK_A="D5:2 E5:2 G5:2 E5:2 D5:2 B4:2 A4:2 B4:2 D5:2 B4:2 G4:4 D5:2 E5:2 G5:2 A5:2 G5:2 E5:2 D5:2 B4:2 A4:2 G4:4 r:2";
  const CHK_B="G5:3 E5:3 D5:3 B4:2 D5:1 E5:3 G5:3 A5:6 B5:3 A5:3 G5:3 E5:2 G5:1 D5:3 E5:3";
  let CHK_P={};   // this bar's travelling panners
  const CHICKS={name:"Bouncy Chicks",bpm:120,trim:1.02,bar:6,lead:"marimba",leadV:.3,rel:1,leg:1,lp:4300,echo:.1,fb:.2,dly:.75,
    dyn:.7,contrast:.85,hum:.005,rv:.28,ds:.1,rev:[3.8,.5],wow:[.0006,.25],
    chords:chords(`G G Em7 Em7 C C D D
      G Em7 D G G C D G  G Em7 D G G C D G
      C G Em7 D Em7 C D D  C G Em7 D Em7 C D G
      G Em7 D G G C D G  G Em7 D G G C D G
      Em C Am7 Em Em C D Em  G Em7 C D
      A F#m7 D E  A F#m7 E A A D E A  D A E A
      D A E A F#m7 D A F#m7 Aadd9 Aadd9 Aadd9 Aadd9`),
    mel:mel(`r:6 r:6 r:6 r:6 r:6 r:6 r:6 r:5 B5:1:.85
        ${CHK_A} ${CHK_A}
        ${CHK_B} D5:6 ${CHK_B} G5:6
        ${CHK_A} ${CHK_A}
        E5:2:.85 G5:2:.85 B5:2:.85 A5:2:.8 G5:2:.8 E5:2:.75 r:6 D5:2:.8 E5:4:.8 B4:2:.75 D5:2:.75 E5:2:.75 G5:6:.8 r:6 E5:6:.7
        B4:3:.8 D5:3:.8 E5:6:.85 D5:3:.9 B4:3:.9 A4:6:.95
        A4:3 C#5:3 E5:3 F#5:3 A5:6:1.1 E5:6
        E5:2 F#5:2 A5:2 F#5:2 E5:2 C#5:2 B4:2 C#5:2 E5:2 C#5:2 A4:4 E5:2 F#5:2 A5:2 B5:2 A5:2 F#5:2 E5:2 C#5:2 B4:2 A4:4 r:2
        A5:3 F#5:3 E5:3 C#5:3 B4:3 C#5:3 A4:6
        E5:2:.85 F#5:2:.85 A5:2:.85 F#5:6:.8 E5:2:.75 C#5:2:.75 B4:2:.75 A4:6:.7 C#5:3:.65 B4:3:.65 A4:6:.6 E5:6:.55 C#5:6:.5 A4:6:.45
        r:6 r:6 r:6`),
    // the pause before the crack; pressing on in the splash; slow in the reeds and speeding up as she calls; sleepy at the end
    tempo:(b,i,a)=>{let v=1;if(a===7&&i>=3)v=.8;if(a>=52&&a<=55)v=1.04;if(a===55&&i>=3)v=.85;if(a>=56&&a<=63)v=.88;if(a>=64&&a<=67)v=.9+.1*(a-64)/3;
      if(a>=84)v=.97-.17*(a-84)/11;return v},
    onNote:(e,t,E8,x)=>{const a=x.abs,s=chkSec(a),m=e.m.length===1?e.m[0]:null;GL=null;if(m==null)return;
      // the music box doubles the tune an octave up in the splash party
      if(s==="splash"){on(send(.4,.25));voice("softbox",hz(m+12),t,e.l*E8,.05*e.vel,.6)}
      // a long note alone in the reeds, or sleepy at the end, is rolled softly, as a marimba player would
      if((s==="lost"||s==="call"||s==="nap")&&e.l>=4){on(send(.4,.1,BUS.lead));const n=Math.floor(e.l*2)-2,v=(T.leadV||.3)*e.vel;
        for(let k=1;k<=n;k++){const q=k/n;voice("marimba",hz(m),t+k*E8*.5,E8*.5,v*(.32+.18*Math.sin(Math.PI*q))*(1-.4*q),.7)}}},
    // the paddlers, one eighth at a time so they follow every change of speed
    step:x=>{const {t,abs:a,i,E8,C}=x,s=chkSec(a);GL=null;
      if(i===0){const B=E8*6;CHK_P={hop:panTo(-.65,.65,t,B,.4,.25),
        mom:panTo(s==="call"?-.9+.3*(a-64):s==="step"?0:-.5,s==="call"?-.6+.3*(a-64):s==="step"?0:-.5,t,B,.25,.05),
        kid:panTo(s==="step"?0:.5,s==="step"?0:.5,t,B,.3,.1),brush:panTo(-.4,-.4,t,B,.3,0),wood:panTo(.4,.4,t,B,.3,0)}}
      const P=CHK_P;
      // Mother's twos: low marimba, root then fifth (gone in the reeds; back from far left as she calls)
      const mv={eggs:.17,hatch:.13,paddle:.12,splash:.13,lost:0,call:.08+.012*(a-64),step:.13,found:.13,nap:a<=90?.12-.006*(a-84):0}[s];
      if(mv&&(i===0||i===3)){on(P.mom);voice("marimba",hz(C.b+(i?C.fifth:0)),t,E8*3,mv*(i?.8:1)*(s==="eggs"&&i?.9:1),1.15)}
      // the eggs wobble: a tiny wooden tock now and then
      if(s==="eggs"&&a>=2&&(i===2||i===5)&&h01(a*6+i)<.45){on(P.wood);wood(t,.006)}
      // the chicks' threes: third, fifth, octave from the right (the tune itself is the threes while they hatch)
      const kv={splash:.05,found:.055,nap:a<88?.05-.004*(a-84):0}[s]||0;
      if(kv&&i%2===0){on(P.kid);voice("marimba",hz(C.r+12+[C.third,C.fifth,12][i/2]),t,E8*2,kv*(i?.8:1),.8)}
      // in step: everyone in twos, together, in the middle
      if(s==="step"&&(i===0||i===3)){on(P.kid);voice("marimba",hz(C.r+12+(i?C.fifth:C.third)),t,E8*3,.06,1);on(send(.4,.2));voice("softbox",hz(C.r+24+(i?C.fifth:12)),t,E8*3,.04,.8)}
      // the music box takes the threes an octave up, hopping from left to right across each bar
      const bv={paddle:.05,found:.045,nap:a<88?.04-.006*(a-84):0}[s]||0;
      if(bv&&i%2===0){on(P.hop);voice("softbox",hz(C.r+24+[C.third,C.fifth,12][i/2]),t,E8*2,bv*(i?.8:1),.7)}
      // tiny percussion: a brush on the twos (left), a wood tick on the threes (right)
      const pv=s==="splash"||s==="found"?1:s==="paddle"&&a>=32?.6:0;
      if(pv){if(i===0||i===3){on(P.brush);brush(t,.014*pv*(i?.8:1))}if(i%2===0){on(P.wood);wood(t,.007*pv*(i?.8:1))}}},
    onBar:x=>{const {t,abs:a,E8,C}=x,B=E8*6,s=chkSec(a);GL=null;
      // how big each part is, how open; hollow and muffled in the reeds, opening as she calls
      const swell={eggs:.55+.025*a,hatch:a<16?.8:.88,paddle:a%2?.9:.96,splash:a>=52?1.14:a%2?1.04:1.1,lost:.55,call:.6+.08*(a-64),step:.98,found:a%2?1.04:1.1,nap:Math.max(.42,.92-.045*(a-84))}[s];
      BUS.swl.gain.setTargetAtTime(swell,t,B*.4);
      const lpo={eggs:1500,hatch:a<10?2600:3800,paddle:4000,splash:4500,lost:900,call:1100+350*(a-64),step:4300,found:4500,nap:Math.max(2000,4000-180*(a-84))}[s];
      BUS.lp.frequency.setTargetAtTime(lpo,t,s==="step"&&a===68?B*.25:B*.4);
      BUS.leadLP.frequency.setTargetAtTime(s==="lost"?2200:s==="nap"?3500:7000,t,B*.4);
      // where the tune sits: with the chicks while they hatch, with Mother as she paddles, far right when lost, coming in from the left as she calls
      const pan={eggs:.4,hatch:.3,paddle:-.25,splash:0,lost:.45,call:-.5+.15*(a-64),step:0,found:.1,nap:0}[s];
      BUS.leadPan.pan.setTargetAtTime(pan,t,B*.35);
      // the muffled bass under it all (faint in the reeds)
      const bb={hatch:.15,paddle:.16,splash:.18,lost:a%2===0?.1:0,call:.12,step:.18,found:.18,nap:a<=91?.15:0}[s]||0;
      if(bb){on(send(.2,0,BUS.bass));voice("mbass",hz(C.b-12),t,B*(s==="lost"?1.8:.9),bb,.6)}
      // the choir: from bar 33, two-bar swells; leaves first at the nap
      if((s==="paddle"&&a>=32||s==="splash"||s==="step"||s==="found")&&a%2===0){on(send(1,.25));const cv=s==="splash"||s==="found"?.026:.022;
        for(const v of C.iv.slice(0,3))voice("ooh",hz(C.r+12+v),t+.04,B*1.9,cv,.9)}
      // bowed strings swell in the splash party, when they are found, and once more as they curl up
      if((s==="splash"||s==="step"||s==="found"||s==="nap"&&a<86)&&a%2===0){on(send(.7,.2,BUS.bass));const sv=s==="nap"?.022:.03;
        voice("bow",hz(C.b),t,B*1.9,sv,.9);voice("bow",hz(C.r+12+C.third),t+.05,B*1.9,sv*.7,.9)}
      // a glass chime on the downbeat every two bars of the splash party; ripples of chimes when they are found
      if(s==="splash"&&a%2===0){on(panTo(a%4?.5:-.5,a%4?.3:-.3,t,B,.9,.4));voice("glass",hz(C.r+12+(a%4?C.fifth:12)),t,E8*3,.022,1.2)}
      if(s==="found"&&a%2===0){const dir=a%4?-1:1,p=panTo(-.6*dir,.6*dir,t,B*.6,.9,.4);[0,C.third,C.fifth,12].forEach((v,k)=>{on(p);voice("glass",hz(C.r+12+v),t+k*E8*.5,E8*1.5,.018*(1-.1*k),1.1)})}
      // the crack: a tiny wooden split just before the high B
      if(a===7){on(CHK_P.wood||send(.3,0));wood(t+E8*4.6,.012)}
      // fast asleep: one low note from Mother, far off
      if(a===93){on(panTo(-.3,-.3,t,B*2,.6,.1));voice("marimba",hz(C.b),t+E8,E8*4,.08,1.6)}}};
  /* TRACK_CONST: RUFFLES */
  /* Pond-erful Ruffles: a proud duck preens at a koi pond. The ocarina is the duck humming in E Hirajoshi (E F# G B C)
     over a steady 3-3-2 shake (eighths 0, 3 and 6 of each 4/4 bar: harp chords left, right and center, the bass, a wood
     tick, a low thump on 1 and a brush on the "2"), 92 bpm, straight time. A soft bell (the koi) circles from ear to ear.
     Still Garden (hollow, single notes), Koi Circle (the theme and its answer), Ruffle! (the theme with triplet feather
     flurries), Under the Lily Pads (A Hirajoshi, muffled and long, the shake slowed to a heartbeat, a far choir and a
     wisp in the right ear, two bars of almost nothing), Surface and Shake (F# Hirajoshi, the big shake: chimes, the
     flurries flick out to the left ear and the right) and Koi and Duck (the ocarina and a low cello side by side, and
     one last tiny shake). */
  IV["sus2"]=[0,2,7];
  const RUF_SEC=[[0,"still"],[6,"koi"],[18,"ruffle"],[26,"lily"],[38,"surface"],[52,"duet"]];
  const rufSec=a=>{let s="still";for(const [k,n] of RUF_SEC)if(a>=k)s=n;return s};
  // the cello's half of the duet at the end: [midi, eighths] per bar
  const RUF_DUET=[[[54,8]],[[57,3],[61,3],[62,2]],[[57,8]],[[54,3],[57,3],[61,2]],[[61,4],[62,2],[61,2]],[[56,4],[54,4]],[[57,4],[56,4]],[[54,8]]];
  // the wisp's far counter-line under the lily pads, one long note a bar from bar 28
  const RUF_WISP={27:72,28:69,29:69,30:64,31:71,32:72,33:69,34:64,35:65,36:64};
  // each section's five notes, and a step down through them
  const RUF_SC={still:[4,6,7,11,0],koi:[4,6,7,11,0],ruffle:[4,6,7,11,0],lily:[9,11,0,4,5],surface:[6,8,9,1,2],duet:[6,8,9,1,2]};
  const rufDown=(n,sc)=>{do n--;while(!sc.includes(((n%12)+12)%12));return n};
  let RUF_FL=0;
  const RUFFLES={name:"Pond-erful Ruffles",bpm:92,trim:.85,bar:8,lead:"panflute",leadV:.27,rel:.16,leg:.95,lp:1600,echo:.1,fb:.2,dly:.65,
    dyn:.75,contrast:.85,hum:.006,rv:.35,ds:.12,rev:[5,.5],wow:[.0006,.22],
    chords:chords("Em Em Em Em Cmaj7 Bsus4 "+
      "Em Cmaj7 Em/B Bsus4 Em Cmaj7#11 Cmaj7 Em Cmaj7 Em/B Bsus4 Em "+
      "Em Cmaj7 Em/B Bsus4 Em Cmaj7#11 Cmaj7 Em "+
      "Am Fmaj7 Am/E Esus4 Asus2 Fmaj7#11 Fmaj7 Esus4 Am Fmaj7 Esus4 Esus4 "+
      "F#m Dmaj7 F#m/C# C#sus4 F#m Dmaj7#11 Dmaj7 F#m Dmaj7 F#m/C# C#sus4 F#m Dmaj7 C#sus4 "+
      "F#m Dmaj7 F#m Dmaj7 F#m/C# C#sus4 F#m F#m"),
    mel:mel(`r:8
        B4:8:.7
        r:8
        E5:6:.8 r:2
        G5:4:.85 F#5:4:.85
        E5:6:.8 r:2
        B4:3 E5:3 F#5:2
        G5:3 F#5:3 E5:2
        B4:3 C5:3 B4:2
        E5:6 r:2
        G5:3 B5:3 C6:2
        B5:3 G5:3 F#5:2
        E5:3 G5:3 F#5:2
        E5:8
        C6:3 B5:3 G5:2
        F#5:3 E5:3 B4:2
        F#5:6 E5:2
        E5:8
        B4:3 E5:3 F#5:2
        G5:3 F#5:3 G5:.333 F#5:.333 E5:.334 E5:1
        B4:3 C5:3 B4:2
        E5:6 G5:.333 F#5:.333 E5:.334 r:1
        G5:3 B5:3 C6:2
        B5:3 G5:3 B5:.333 G5:.333 F#5:.334 F#5:1
        E5:3 G5:3 F#5:2
        G5:.333 F#5:.333 E5:.334 E5:7
        E5:8:.75
        F5:4:.75 E5:4:.7
        C5:6:.7 B4:2:.65
        B4:8:.65
        A4:4:.7 B4:2:.7 C5:2:.7
        E5:8:.75
        F5:6:.75 E5:2:.7
        B4:8:.65
        A4:16:.6
        r:16
        C#5:3 F#5:3 G#5:2
        A5:3 G#5:3 F#5:2
        C#5:3 D5:3 C#5:2
        F#5:6 A5:.333 G#5:.333 F#5:.334 r:1
        A5:3 C#6:3 D6:2
        C#6:3 A5:3 C#6:.333 A5:.333 G#5:.334 G#5:1
        F#5:3 A5:3 G#5:2
        F#5:8
        D6:3 C#6:3 A5:2
        G#5:3 F#5:3 C#5:2
        G#5:6 F#5:2
        F#5:6 A5:.333 G#5:.333 F#5:.334 r:1
        A5:3 G#5:3 A5:.333 G#5:.333 F#5:.334 F#5:1
        C#6:.333 A5:.333 G#5:.334 F#5:7
        F#5:3:.8 A5:3:.8 G#5:2:.75
        F#5:8:.75
        C#5:3:.75 D5:3:.75 C#5:2:.7
        A4:8:.7
        C#5:8:.7
        G#4:6:.65 r:2
        F#4:8:.6
        r:8`),
    // steady, with breaths at phrase ends: slower under the lily pads, pressing in the big shake, easing at the end
    tempo:(b,i,a)=>{const s=rufSec(a);let v={still:.97,koi:1,ruffle:1,lily:.94,surface:1.03,duet:a>=58?.9:1}[s];
      if(i>=6&&[5,25,29,33,37].includes(a))v=.88;else if(i>=6&&[9,13,17].includes(a))v=.92;
      if(a===51&&i>=6)v*=.93;return v},
    onNote:(e,t,E8,x)=>{const a=x.abs,s=rufSec(a),m=e.m.length===1?e.m[0]:null;GL=null;if(m==null)return;
      // a feather flurry (a triplet in one eighth) starts: in the big shake it flicks out to one ear, then the other,
      // with harp sparks spraying after it; in the first ruffle a softer spark answers it from the side
      const first=e.l<.5&&Math.abs(e.s-Math.round(e.s))<.01;
      if(first&&(s==="surface"||s==="ruffle")){RUF_FL++;const side=RUF_FL%2?-1:1;
        if(s==="surface"){BUS.leadPan.pan.setTargetAtTime(.55*side,t,.03);BUS.leadPan.pan.setTargetAtTime(0,t+E8*1.3,.15)}
        const p=panTo(.1*side,(s==="surface"?.85:.45)*side,t,E8*1.5,.7,.35);
        [m+12,rufDown(m,RUF_SC[s])+12,rufDown(rufDown(m,RUF_SC[s]),RUF_SC[s])+12].forEach((n,k)=>{on(p);voice("c2_harp",hz(n),t+E8*(k+1)/3+E8*.08,E8,(s==="surface"?.034:.024)*(1-.15*k),.7)})}},
    onBar:x=>{const {t,abs:a,E8,C}=x,B=E8*8,s=rufSec(a);GL=null;if(a===0)RUF_FL=0;
      // hollow to full: the swell, a low-pass over everything (green and muffled under the lily pads), and on the tune
      const swell={still:.6+.04*a,koi:.82+.012*(a-6),ruffle:.97+.03*(a%2),lily:a>=36?.42:.55,surface:a%2?1.12:1.08,duet:.8-.035*(a-52)}[s];
      const lp={still:1600+150*a,koi:3600,ruffle:4200,lily:a>=36?900:1100,surface:4200,duet:3200-120*(a-52)}[s];
      const llp={still:3500,koi:5000,ruffle:6000,lily:2600,surface:6500,duet:4200}[s];
      BUS.swl.gain.setTargetAtTime(swell,t,B*(a===38?.06:.3));BUS.lp.frequency.setTargetAtTime(lp,t,B*(a===38?.05:a===26?.15:.3));
      BUS.leadLP.frequency.setTargetAtTime(llp,t,B*.3);
      if(s==="koi"&&(a===12||a===16)){BUS.leadLP.frequency.setTargetAtTime(1500,t+B*.25,B*.12);BUS.leadLP.frequency.setTargetAtTime(llp,t+B*.7,B*.15)}   // a light muffle comes in and leaves
      if(s!=="surface"||a===38)BUS.leadPan.pan.setTargetAtTime(s==="lily"||s==="duet"?-.15:0,t,B*(a===38?.05:.3));
      RUFFLES.rv=s==="lily"?.7:.35;
      const G=[0,3,6],tri=C.iv.length>3?C.iv.slice(1,4):C.iv.slice(0,3);
      // the 3-3-2 shake: harp chords left, right and center
      const hv={still:.028,koi:.036,ruffle:.04,surface:.042,duet:a<=57?.026:0}[s]||0;
      if(hv)G.forEach((k,j)=>{if(s==="still"&&!(k===0||k===6&&a%2))return;const pv=[-.4,.4,0][j],p=panTo(pv,pv,t,B,.45,.15),vv=[1,.7,.85][j];
        tri.forEach((v,n)=>{on(p);voice("c2_harp",hz(C.r+12+v),t+k*E8+n*.014,E8*2,hv*vv*(1-.1*n),.55)})});
      // the bass on the same three: root, root, fifth (half as loud, and slow, under the lily pads)
      const bv={koi:.19,ruffle:.21,lily:a<=35?.1:0,surface:.22,duet:a<=55?.11:0}[s]||0;
      if(bv){on(send(.25,0,BUS.bass));G.forEach((k,j)=>{if(s==="lily"&&j===2)return;voice("mbass",hz(j===2?C.r-12+C.fifth:C.b-12),t+k*E8,E8*(j===2?1.8:2.7),bv*[1,.75,.85][j],.4)})}
      // the kit: a wood tick on all three, a low thump on 1 and a brush on the "2"; a slow heartbeat under the lily pads
      on(BUS.perc);
      if(s==="koi"||s==="ruffle"||s==="surface"){const pv=s==="koi"?.8:1;G.forEach((k,j)=>wood(t+k*E8,.011*pv*[1,.75,.85][j]));thump(t,.15*pv,hz(C.b-12),.14,.01);if(s!=="koi"||a>=10)brush(t+6*E8,.02*pv)}
      if(s==="lily"&&a<=36){thump(t,.12,hz(C.b-12),.18,.012);if(a<=35)thump(t+3*E8,.07,hz(C.b-12),.16,.012)}
      if(s==="duet"&&a<=56)thump(t,.08,hz(C.b-12),.16,.012);
      // the last tiny shake: three soft ticks a sixteenth-triplet apart, and a little harp ruffle
      if(a===59){[0,1,2].forEach(k=>wood(t+E8*(4+k/3),.009*(1-.12*k)));const p=panTo(-.3,.3,t+E8*4,E8,.6,.3);[78,73,69].forEach((n,k)=>{on(p);voice("c2_harp",hz(n),t+E8*(4.05+k/3),E8,.02,.7)})}
      // the koi: a soft bell circling the chord in eighths, left to right, then right to left (narrow under the lily pads)
      const kv={koi:.026,ruffle:.028,lily:a<=35?.02:0,surface:.032,duet:a<=53?.022-.006*(a-52):0}[s]||0;
      if(kv){const w=s==="lily"?.2:.7,dir=a%2?-1:1,p=panTo(-w*dir,w*dir,t,B,.6,.25),L=[...C.iv.slice(0,4).filter(v=>v<12),12].map(v=>C.r+12+v),pat=[0,1,2,3,2,1,0,1];
        pat.forEach((q,k)=>{if(s==="lily"&&k%2)return;on(p);voice("fmsoft",hz(L[Math.min(q,L.length-1)]),t+k*E8,E8,kv*(k===0||k===3||k===6?1:.75),.8)})}
      // a warm pad under everything
      const pd={still:.012,koi:.015,ruffle:.02,lily:.018,surface:.026,duet:.017-.0015*(a-52)}[s];
      on(send(.6,.1,BUS.bass));voice("warm",C.iv.slice(0,3).map(v=>hz(C.r+v+12)),t,B*1.02,pd,.8);
      // under the lily pads: a choir far away, and a wisp's long counter-line in the far right ear
      if(s==="lily"&&a>=28&&a<=35){on(send(1.4,.3));for(const v of C.iv.slice(0,3))voice("ooh",hz(C.r+12+v),t+.05,B*.98,.02,.9)}
      if(RUF_WISP[a]){on(panTo(.8,.8,t,B,1.1,.3));voice("wisp",hz(RUF_WISP[a]),t+E8*.5,B*.85,a===36?.016:.026,1)}
      // the big shake: chimes on eighths 0 and 6, from either ear, and a cello on roots and fifths, one note a bar
      if(s==="surface"){on(panTo(-.45,-.2,t,E8*2,1,.5));voice("glass",hz(C.r+24),t,E8*3,.018,1.2);on(panTo(.45,.2,t+E8*6,E8*2,1,.5));voice("glass",hz(C.r+24+C.fifth),t+E8*6,E8*3,.014,1.2);
        on(panTo(.3,.3,t,B,.6,.15));voice("bow",hz(C.r+(a%2?C.fifth:0)),t+.03,B*.98,.042,.7)}
      // the koi's voice at the end: the cello's half of the duet, a little right of the pan flute
      if(s==="duet"){const L=RUF_DUET[a-52];let k0=0;on(panTo(.28,.28,t,B,.6,.15));for(const [n,l] of L){voice("bow",hz(n),t+k0*E8+.02,l*E8*.97,a===59?.045:.055,a===59?1.4:.6);k0+=l}}
      // diving under: a falling breath
      if(a===25){on(send(1,.4));voice("air",hz(C.r+24+C.fifth),t+E8*5,E8*3,.03,1)}}};
  // TRACK_CONST: WTD
  /* What the duck?: the rare one. Between two happy songs the lights of the pond go out. Under the board there is an old
     ballroom where rubber ducks used to dance. In the dark a tired wind-up duck music box plays an old lullaby by itself,
     a little flat, in the left ear. A lone violin answers from the right, beautiful and ruined: it climbs, sighs down by
     half steps, leans on the raised seventh and never gets home. Then something is behind you: a breath from the right,
     two soft knocks on the left, a ghost humming low, a breath drawn in. The ballroom remembers itself, far choir and
     low strings and the violin an octave up, one wrong, beautiful chord a half step above home (Ab), the dominant, and
     home: a minor chord with a major seventh in it, uneasy even there. The box comes back alone, winding down, and its
     last note sags flat. Silence; one tiny high note: it's still there. G harmonic minor, 4/4, straight time with rubato.
     No weather, no distortion, never loud. */
  IV["mM7"]=[0,3,7,11];
  const WTD_SEC=[[0,"out"],[4,"toy"],[12,"violin"],[20,"behind"],[24,"ball"],[30,"wind"],[34,"silence"]];
  const wtdSec=a=>{let s="out";for(const [k,n] of WTD_SEC)if(a>=k)s=n;return s};
  const WTD_L1=`D5:1 Bb4:1 D5:1 F#5:1 G5:2 F#5:1:.85 Eb5:1:.9`,WTD_L3=`Bb4:1 G4:1 Bb4:1 D5:1 Eb5:2 D5:1:.85 C5:1:.85`;
  const WTD={name:"What the duck?",bpm:56,trim:1.5,bar:8,lead:"wtd_box",leadV:.2,rel:1,leg:1,lp:3200,echo:.1,fb:.2,dly:.8,
    dyn:.7,contrast:.85,hum:.012,rv:.5,ds:.14,rev:[6.5,.55],wow:[.0011,.18],
    chords:chords(`GmM7 GmM7 GmM7 GmM7
      GmM7 Am7b5 Ebmaj7 D7 GmM7 Am7b5 Ebmaj7 D7
      Gm Cm Ebmaj7 D7 GmM7 Bbaug Cm D7
      GmM7 GmM7 GmM7 GmM7
      Gm Cm Ab D7 GmM7 GmM7
      GmM7 Am7b5 Ebmaj7 D7 GmM7 GmM7`),
    mel:mel(`r:32
      ${WTD_L1}  D5:2 C5:1 Bb4:1 A4:2 r:2  ${WTD_L3}  A4:2 F#4:4:.8 r:2
      ${WTD_L1}  D5:2 C5:1 Bb4:1 r:4      ${WTD_L3}  A4:2 F#4:2 G4:4:.8
      G4:2:.75 Bb4:2:.8 D5:4:.9  Eb5:6 D5:2:.8  G5:4 F#5:2:.85 G5:2  A5:3 G5:1:.85 F#5:2:.85 Eb5:2:.8
      D5:8:.8  Bb5:4 A5:2:.85 F#5:2:.85  G5:3 Eb5:1:.8 C5:4:.85  Bb4:2:.8 A4:2:.75 F#4:4:.7
      D4:4:.8 Bb3:4:.7  r:8  F#4:4:.8 Eb4:4:.75  r:8
      G5:2:.8 Bb5:2:.85 D6:4:.9  Eb6:6 D6:2:.85  Ab5:4:1.05 G5:2:.9 Eb5:2:.85  F#5:4:1 Eb5:2:.85 D5:2:.8  G5:8:.8  F#5:8:.7
      ${WTD_L1}  D5:2 C5:1 Bb4:1 A4:2 r:2  ${WTD_L3}  r:8
      r:8  r:7 D5:1:1`),
    leadFor:a=>{const s=wtdSec(a);return s==="toy"||s==="wind"?"wtd_box":s==="behind"?"wisp":s==="silence"?"glass":"wtd_violin"},
    leadVFor:a=>{const s=wtdSec(a);return s==="toy"?.2:s==="wind"?.19-.012*(a-30):s==="behind"?.09:s==="silence"?.02:s==="ball"?(a===26||a===27?.21:.18):.16},
    // rubato: each violin phrase presses forward in the middle and slows at its end; the box winds down at the end
    tempo:(b,i,a)=>{const s=wtdSec(a);let v=1;
      if(s==="toy")v=a>=8?.96-.015*(a-8):1;
      else if(s==="violin"){const k=((a-12)%4)*8+i;v=k>=30?.85:1+.05*Math.sin(Math.PI*k/30)}
      else if(s==="behind")v=.92;
      else if(s==="ball"){const k=(a-24)*8+i;v=a===29?.86:1+.045*Math.sin(Math.PI*k/40)}
      else if(s==="wind")v=a===33?.6:.9-.3*((a-30)*8+i)/24;
      else if(s==="silence")v=.9;
      return v},
    onNote:(e,t,E8,x)=>{GL=null},
    onBar:x=>{const {t,abs:a,E8,C}=x,B=E8*8,s=wtdSec(a);GL=null;
      // how far away it all is: dark and close at first, open in the ballroom
      const sw={out:.62,toy:.74,violin:.8+.02*(a-12),behind:.58,ball:a===26||a===27?1.05:.95,wind:.7-.03*(a-30),silence:.5}[s];
      BUS.swl.gain.setTargetAtTime(sw,t,B*.3);
      BUS.lp.frequency.setTargetAtTime({out:800,toy:2400,violin:3000,behind:1400,ball:3300,wind:2000,silence:1600}[s],t,B*.35);
      BUS.leadPan.pan.setTargetAtTime(s==="toy"||s==="wind"?-.5:s==="violin"||s==="ball"?.25:s==="behind"?-.1:0,t,s==="toy"&&a===4?.05:B*.2);
      BUS.leadLP.frequency.setTargetAtTime(s==="ball"?5200:s==="violin"?4200:3200,t,B*.3);
      const at=(pn,rv,ds)=>{const p=ac.createStereoPanner();p.pan.value=pn;p.connect(send(rv,ds));return p};
      // the drone under almost everything: two low Gs a few cents apart, a ghost a half step up coming and going
      const dr={0:[4,.13],4:[8,.065],12:[8,.05],20:[4,.11],24:[6,.04],30:[4,.075]}[a];
      if(dr){on(send(.5,0,BUS.bass));voice("wtd_drone",hz(43),t,B*dr[0],dr[1],a===30?4:2.6)}
      // the low warm pad in the dark, under the violin and in the ballroom
      const pd={out:.011,violin:.013,ball:.02}[s];
      if(pd){on(send(.6,.1,BUS.bass));voice("warm",C.iv.slice(0,3).map(n=>hz(C.r+n)),t,B*1.02,pd,1.2)}
      // a glass note far right in the dark, the same note that ends the song
      if(a===2){on(at(.85,1.4,.4));voice("glass",hz(74),t+E8*3,E8*3,.02,1.4)}
      // a wet finger on a glass rim, creeping across the dark
      if(a===1||a===22){const p0=a===1?-.6:.7;on(panTo(p0,-p0*.5,t,B*2,1.2,.3));voice("wtd_whine",hz(a===1?87:86),t+E8*2,B*1.3,a===1?.011:.008,1.6)}
      // low strings and a muffled bass under the violin and the ballroom
      if(s==="violin"||s==="ball"){const pk=a===26||a===27,v=s==="ball"?(pk?1.3:1):a<16?.7:.9;
        on(send(.25,0,BUS.bass));voice("mbass",hz(C.b-12),t,B*.96,.13*v,.8);
        on(send(.7,.1,BUS.bass));voice("bow",hz(C.b-12),t,B*1.02,.04*v,.8);voice("bow",hz(C.r+C.fifth-12),t+.05,B*1.02,.026*v,.8)}
      // something behind you: a breath falls from the right ear toward the middle; two soft knocks on the left; a breath drawn in
      if(a===20){on(panTo(.8,0,t+E8,B*.9,1,.3));voice("air",hz(74),t+E8,E8*5,.04,1.4)}
      if(a===21){for(const k of [2,4]){on(at(-.7,.9,.1));voice("wtd_knock",112,t+k*E8,.1,.32)}}
      if(a===23){on(at(.15,.8,.1));voice("wtd_breath",900,t+E8*4.2,E8*3.8,.07,.2)}
      // the ballroom: a far choir and a soft tremolo swell
      if(s==="ball"){const pk=a===26||a===27;on(send(1.5,.3));for(const n of C.iv.slice(0,3))voice("ooh",hz(C.r+12+n),t+.05,B*.98,pk?.034:.024,1);
        on(panTo(a%2?.4:-.4,a%2?-.4:.4,t,B,.9,.3));voice("swell",hz(C.r+C.third),t,B*.95,pk?.03:.02,1)}
      // the box: the A in the second lullaby sags flat for a moment and comes back; winding down, its last notes sag and stay
      const box=(m,k,l,v,o)=>{on(send(.5*1.8,.14*2.4,BUS.lead));voice("wtd_box",hz(m),t+k*E8,l*E8,v,1,o)};
      if(a===9)box(69,4,2,.17,{bend:-100,at:.28,tc:.12,back:.85});
      if(a===33){box(69,0,2,.13,{bend:-100,at:.4,tc:.2,back:1.2,wob:.007});box(66,2,2,.12,{wob:.007});box(67,4,4,.12,{bend:-100,at:.6,tc:.7,wob:.007,det:12})}}};
  // TRACK_CONST: FEATHER
  /* Feather Bound (song 7, a working title; after "Pair Bound" from BioShock 2): a big duck and a duckling crossing the
     night. One small lullaby tune, the pair bond, reaches up, sinks back by step and stops one note short of home. It is
     handed from wing to wing: ocarina, marimba, glass harmonica, celesta, kalimba, and in the last bar of each part the
     next one answers softly from the other ear. The keys climb in minor thirds and each mode lands on its new note:
     Lullaby (A Aeolian, a waltz), Following (C Mixolydian, 3-3-2), the Swell (Eb Lydian, kalimba ripples crossing the
     ears under a slow glass tune: the warm peak), Dark Water (F# Phrygian, half time, a heartbeat and one toy bell: the
     hollow), Out of Step (A Dorian, marimba twos on the left against celesta threes on the right, until they fall in
     step), and Feather Bound (A Aeolian, a waltz again: each instrument says goodnight from alternating ears, and it ends
     on B, unresolved, held by two voices). Bars of 6 or 8 eighths, so the engine's bar is one eighth and the parts are
     counted here. No music box, piano or harp. Straight time. */
  IV["sus2"]=[0,2,7];IV["5"]=[0,7,12];
  // the parts: name, eighths a bar, tempo (x 96 bpm), one chord a bar
  const FB_PARTS=[
    ["lull",6,.875,"Am G Fmaj7 Em Dm7 C G/B Em Am G Dm7 Am"],
    ["follow",8,1,"C Bbmaj7 C Am F Gm7 Bb C Bb C5"],
    ["swell",8,.75,"Eb F Cm7 Ebmaj7 Cm7 F/Eb Dm7 F/Eb"],
    ["dark",8,.667,"F#m G/F# Dmaj7 F#m Bm A G G"],
    ["step",6,1.04,"Am G D Am D7 Am G Em Am G D Am D7 D"],
    ["bound",6,.79,"Am G Fmaj7 Dm7 C Esus4 Asus2 Asus2 Asus2"]];
  const FB_LEADS={lull:"ocarina",follow:"marimba",swell:"glassharp",dark:"celesta",step:"kalimba"};
  const FB_BOUND=["ocarina","marimba","celesta","kalimba","glassharp","glassharp","glassharp","glassharp","glassharp"];
  // every song bar {s: part, k: bar in the part, n: eighths, f: tempo, C: chord, e0: first eighth}, and every eighth [bar, i]
  const FB_BARS=[],FB_E=[];
  FB_PARTS.forEach(([s,n,f,ch])=>{chords(ch).forEach((C,k)=>{const b=FB_BARS.length;FB_BARS.push({s,k,n,f,C,e0:FB_E.length,last:false});for(let i=0;i<n;i++)FB_E.push([b,i])});FB_BARS[FB_BARS.length-1].last=true});
  const fbAt=a=>FB_E[Math.max(0,Math.min(a,FB_E.length-1))];
  // the tempo breathes: phrase ends, the hand-offs, a ritard out of the dark and out of step, and the last part slowing
  const fbTempo=a=>{const [b,i]=fbAt(a),P=FB_BARS[b],n=P.n;let v=P.f;
    if(P.s==="bound")v=.79-.1*P.k/8;
    if(i>=n-2&&[3,7,25,28].includes(b))v*=.9;
    if(P.last){if(P.s==="lull"&&i>=4)v*=.94;
      if(P.s==="follow")v*=i>=6?.85:i>=4?.92:1;
      if(P.s==="swell")v*=.92;
      if(P.s==="dark")v*=1-.2*i/7;
      if(P.s==="step")v*=1-.15*i/5}
    return v};
  const FB_BD=FB_BARS.map(P=>{let d=0;for(let i=0;i<P.n;i++)d+=60/96/2/fbTempo(P.e0+i);return d});   // each bar's length (s)
  const fbLead=a=>{const P=FB_BARS[fbAt(a)[0]];return P.s==="bound"?FB_BOUND[P.k]:FB_LEADS[P.s]};
  const FB_LV={ocarina:.27,marimba:.32,glassharp:.28,celesta:.31,kalimba:.31};
  const FB_RL={ocarina:[.25,.97],marimba:[1.3,1],glassharp:[1.1,1.02],celesta:[.9,1],kalimba:[1.1,1]};   // release, legato
  // the kalimba's ripple notes in the Swell: chord tones over two octaves (and the Lydian A over the Eb chords)
  const fbPool=C=>{const iv=C.iv.concat(C.r===51?[6]:[]),p=[];for(const o of [12,24,36])for(const v of iv){const m=C.r+o+v;if(m>=62&&m<=91&&!p.includes(m))p.push(m)}return p.sort((x,y)=>x-y).slice(0,8)};
  let FB_RP=null;   // this bar's travelling panner for the ripples
  const FEATHER={name:"Feather Bound",bpm:96,trim:1.17,bar:1,lead:"ocarina",leadV:.27,rel:.25,leg:.97,lp:3000,echo:.1,fb:.2,dly:.62,
    dyn:.7,contrast:.86,hum:.006,rv:.38,ds:.14,rev:[5.5,.5],wow:[.0006,.22],
    chords:FB_E.map(([b])=>FB_BARS[b].C),
    mel:mel([
      // Lullaby: A Aeolian, 3/4, the ocarina
      `E5:2 A5:4  B5:2 A5:2 G5:2  F5:6  E5:6  C5:2 F5:4  E5:2 D5:2 C5:2  B4:6  r:6
       E5:2 A5:4  B5:2 A5:2 G5:2  F5:2 E5:2 D5:2  C5:2 B4:2 A4:2`,
      // Following: C Mixolydian, 3-3-2, the marimba
      `G4:3 C5:3 D5:2  C5:3 Bb4:3 A4:2  G4:3 G4:3 E4:2  E4:3 A4:3 G4:2  F4:3 E4:3 D4:2
       D4:3 F4:3 D4:2  F4:3 Bb4:3 C5:2  C5:3 E5:3 G5:2  F5:3 D5:3 Bb4:2  C5:6 r:2`,
      // the Swell: Eb Lydian, ripples, the glass harmonica
      `Bb4:2 Eb5:6  F5:2 Eb5:2 D5:4  C5:4 Bb4:4  Bb4:8  G4:2 C5:6  Bb4:2 A4:2 G4:4  F4:8  r:8`,
      // Dark Water: F# Phrygian, half time, the celesta
      `C#5:2 F#5:6  G5:2 F#5:2 E5:4  D5:4 C#5:4  r:8  A4:2 D5:6  C#5:2 B4:2 A4:4  G4:8  r:8`,
      // Out of Step: A Dorian, 3 against 2, the kalimba (the ocarina joins it an octave up)
      `E4:2 A4:4  B4:2 A4:2 G4:2  F#4:3 E4:3  E4:6  C4:2 F#4:4  E4:2 D4:2 C4:2  B3:6  r:6
       E5:2 A5:4  B5:2 A5:2 G5:2  F#5:3 E5:3  E5:6  C5:2 F#5:4  A5:2 F#5:2 D5:2`,
      // Feather Bound: A Aeolian, 3/4, a bar from each, and B held by two
      `E5:2 A5:4  B5:2 A5:2 G5:2  F5:2 E5:4  C5:2 F5:4  E5:2 D5:2 C5:2  B4:12  r:12`].join(" ")),
    // the instruments take turns: each sets its own release, legato and room as its note starts
    leadFor:a=>{const ty=fbLead(a),[r,l]=FB_RL[ty],s=FB_BARS[fbAt(a)[0]].s;FEATHER.rel=r;FEATHER.leg=l;FEATHER.rv=s==="dark"?.8:.38;FEATHER.ds=s==="dark"?.3:.14;return ty},
    leadVFor:a=>FB_LV[fbLead(a)],
    tempo:(b,i,a)=>fbTempo(a),
    onNote:(e,t,E8,x)=>{GL=null;const m=e.m.length===1?e.m[0]:null;if(m==null)return;const P=FB_BARS[fbAt(x.abs)[0]],ty=fbLead(x.abs),v=FB_LV[ty]*e.vel;
      // a long marimba note is rolled, softly, the way a player holds it
      if(ty==="marimba"&&e.l>=4){on(send(.4,.1,BUS.lead));for(let j=1;j<e.l*2;j++){const q=j/(e.l*2);voice("marimba",hz(m),t+j*E8/2,E8/2,v*(.42-.26*q)*(j%2?.85:1),.8)}}
      // the pair together again: the ocarina doubles the kalimba an octave up, softly
      if(P.s==="step"&&P.k>=8&&P.k<13){on(panTo(-.2,-.2,t,.05,.5,.15));voice("ocarina",hz(m),t+.01,e.l*E8*.95,.085*e.vel,.25)}
      // the last B, held by the ocarina and the glass harmonica together
      if(P.s==="bound"&&P.k>=5){on(panTo(.1,.1,t,.05,.6,.2));voice("ocarina",hz(m),t+.02,e.l*E8*1.02,.11*e.vel,1)}},
    // the engine's bar is one eighth: this runs on every eighth, with the song bar and the eighth in it worked out here
    onBar:x=>{GL=null;const {t,abs:a,E8}=x,[b,i]=fbAt(a),P=FB_BARS[b],{s,k,C}=P,B=FB_BD[b];
      const pan=(p,rv,ds)=>panTo(p,p,t,.05,rv,ds);
      if(i===0){
        // hollow to full: the whole mix's swell, a low-pass on everything and one on the tune
        const sw={lull:.72+.02*k,follow:.86+.012*k,swell:k>=2&&k<=5?1.1:k===7?.86:.97,dark:k===3?.4:.5,step:Math.min(1,.6+.4*k/12),bound:.8-.3*k/8}[s];
        const lp={lull:3000,follow:3800,swell:k>=2&&k<=5?4500:3800,dark:k===3?1100:1500,step:2400+150*k,bound:3400-100*k}[s];
        const llp={lull:3600,follow:5000,swell:6500,dark:2600,step:5000,bound:4000}[s];
        BUS.swl.gain.setTargetAtTime(sw,t,B*.3);BUS.lp.frequency.setTargetAtTime(lp,t,B*(s==="dark"&&k===0?.15:.3));BUS.leadLP.frequency.setTargetAtTime(llp,t,B*.3);
        // where the tune sits: the ocarina a little left; the marimba comes in from the right; the celesta wanders
        // across the dark; in the last part each bar comes from the other ear, and the end is centered
        const lpn=BUS.leadPan.pan;
        if(s==="lull")lpn.setTargetAtTime(-.3,t,k?B*.4:.05);
        if(s==="follow"&&k===0){lpn.setTargetAtTime(.6,t,.06);lpn.setTargetAtTime(0,t+B*.5,B*.6)}
        if(s==="swell"||s==="step")lpn.setTargetAtTime(0,t,B*.3);
        if(s==="dark")lpn.setTargetAtTime(-.4+.8*k/7,t,k?B*.5:.15);
        if(s==="bound")lpn.setTargetAtTime([-.5,.5,-.5,.5,-.5,0,0,0,0][k],t,E8*.4)}
      if(s==="lull"){
        if(i===0){on(send(.3,0,BUS.bass));voice("mbass",hz(C.b-12),t,E8*2.6,.15,.6);
          if(k>=2){on(send(.5,.05,BUS.bass));voice("warm",C.iv.slice(0,3).map(v=>hz(C.r+v+12)),t,B*1.02,.011+.0006*k,.8)}
          if(k>=8){on(send(.9,.15));for(const v of C.iv.slice(0,3))voice("ooh",hz(C.r+12+v),t+.05,B*.98,.012,.8)}}
        // the waltz's 2 and 3: soft marimba pairs on the right
        if(i===2||i===4){on(pan(.35,.45,.12));const v=(i===2?.05:.04)*(k<2?.8:1);voice("marimba",hz(C.r+C.third),t,E8*2,v,.9);voice("marimba",hz(C.r+C.fifth),t+.012,E8*2,v*.85,.9)}
        // hand-off: the marimba answers from the right, G and C
        if(P.last&&(i===3||i===5)){on(pan(.6,.6,.2));voice("marimba",hz(i===3?67:72),t,E8*2,i===3?.07:.08,1.1)}}
      if(s==="follow"){
        // 3-3-2: eighths 0, 3 and 6 (the bass, low marimba pairs center, left, right, and a wood tick)
        if((i===0||i===3||i===6)&&!(P.last&&i===6)){const j=i/3,acc=[1,.75,.85][j];
          on(send(.3,0,BUS.bass));voice("mbass",hz(j===2?C.r+C.fifth-12:C.b-12),t,E8*(j===2?1.8:2.7),.16*acc,.4);
          on(pan([0,-.45,.45][j],.4,.1));voice("marimba",hz(C.r+C.third),t,E8*2,.045*acc,1);voice("marimba",hz(C.r+C.fifth),t+.01,E8*2,.04*acc,1);
          on(BUS.perc);wood(t,[.011,.008,.009][j]);if(j===0)thump(t,.09,hz(C.b-12),.12,.01)}
        if(i===0){on(send(.5,.05,BUS.bass));voice("warm",C.iv.slice(0,3).map(v=>hz(C.r+v+12)),t,B*1.02,.013,.8);
          if(k>=6&&!P.last){on(send(.9,.15));for(const v of C.iv.slice(0,3))voice("ooh",hz(C.r+12+v),t+.05,B*.98,.012+.002*(k-6),.8)}}
        // hand-off: the glass harmonica glows in from the left, Bb and Eb, over the open fifth
        if(P.last&&(i===4||i===6)){on(pan(-.5,.7,.25));voice("glassharp",hz(i===4?70:75),t,E8*(i===4?2:2.4),.06,1)}}
      if(s==="swell"){const pk=k>=2&&k<=5;
        if(i===0){const L=P.last?.5:1;
          on(send(.3,0,BUS.bass));voice("mbass",hz(C.b-12),t,B*.97*L,pk?.19:.16,.8);
          on(send(.6,.1,BUS.bass));voice("warm",C.iv.slice(0,4).map(v=>hz(C.r+v+12)),t,B*1.02*L,pk?.024:.017,1);
          if(k>=1&&!P.last){on(pan(.4,.6,.1));const bv=pk?.05:.035;voice("bow",hz(C.r+12+C.fifth),t+.03,B,bv,.9);voice("bow",hz(C.b),t+.06,B,bv*.8,.9)}
          if(pk){on(send(.8,.15));for(const v of C.iv.slice(0,3))voice("ooh",hz(C.r+12+v),t+.05,B*.98,.026,.9);
            on(pan(k%2?.55:-.55,1,.4));voice("glass",hz(C.r+24+C.fifth),t+.02,E8*3,.02,1.3)}
          FB_RP=panTo(k%2?.7:-.7,k%2?-.7:.7,t,B,.5,.2)}
        // the ripples: two sixteenths an eighth, up the chord and back, from one ear to the other
        if(!P.last||i<4){const pool=fbPool(C);for(let h=0;h<2;h++){const j=i*2+h,n=pool[Math.min(j<8?j:15-j,pool.length-1)];on(FB_RP);
          const v=.045*(j%4===0?1:j%2?.7:.85)*(pk?1.15:1)*(P.last?1-.2*i:1)*(k===0&&i<3?.55+.15*i:1);voice("kalimba",hz(n),t+h*E8/2,E8/2,v,.7)}}
        // hand-off: the celesta, small, from the left, C# and F#
        if(P.last&&(i===5||i===6)){on(pan(-.5,.7,.25));voice("celesta",hz(i===5?73:78),t,E8*(i===5?1.6:2.5),.06,.9)}}
      if(s==="dark"){
        // half time: a slow heartbeat (lub on 0, dub just after) and a brush on beat 3
        on(BUS.perc);if(i===0)thump(t,.17,58,.13);if(i===1)thump(t+E8*.1,.1,58,.1);if(i===4)brush(t,.016);
        if(i===0&&k!==3){on(send(.3,0,BUS.bass));voice("mbass",hz(C.b-12),t,B*.97,.1,.9);on(send(.7,.1,BUS.bass));voice("warm",C.iv.slice(0,3).map(v=>hz(C.r+v)),t,B*1.02,.014,1.2)}
        // far away, someone calling back
        if(i===0&&k>=4&&k<=6){on(pan(.5,1.4,.3));voice("ooh",hz(C.r+12+C.fifth),t+.1,B*.9,.012,1)}
        // hand-off: the kalimba from the left, E and A
        if(P.last&&(i===4||i===6)){on(pan(-.5,.6,.25));voice("kalimba",hz(i===4?64:69),t,E8*2,.07,1.2)}}
      if(s==="step"){const thr=k>=12,mp=k<10?-.55:k===10?-.3:-.08,cp=k<10?.55:k===10?.3:.08;
        if(i===0){on(send(.3,0,BUS.bass));voice("mbass",hz(C.b-12),t,E8*5,.14,.6);
          on(send(.5,.05,BUS.bass));voice("warm",C.iv.slice(0,3).map(v=>hz(C.r+v+12)),t,B*1.02,.011+.0006*k,.8);
          if(k>=8){on(send(.8,.15));for(const v of C.iv.slice(0,3))voice("ooh",hz(C.r+12+v),t+.05,B*.98,.014+.001*(k-8),.8)}}
        // the marimba paddles in twos on the left (in threes, in step, from bar 51); the celesta in threes on the right
        if(thr?i%2===0:i%3===0){const j=thr?i/2:i/3;on(pan(mp,.35,.1));voice("marimba",hz(C.r+(thr?[0,C.third,C.fifth][j]:j?C.fifth:0)),t,E8*2,.07*(j?.8:1),1)}
        if(i%2===0){const j=i/2;on(pan(cp,.5,.15));voice("celesta",hz(C.r+12+[C.fifth,12,12+C.third][j]),t,E8*2,.038*(j?.8:1)*(k<1?.7:1),.7)}
        // hand-off: the ocarina from the left, E and A
        if(P.last&&(i===3||i===5)){on(pan(-.55,.6,.2));voice("ocarina",hz(i===3?76:81),t,E8*1.6,.06,.4)}}
      if(s==="bound"){const fd=1-.4*k/8;
        if(i===0){on(send(.3,0,BUS.bass));voice("mbass",hz(C.b-12),t,k>=7?B*1.9:E8*2.6,.14*fd,.8);
          if(k<7){on(send(.5,.05,BUS.bass));voice("warm",C.iv.slice(0,3).map(v=>hz(C.r+v+12)),t,B*1.02,.014*fd,.9)}
          if(k===7){on(send(.9,.2));for(const v of C.iv)voice("ooh",hz(C.r+12+v),t+.05,B*1.9,.024,1.4)}}
        // the waltz's 2 and 3 on soft bowed strings, from the other ear
        if((i===2||i===4)&&k<7){on(pan(k%2?-.3:.3,.5,.1));const v=.03*fd*(i===4?.85:1);voice("bow",hz(C.r+12+C.third),t,E8*1.8,v,.5);voice("bow",hz(C.r+12+C.fifth),t+.02,E8*1.8,v*.8,.5)}}}};
  const TRACKS=[
    /* v59: rewritten in F Lydian: clusters of notes, then a breath; in the quiet, notes fall away (the only air in it);
       crisp and muted, warped a little, with a soft hiss */
    {name:"Lantern in the Fog",bpm:60,trim:1.3,bar:8,lead:"crisp",leadV:.26,rel:.25,bass:"chordpad",drum:"",lp:2000,echo:.2,
      dyn:.5,hum:.01,rv:.28,ds:.1,rev:[5,.45],wow:[.0012,.27],bed:.004,swell:.12,
      chords:chords("Fmaj7 G/F Am7 G/F Fmaj7 Em7 Dm7 G/F Cmaj7/E Fmaj7 G Am7 Fmaj7 G/F Em7 Fmaj7#11"),
      mel:mel(`C5:.5 E5:.5 B5:.5 A5:1.5 r:1.5 G5:1:.3:a E5:1.5:.2:a r:1
        D5:.333 B4:.333 G4:.334 A4:2 r:2 E5:1:.28:a C5:2:.18:a
        E5:.5 G5:.5 C6:.5 B5:.5 A5:2 r:1.5 G5:1:.25:a D5:1.5:.18:a
        r:2 B5:.333 A5:.333 G5:.334 D5:1 r:1.5 B4:1:.25:a A4:1.5:.18:a
        A4:.5 C5:.5 E5:.5 G5:.5 B5:3 r:1 E6:1:.22:a C6:1:.16:a
        r:1 G5:.5 E5:.5 B4:.5 D5:1.5 r:2 A4:1:.24:a G4:1:.16:a
        F5:.333 A5:.333 C6:.334 D6:1 C6:.5 A5:1.5 r:2.5 E5:1.5:.2:a
        B5:4:.7 r:1 A5:1:.22:a E5:2:.15:a
        E5:.5 G5:.5 B5:.5 C6:.5 r:1 B5:.333 G5:.333 E5:.334 r:2 D5:2:.2:a
        A5:1.5 G5:.5 E5:2 r:2 C5:1:.24:a A4:1:.15:a
        D5:.5 G5:.5 B5:.5 D6:.5 C6:.5 B5:.5 A5:1 r:2 G5:2:.2:a
        E5:.333 C5:.333 A4:.334 B4:2 r:2.5 E5:1:.22:a C5:1.5:.15:a
        C6:.5 B5:.5 G5:.5 E5:.5 F5:1 r:2 A5:1:.25:a E5:2:.16:a
        B4:.333 D5:.333 G5:.334 A5:.333 B5:.333 D6:.334 r:2 C6:1:.24:a B5:1:.2:a G5:2:.14:a
        G5:.5 E5:.5 D5:.5 B4:.5 r:3 A4:1.5:.2:a G4:1.5:.14:a
        A4:.5 C5:.5 E5:.5 B5:4.5:.6 r:2`)},
    /* Candle Vigil from Ether's Crossroads, moved from A minor into A Lydian (A B C# D# E F# G#): soft notes that float
       off above the long ones */
    {name:"Bubble Bath in the Sky",bpm:56,trim:1.2,bar:8,bass:"slowsoft",drum:"",lead:"softbox",leadV:.22,rel:1,leg:1.1,lp:3400,echo:.3,fb:.3,dly:.55,
      dyn:.85,contrast:.72,rv:.42,ds:.14,rev:[5.5,.5],swell:.15,
      chords:chords("A F#m C#m E E A B E A A F#m C#m G#m A B E A"),
      mel:mel(`E5:4 C#5:2 A4:2 F#4:6 A4:2 G#4:4 E4:2 G#4:2 G#4:6 r:10 A4:2 B4:2 C#5:2 E5:2 F#5:4 E5:2 D#5:2 B4:4 G#4:2 B4:2 A4:8
        r:2 E5:2 D#5:2 C#5:2 A4:4 C#5:4 G#4:4 C#5:2 E5:2 D#5:6 B4:2 C#5:4 B4:2 A4:2 F#4:4 A4:2 D#5:2 E5:4 D#5:2 B4:2 A4:8`),
      onNote:(e,t,E8,x)=>{if(e.l<4||rnd()>.6)return;const C=x.C,base=e.m[0],c=[...C.iv,12].map(v=>C.r+v+24).filter(m=>m>base&&m<=base+12);if(!c.length)return;
        on(send(1,.6));GL={r:1,fall:Math.pow(2,14/1200),ft:.2,fd:1.2};   // it floats up as it fades
        voice("softbox",hz(c[Math.floor(rnd()*c.length)]),t+E8*(1.5+rnd()*1.5),E8*2,.22*.24*e.vel,1.4);GL=null}},
    glow("Glow","dorian","Dm7 Dm7 G/D Bm7b5 Dm7 Fmaj7 Bm7b5 Fmaj7 Dm7 Em7 Cmaj7 Am7 Bm7b5 G/D Dm7 G/D Bm7b5 Em7 Cmaj7 Bm7b5 Bm7b5 Em7 Dm7 Dm7 Dm7 Bm7b5 G/D Fmaj7 Am7 Dm7 G/D Bm7b5 Fmaj7 Dm7 Em7 Am7 Bm7b5 G/D Dmadd9 Dm7"),
    JESTERS,
    SPRING,
    DUCKS,
    POND,
    SWIM,
    WADDLE,
    CHICKS,
    RUFFLES,
    WTD,
    FEATHER
  ];
  const BASE=.45;   // 100% music: loud, but under the game
  const LV=()=>BASE*(profile.settings.sound/100)*(profile.settings.music/100);
  const hz=m=>440*Math.pow(2,(m-69)/12);
  /* on a phone the music is played at a third of the usual sample rate (every song is filtered below 4.2 kHz anyway), the notes' tails
     are cut sooner (after they have faded to almost nothing), the faint layers are left out (shimmers an octave up,
     sub-octaves, the music box's halo and tine, detuned twins) and nothing has vibrato, so the music takes a fraction of
     the work and doesn't stutter; a computer plays everything in full */
  const LITE=matchMedia("(hover: none) and (pointer: coarse)").matches,TL=LITE?.5:1;
  let ac=null,out=null,bout=null,timer=null,playing=false,T=null,next=0,step=0,ei=0,EV=[],total=0,last=-1,BUS=null,CACHE={},DST=null,GL=null,prevF=null,BEDS=[],MUTE="";
  /* a seeded chance, so a song written out sounds the same each time; in play it is new each time through */
  let SEED=1;const rnd=()=>{SEED=SEED+0x6D2B79F5|0;let t=Math.imul(SEED^SEED>>>15,1|SEED);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296};
  const gn=v=>{const g=ac.createGain();g.gain.value=v==null?1:v;return g};
  const biq=(ty,f,q)=>{const b=ac.createBiquadFilter();b.type=ty;b.frequency.value=f;if(q!=null)b.Q.value=q;try{b.frequency.automationRate=b.Q.automationRate="k-rate"}catch(e){}return b};
  const on=d=>{DST=d};
  // a note's own way out: dry to its bus, and as much as it asks into the room and into the delay
  function send(rv,ds,dst){const n=gn();n.connect(dst||BUS.fx);if(rv){const s=gn(rv);n.connect(s);s.connect(BUS.revIn)}if(ds){const s=gn(ds);n.connect(s);s.connect(BUS.d2In)}return n}
  /* the mix: everything -> a swell -> a flanger -> a slow pitch wobble -> the volume -> the song's low-pass and its old echo.
     The melody and the bass pass a fuzz on the way (off unless a song wants it). The room and the delay come back in before the flanger. */
  function graph(){CACHE={};BEDS=[];
    out=gn(0);const lp=biq("lowpass",1600);const dl=ac.createDelay(1);dl.delayTime.value=.42;const fb=gn(.22),wet=gn(.28);
    out.connect(lp);lp.connect(ac.destination);lp.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(wet);wet.connect(ac.destination);
    const pre=gn(),swl=gn(),fdry=gn(),fwet=gn(0),fd=ac.createDelay(.05),ffb=gn(.55),fl=ac.createOscillator(),flg=gn(.0035);fd.delayTime.value=.0068;fl.frequency.value=.13;
    const wow=ac.createDelay(1);wow.delayTime.value=.03;const w1=ac.createOscillator(),wg1=gn(0),w2=ac.createOscillator(),wg2=gn(0);w1.frequency.value=.3;w2.frequency.value=.071;
    pre.connect(swl);swl.connect(fdry);swl.connect(fd);fd.connect(fwet);fd.connect(ffb);ffb.connect(fd);fl.connect(flg);flg.connect(fd.delayTime);
    fdry.connect(wow);fwet.connect(wow);w1.connect(wg1);wg1.connect(wow.delayTime);w2.connect(wg2);wg2.connect(wow.delayTime);const trim=gn(),hp=biq("highpass",25,.6);wow.connect(trim);trim.connect(hp);hp.connect(out);fl.start();w1.start();w2.start();
    const music=gn(),mdry=gn(),mpre=gn(2),ws=ac.createWaveShaper(),mlp=biq("lowpass",1400,.5),mwet=gn(0);ws.curve=fuzzCurve();ws.oversample="2x";
    music.connect(mdry);mdry.connect(pre);music.connect(mpre);mpre.connect(ws);ws.connect(mlp);mlp.connect(mwet);mwet.connect(pre);
    const lead=gn(),leadLP=biq("lowpass",20000,.5);const leadPan=ac.createStereoPanner();lead.connect(leadLP);leadLP.connect(leadPan);leadPan.connect(music);const bass=gn();bass.connect(music);
    const perc=gn();perc.connect(pre);const fx=gn();fx.connect(pre);const revIn=gn(),revOut=gn(.9);revOut.connect(pre);
    const d2In=gn(),d2a=ac.createDelay(2),d2b=ac.createDelay(2),d2fb=gn(.42),d2lp=biq("lowpass",1800,.5),pa=ac.createStereoPanner(),pb=ac.createStereoPanner(),d2Out=gn(.8);pa.pan.value=-.55;pb.pan.value=.55;
    d2In.connect(d2a);d2a.connect(pa);pa.connect(d2Out);d2a.connect(d2b);d2b.connect(pb);pb.connect(d2Out);d2b.connect(d2fb);d2fb.connect(d2lp);d2lp.connect(d2a);d2Out.connect(pre);   // each repeat darker than the last
    BUS={lp,dl,fb,wet,pre,swl,trim,fwet,w1,wg1,wg2,mdry,mpre,mlp,mwet,lead,leadLP,leadPan,bass,perc,fx,revIn,revOut,rev:null,revK:"",d2a,d2b,d2In};DST=music}
  function ctx(){if(ac)return ac;const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;try{ac=new A(LITE?{latencyHint:"playback",sampleRate:16000}:{latencyHint:"playback"})}catch(e){ac=new A()}graph();bout=gn(0);bout.connect(ac.destination);return ac}   // a roomy buffer: a busy computer doesn't make it crackle
  /* a made room: two channels of noise that fade (and darken) over the room's length */
  function irBuf(sec,dark){const n=Math.floor(ac.sampleRate*sec),b=ac.createBuffer(2,n,ac.sampleRate),pd=Math.floor(ac.sampleRate*.018);
    for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);let y=0;for(let k=pd;k<n;k++){const q=k/n,cut=1-dark*(.25+.7*q);y+=cut*((Math.random()*2-1)-y);d[k]=y*Math.exp(-6.9*q)}}return b}
  function setRev([sec,dark]){const k=sec+"/"+dark;if(BUS.revK===k)return;BUS.revK=k;const c=ac.createConvolver();c.buffer=irBuf(sec,dark);BUS.revIn.connect(c);c.connect(BUS.revOut);
    const old=BUS.rev;BUS.rev=c;if(old){BUS.revIn.disconnect(old);setTimeout(()=>{try{old.disconnect()}catch(e){}},sec*1000+600)}}
  /* each song sets its own room: how bright, how far the echo, how much fuzz, flanging and wobble */
  function room(now){if(!BUS||!T)return;const t=ac.currentTime,P=(p,v)=>{p.cancelScheduledValues(t);if(now)p.setValueAtTime(v,t);else p.setTargetAtTime(v,t,.4)};
    P(BUS.lp.frequency,T.lp||1600);P(BUS.dl.delayTime,T.dly||.42);P(BUS.fb.gain,T.fb||.22);P(BUS.wet.gain,T.echo||.28);
    P(BUS.pre.gain,1);P(BUS.swl.gain,1);P(BUS.trim.gain,T.trim||1);P(BUS.lead.gain,1);P(BUS.bass.gain,T.bassV||1);P(BUS.leadLP.frequency,T.leadLp||20000);P(BUS.leadPan.pan,0);
    const fz=T.fuzz||[0,1,1400];P(BUS.mwet.gain,fz[0]);P(BUS.mdry.gain,fz[1]);P(BUS.mlp.frequency,fz[2]);P(BUS.mpre.gain,2);
    P(BUS.fwet.gain,T.flange||0);const w=T.wow||[0,.3];P(BUS.wg1.gain,w[0]);P(BUS.w1.frequency,w[1]);P(BUS.wg2.gain,w[0]*.6);
    const dt=Math.min(1.5,T.dt||60/T.bpm*.75);P(BUS.d2a.delayTime,dt);P(BUS.d2b.delayTime,dt);setRev(T.rev||[3,.5])}
  // a 25% pulse, the old cartridge's thin square
  function pulseWave(){if(CACHE.pw)return CACHE.pw;const n=32,re=new Float32Array(n),im=new Float32Array(n);for(let k=1;k<n;k++)im[k]=2/(k*Math.PI)*Math.sin(k*Math.PI*.25);return CACHE.pw=ac.createPeriodicWave(re,im)}
  const env=(g,t,a,peak,hold,rel)=>{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(0,t+Math.max(a,hold),rel)};
  // an oscillator; GL (when set) slides it in from another pitch, or lets it sag or rise as it sounds
  const osc=(type,f,t,stop,dest)=>{const o=ac.createOscillator();if(type==="pulse")o.setPeriodicWave(pulseWave());else o.type=type;o._f=f;
    if(GL&&GL.r&&GL.r!==1){o.frequency.setValueAtTime(f*GL.r,t);o.frequency.exponentialRampToValueAtTime(f,t+GL.d)}else o.frequency.setValueAtTime(f,t);
    if(GL&&GL.fall)o.frequency.setTargetAtTime(f*GL.fall,t+(GL.ft||.1),GL.fd||.5);
    o.connect(dest);o.start(t);o.stop(stop);return o};
  // vibrato that comes in after a moment, as a player's would
  function vib(os,t,stop,rate,depth,delay){if(LITE)return;os=os.filter(Boolean);const l=ac.createOscillator();l.frequency.value=rate;l.start(t);l.stop(stop);
    for(const o of os){const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.setValueAtTime(0,t+(delay||0));g.gain.linearRampToValueAtTime(o._f*depth,t+(delay||0)+.45);l.connect(g);g.connect(o.frequency)}}
  function noiseBuf(){if(CACHE.nb)return CACHE.nb;const n=ac.sampleRate*3,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let k=0;k<n;k++)d[k]=Math.random()*2-1;return CACHE.nb=b}
  function noiseSrc(t,dur){const s=ac.createBufferSource();s.buffer=noiseBuf();s.loop=true;s.start(t,Math.random()*2.5);s.stop(t+dur);return s}
  function distCurve(){if(CACHE.dc)return CACHE.dc;const n=1024,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(x*5)}return CACHE.dc=c}
  function fuzzCurve(){if(CACHE.fz)return CACHE.fz;const n=2048,c=new Float32Array(n),b=.18,k=2.4,o=Math.tanh(k*b);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=(Math.tanh(k*(x+b))-o)/1.05}return CACHE.fz=c}   // soft and lopsided: fuzz, not a shriek
  function crushCurve(){if(CACHE.cc)return CACHE.cc;const n=1024,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.round(x*7)/7}return CACHE.cc=c}   // a few steps: grain
  /* instruments: the cartridge's waves, a music box, a church organ, glass, a metallic FM bell, a harpsichord pluck, a
     tremolo mandolin, an accordion, a filtered brass, a formant choir, a distorted lead; v59: a wisp, a soft music box, bowed
     strings, a sad slide, a muted crisp key, a falling breath, a swelling tremolo, a soft bell */
  function voice(type,f,t,dur,peak,rel,vib_){const D=DST;
    if(type==="musicbox"){const g=gn();g.connect(D);env(g,t,.004,peak,.02,.55);osc("sine",f,t,t+2.6,g);
      const g2=gn();g2.connect(D);env(g2,t,.003,peak*.35,.01,.18);osc("sine",f*4.01,t,t+1,g2);
      const g3=gn();g3.connect(D);env(g3,t,.003,peak*.18,.01,.3);osc("sine",f*2.76,t,t+1.4,g3);return true}
    if(type==="organ"){const g=gn();g.connect(D);env(g,t,.09,peak,dur-.05,.18);const os=[[1,1],[2,.5],[3,.28],[4,.16],[6,.07]].map(([h,a])=>{const k=gn(a);k.connect(g);return osc("sine",f*h,t,t+dur+1,k)});
      if(vib_)vib(os,t,t+dur+1,4,.004,.15);return true}
    if(type==="glass"){const g=gn(),lp=biq("lowpass",3000,.5);lp.connect(g);g.connect(D);env(g,t,.035,peak,.05,Math.max(.4,dur*.5));osc("sine",f*2,t,t+dur+2,lp);
      const k=gn(.3);k.connect(lp);osc("triangle",f*2,t,t+dur+2,k);const g2=gn();g2.connect(D);env(g2,t,.02,peak*.07,.02,.3);osc("sine",f*4,t,t+1.2,g2);return true}
    if(type==="fmbell"){const g=gn();g.connect(D);env(g,t,.003,peak,.01,.9);const c=osc("sine",f,t,t+3.5,g);const mg=gn();mg.gain.setValueAtTime(f*2.2,t);mg.gain.setTargetAtTime(f*.2,t,.5);
      const m=ac.createOscillator();m.frequency.value=f*3.5;m.connect(mg).connect(c.frequency);m.start(t);m.stop(t+3.5);return true}
    if(type==="fmsoft"){const R=rel||.9,g=gn();g.connect(D);env(g,t,.006,peak,.01,R);const c=osc("sine",f,t,t+R*6,g);const mg=gn();mg.gain.setValueAtTime(f*.9,t);mg.gain.setTargetAtTime(f*.05,t,.25);
      const m=ac.createOscillator();m.frequency.value=f*3.5;m.connect(mg).connect(c.frequency);m.start(t);m.stop(t+R*6);return true}
    if(type==="pluck"||type==="mandolin"){const strum=tt=>{const g=gn(),lp=biq("lowpass",4200);lp.frequency.setValueAtTime(4200,tt);lp.frequency.setTargetAtTime(700,tt,.06);
        g.connect(D);lp.connect(g);env(g,tt,.003,peak,.01,type==="pluck"?.16:.05);osc("square",f,tt,tt+.6,lp);osc("sawtooth",f*1.004,tt,tt+.6,lp)};
      if(type==="pluck")strum(t);else for(let tt=t;tt<t+Math.max(.08,dur-.03);tt+=.075)strum(tt);return true}
    if(type==="accordion"){const g=gn();g.connect(D);env(g,t,.05,peak,dur-.05,.08);const tr=gn(1);tr.connect(g);
      const l=ac.createOscillator(),lg=gn(.3);l.frequency.value=6.2;l.connect(lg).connect(tr.gain);l.start(t);l.stop(t+dur+.5);
      osc("square",f,t,t+dur+.5,tr);osc("square",f*1.007,t,t+dur+.5,tr);return true}
    if(type==="brass"){const g=gn(),lp=biq("lowpass",380);lp.frequency.setValueAtTime(380,t);lp.frequency.linearRampToValueAtTime(2300,t+.08);lp.frequency.setTargetAtTime(1100,t+.1,.2);
      lp.connect(g);g.connect(D);env(g,t,.05,peak,dur-.05,.09);osc("sawtooth",f,t,t+dur+.5,lp);osc("sawtooth",f*.997,t,t+dur+.5,lp);return true}
    if(type==="choir"){const g=gn();g.connect(D);env(g,t,.28,peak,dur-.1,.45);
      for(const [fq,q,a] of [[730,6,1],[1090,7,.7],[2440,8,.25]]){const bp=biq("bandpass",fq,q),k=gn(a*2.2);bp.connect(k).connect(g);
        const o1=osc("sawtooth",f,t,t+dur+1,bp),o2=osc("sawtooth",f*1.005,t,t+dur+1,bp);if(vib_)vib([o1,o2],t,t+dur+1,4.8,.008,0)}
      return true}
    if(type==="dist"){const g=gn(),ws=ac.createWaveShaper(),lp=biq("lowpass",1700);ws.curve=distCurve();ws.connect(lp).connect(g);g.connect(D);env(g,t,.01,peak,dur-.04,.07);
      osc("sawtooth",f,t,t+dur+.4,ws);osc("sawtooth",f*.5,t,t+dur+.4,ws);return true}
    if(type==="wisp"){const a=Math.min(.16,Math.max(.05,dur*.3)),R=rel||.6,stop=t+dur+R*5*TL,g=gn();g.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(peak*.62,t+a,Math.max(.2,dur*.5));g.gain.setTargetAtTime(0,t+dur,R);
      const o1=osc("sine",f,t,stop,g),o2=osc("sine",f*1.0026,t,stop,g);   // two, a hair apart: a slow, seasick beating
      let o3=null;if(!LITE){const h=gn(.07);h.connect(g);o3=osc("triangle",f*2,t,stop,h)}if(!LITE){const s=gn(.16);s.connect(g);osc("sine",f*.5,t,stop,s)}   // and a ghost an octave down
      vib(o3?[o1,o2,o3]:[o1,o2],t,stop,4.4,.0045,.3);
      const nb=noiseSrc(t,dur+.4),bp=biq("bandpass",f*2,7),ng=gn(0);ng.gain.setValueAtTime(0,t);ng.gain.linearRampToValueAtTime(peak*1.6,t+a*.6);ng.gain.setTargetAtTime(0,t+a,.18);nb.connect(bp).connect(ng).connect(D);   // breath
      return true}
    if(type==="softtri"){const R=rel||.3,g=gn();g.connect(D);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.03);g.gain.setTargetAtTime(peak*.55,t+.04,.25);g.gain.setTargetAtTime(0,t+dur,R);osc("triangle",f,t,t+dur+R*5,g);return true}
    if(type==="softbox"){const R=rel||.9,end=t+Math.max(dur,.4),g=gn();g.connect(D);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.018);g.gain.setTargetAtTime(peak*.4,t+.03,.35);g.gain.setTargetAtTime(0,end,R);
      osc("sine",f,t,end+R*5*TL,g);const g2=gn();g2.connect(D);env(g2,t,.012,peak*.16,.02,.22);osc("sine",f*2,t,t+1.5,g2);
      if(!LITE){const g3=gn();g3.connect(D);env(g3,t,.01,peak*.05,.01,.12);osc("sine",f*3.98,t,t+.8,g3)}   // the tine, much softer than the old box
      if(!LITE){const h=gn();h.connect(D);h.gain.setValueAtTime(0,t);h.gain.linearRampToValueAtTime(peak*.22,t+.35);h.gain.setTargetAtTime(0,end,R*1.4);osc("triangle",f,t,end+R*7,h)}   // a halo that lingers
      return true}
    if(type==="viol"||type==="lament"){const L=type==="lament",a=L?.2:.1,R=rel||(L?.5:.3),stop=t+dur+R*5,g=gn(),lp=biq("lowpass",L?1500:Math.min(5000,f*4+600),.7);lp.connect(g);g.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(peak*.8,t+a,Math.max(.1,dur*.6));g.gain.setTargetAtTime(0,t+dur,R);
      const o1=osc("sawtooth",f,t,stop,lp),tg=gn(L?1.4:.6);tg.connect(lp);const o2=osc(L?"triangle":"sawtooth",f*1.003,t,stop,tg);
      vib([o1,o2],t,stop,L?4.9:5.6,L?.0075:.005,L?.25:.18);
      const nb=noiseSrc(t,dur+.3),hp=biq(L?"bandpass":"highpass",L?Math.min(8000,f*3):3200,L?3:.7),ng=gn(0);ng.gain.setValueAtTime(0,t);ng.gain.linearRampToValueAtTime(peak*(L?.25:.35),t+a);ng.gain.setTargetAtTime(0,t+dur*.5,.15);nb.connect(hp).connect(ng).connect(D);   // the bow's rosin
      return true}
    if(type==="crisp"){const R=rel||.25,stop=t+dur+R*5+.1,g=gn(),ws=ac.createWaveShaper(),lp=biq("lowpass",2600,1.2);ws.curve=crushCurve();ws.connect(lp).connect(g);g.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.008);g.gain.setTargetAtTime(peak*.45,t+.02,.12);g.gain.setTargetAtTime(0,t+dur,R);
      const p=gn(.9);p.connect(ws);osc("triangle",f,t,stop,p);const k=gn(.3);k.connect(ws);osc("pulse",f*1.002,t,stop,k);
      lp.frequency.setTargetAtTime(900,t+.01,.15);return true}   // the click of a key, then felt
    if(type==="air"){const R=rel||.8,stop=t+dur+R*5,g=gn();g.connect(D);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.05);g.gain.setTargetAtTime(peak*.5,t+.06,Math.max(.1,dur*.4));g.gain.setTargetAtTime(0,t+dur*.8,R);
      osc("sine",f,t,stop,g);const h=gn(.12);h.connect(g);osc("sine",f*2,t,stop,h);
      const nb=noiseSrc(t,dur+R*3),bp=biq("bandpass",f*1.5,9),ng=gn(0);ng.gain.setValueAtTime(0,t);ng.gain.linearRampToValueAtTime(peak*3,t+.04);ng.gain.setTargetAtTime(0,t+.06,Math.max(.1,dur*.35));nb.connect(bp).connect(ng).connect(D);
      return true}
    if(type==="swell"){const a=dur>.6?dur*.4:.06,R=rel||.35,stop=t+dur+R*5,g=gn(),lp=biq("lowpass",700,.8),tr=gn(1);tr.connect(lp);lp.connect(g);g.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(peak*.55,t+a,Math.max(.1,dur*.5));g.gain.setTargetAtTime(0,t+dur,R);
      const l=ac.createOscillator(),lg=gn(.35);l.frequency.value=8.5+rnd()*2;l.connect(lg).connect(tr.gain);l.start(t);l.stop(stop);   // a soft tremolo: the mandolin's ghost
      osc("sawtooth",f,t,stop,tr);osc("triangle",f*1.004,t,stop,tr);
      lp.frequency.setValueAtTime(700,t);lp.frequency.linearRampToValueAtTime(1900,t+a);lp.frequency.setTargetAtTime(1100,t+a,Math.max(.1,dur*.6));return true}   // it opens as it swells
    /* for the glowing songs: a felt piano, a harp, a muffled bass and a warm old pad */
    if(type==="felt"){const R=rel||1.1,end=t+Math.max(dur,.25),stop=end+R*5*TL,g=gn(),lp=biq("lowpass",Math.min(5200,f*6),.4);lp.connect(g);g.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.008);g.gain.setTargetAtTime(peak*.34,t+.012,.45);g.gain.setTargetAtTime(0,end,R);
      lp.frequency.setTargetAtTime(Math.min(1700,f*2.4),t+.012,.3);   // the hammer's brightness fades into felt
      if(LITE)osc("triangle",f,t,stop,lp);else{osc("sine",f,t,stop,lp);const k=gn(.65);k.connect(lp);osc("triangle",f*1.0018,t,stop,k);const h=gn(.1);h.connect(lp);osc("sine",f*2.002,t,stop,h)}
      // the hammer's thud: a breath of noise that swells in over 5 ms (one that started at full strength was heard as crackling)
      const nb=noiseSrc(t,.09),bp=biq("bandpass",1500,1.2),ng=gn(0);ng.gain.setValueAtTime(0,t);ng.gain.linearRampToValueAtTime(peak*.1,t+.005);ng.gain.setTargetAtTime(0,t+.005,.012);nb.connect(bp).connect(ng).connect(D);
      return true}
    if(type==="harp"){const R=rel||.9,stop=t+R*6*TL,g=gn(),lp=biq("lowpass",3400,.5);lp.connect(g);g.connect(D);env(g,t,.004,peak,.01,R);
      osc("triangle",f,t,stop,lp);if(!LITE){const h=gn(.3);h.connect(lp);osc("sine",f*2,t,stop,h)}lp.frequency.setTargetAtTime(1200,t+.02,.4);return true}
    if(type==="mbass"){const R=rel||.5,stop=t+dur+R*5*TL,g=gn(),lp=biq("lowpass",260,.7);lp.connect(g);g.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.05);g.gain.setTargetAtTime(peak*.7,t+.06,Math.max(.1,dur*.4));g.gain.setTargetAtTime(0,t+dur,R);
      osc("sine",f,t,stop,lp);if(!LITE){const k=gn(.45);k.connect(lp);osc("triangle",f*1.002,t,stop,k)}return true}
    if(type==="warm"){const a=Math.max(.3,dur*.35),R=rel||.8,stop=t+dur+R*5*TL,g=gn(),lp=biq("lowpass",380,.6);lp.connect(g);g.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(peak*.8,t+a,dur*.5);g.gain.setTargetAtTime(0,t+dur,R);
      const k=gn(.6);k.connect(lp);for(const x of [].concat(f)){osc("sawtooth",x,t,stop,lp);if(!LITE){osc("sawtooth",x*1.0035,t,stop,lp);osc("triangle",x*.5,t,stop,k)}}   // f may be a whole chord
      lp.frequency.linearRampToValueAtTime(950,t+a);lp.frequency.setTargetAtTime(600,t+a,dur*.4);return true}
    /* a clean "ooh" of voices: no buzz, just round tones that swell and sway */
    if(type==="ooh"){const a=Math.max(.25,dur*.3),R=rel||.7,stop=t+dur+R*5*TL,g=gn(),lp=biq("lowpass",1800,.5);lp.connect(g);g.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(peak*.8,t+a,dur*.5);g.gain.setTargetAtTime(0,t+dur,R);
      const o1=osc("sine",f,t,stop,lp),o2=osc("sine",f*1.004,t,stop,lp);let o3=null;if(!LITE){const h=gn(.15);h.connect(lp);o3=osc("sine",f*2,t,stop,h)}vib([o1,o2,o3],t,stop,4.8,.006,.2);return true}
    /* a bowed voice, a cello or a viola played softly: round, not buzzy (a triangle and a sine, a little saw for the bow) */
    if(type==="bow"){const a=Math.min(.22,Math.max(.07,dur*.25)),R=rel||.4,stop=t+dur+R*5*TL,top=Math.min(2600,f*3+300),g=gn(),lp=biq("lowpass",Math.min(1800,f*2),.5);lp.connect(g);g.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(peak*.82,t+a,Math.max(.12,dur*.5));g.gain.setTargetAtTime(0,t+dur,R);
      lp.frequency.setValueAtTime(Math.min(1800,f*2),t);lp.frequency.linearRampToValueAtTime(top,t+a);   // the bow digs in, then sings
      const o1=osc("triangle",f,t,stop,lp),o2=LITE?null:osc("sine",f*1.0025,t,stop,lp),k=gn(.22);k.connect(lp);const o3=osc("sawtooth",f,t,stop,k);
      vib([o1,o2,o3],t,stop,5.3,.0045,.22);return true}
    /* composer 1: a glass harmonica, wet fingers on turning glass bowls. It glows in slowly (80-250 ms, never a strike),
       two near-pure sines a hair apart beat slowly, faint 2nd and 3rd partials shimmer, a whisper of the rub as it starts.
       rel = the release in seconds (default 1). Every layer ends through one gate, so a cut tail can never click. */
    if(type==="glassharp"){const a=Math.min(.25,Math.max(.08,dur*.22)),R=rel||1,end=t+Math.max(dur,a+.02),stop=end+R*6*TL,
        g=gn(),lp=biq("lowpass",Math.min(4800,f*4.5),.4),q=gn();lp.connect(g);g.connect(q);q.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(peak*.8,t+a,Math.max(.3,dur*.6));g.gain.setTargetAtTime(0,end,R);
      q.gain.setValueAtTime(1,stop-.03);q.gain.linearRampToValueAtTime(0,stop);   // the gate
      const os=[osc("sine",f,t,stop,lp)];
      if(!LITE){const k=gn(.38);k.connect(lp);os.push(osc("sine",f*1.0016,t,stop,k));   // the twin: a slow beating glow
        const h2=gn(.06);h2.connect(lp);os.push(osc("sine",f*2.002,t,stop,h2));
        if(f*3<7000){const h3=gn(.022);h3.connect(lp);os.push(osc("sine",f*3.003,t,stop,h3))}
        // the rub: a thin breath of noise at the glass's pitch, only while the note blooms, through its own gate
        const nd=a*4+.2,nb=noiseSrc(t,nd),bp=biq("bandpass",Math.min(2500,f*2),14),ng=gn(0),nq=gn();
        ng.gain.setValueAtTime(0,t);ng.gain.linearRampToValueAtTime(peak*.15,t+a*.8);ng.gain.setTargetAtTime(0,t+a,a*.45);
        nq.gain.setValueAtTime(1,t+nd-.03);nq.gain.linearRampToValueAtTime(0,t+nd);nb.connect(bp);bp.connect(ng);ng.connect(nq);nq.connect(q)}
      vib(os,t,stop,4.3,.0016,.4);return true}
    /* Pond-erful Ruffles' lead: a pan flute, soft pipes. Mostly a pure sine with a little triangle for the pipe's edge;
       each note speaks with a short tonal puff of its octave (no noise burst), and only a faint, dark breath of air at
       the pipe's own pitch rides under it, so nothing hisses or ticks. Every layer ends through one gate. */
    if(type==="panflute"){const a=Math.min(.07,Math.max(.035,dur*.1)),R=rel||.2,end=t+Math.max(dur,a+.03),stop=end+R*6*TL+.05,
        q=gn(),g=gn(),lp=biq("lowpass",Math.min(3200,f*4),.5);lp.connect(g);g.connect(q);q.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(peak*.8,t+a,Math.max(.2,dur*.5));g.gain.setTargetAtTime(0,end,R);
      const o1=osc("sine",f,t,stop,lp),k=gn(.1);k.connect(lp);const o2=osc("triangle",f,t,stop,k);
      if(!GL){for(const o of [o1,o2]){o.frequency.setValueAtTime(f*.992,t);o.frequency.exponentialRampToValueAtTime(f,t+a*1.5)}}   // it blows in a hair flat
      const p2=gn(0);p2.connect(lp);p2.gain.setValueAtTime(0,t);p2.gain.linearRampToValueAtTime(.3,t+a*.6);p2.gain.setTargetAtTime(.05,t+a,.05);const o3=osc("sine",f*2,t,stop,p2);   // the puff
      vib([o1,o2,o3],t,stop,4.8,.004,.35);
      const nb=noiseSrc(t,stop-t),bp=biq("bandpass",Math.min(2200,f),6),ng=gn(0);
      ng.gain.setValueAtTime(0,t);ng.gain.linearRampToValueAtTime(peak*.35,t+a);ng.gain.setTargetAtTime(peak*.08,t+a,.08);ng.gain.setTargetAtTime(0,end,R*.6);
      nb.connect(bp);bp.connect(ng);ng.connect(q);   // the air in the pipe, faint and dark
      q.gain.setValueAtTime(1,stop-.03);q.gain.linearRampToValueAtTime(0,stop);return true}
    /* Infinite Pond's lead: a vibraphone, soft yarn mallets on metal bars. A sine with a faint bar partial near 4x and no
       noise at all (so nothing ticks), a slow motor tremolo that makes every long note breathe, a long ring; the damper
       comes down at the note's end plus rel. Every layer ends through one gate. */
    if(type==="vibes"){const lo=Math.min(1,Math.max(0,(f-130)/1000)),tau=2.6-1.4*lo,end=t+Math.max(dur,.2),R=rel||.6,
        stop=Math.min(t+tau*6*TL,end+R*4*TL)+.08,g=gn(),tr=gn(.8),lp=biq("lowpass",Math.min(4200,f*5),.5),q=gn();lp.connect(g);g.connect(tr);tr.connect(q);q.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.006);g.gain.setTargetAtTime(0,t+.008,tau);g.gain.setTargetAtTime(0,end,R*.35);
      q.gain.setValueAtTime(1,stop-.03);q.gain.linearRampToValueAtTime(0,stop);   // the gate
      osc("sine",f,t,stop,lp);
      if(f*4<7000){const g4=gn(0);g4.connect(lp);g4.gain.setValueAtTime(0,t);g4.gain.linearRampToValueAtTime(peak*(.16-.08*lo),t+.006);g4.gain.setTargetAtTime(0,t+.008,.22);osc("sine",f*4,t,stop,g4)}
      if(!LITE){const l=ac.createOscillator(),d=gn(.2);l.frequency.value=4.2;l.connect(d);d.connect(tr.gain);l.start(t);l.stop(stop)}   // the motor
      return true}
    /* composer 1: a marimba, round bouncy wood. A sine fundamental, a partial near 4x that fades fast, a faint one near
       10x, and a short soft thump of the mallet (filtered noise). Low notes ring longer than high ones. It rings on its
       own like a struck bar: dur hardly matters; rel scales the ring (1 = natural, .5 = damped, 1.8 = long). */
    if(type==="marimba"){const lo=Math.min(1,Math.max(0,(f-110)/900)),sc=rel&&rel>.2?Math.min(2,rel):1,tau=(.58-.4*lo)*sc,
        stop=t+tau*7*TL+.06,g=gn(),lp=biq("lowpass",Math.min(6500,f*11),.5),q=gn();lp.connect(g);g.connect(q);q.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.004);g.gain.setTargetAtTime(0,t+.006,tau);
      q.gain.setValueAtTime(1,stop-.03);q.gain.linearRampToValueAtTime(0,stop);   // the gate
      osc("sine",f,t,stop,lp);
      if(f*3.9<7000){const g4=gn(0);g4.connect(q);g4.gain.setValueAtTime(0,t);g4.gain.linearRampToValueAtTime(peak*(.32-.18*lo),t+.003);g4.gain.setTargetAtTime(0,t+.004,Math.max(.025,tau*.16));osc("sine",f*3.94,t,stop,g4)}
      if(!LITE&&f*9.8<5200){const g10=gn(0);g10.connect(q);g10.gain.setValueAtTime(0,t);g10.gain.linearRampToValueAtTime(peak*.05,t+.003);g10.gain.setTargetAtTime(0,t+.004,.014);osc("sine",f*9.8,t,stop,g10)}
      // the mallet: a soft wooden thump, gone in a few milliseconds, through its own gate
      const nb=noiseSrc(t,.14),bp=biq("bandpass",Math.min(1400,f*1.6+200),1.2),ng=gn(0),nq=gn();
      ng.gain.setValueAtTime(0,t);ng.gain.linearRampToValueAtTime(peak*.1,t+.006);ng.gain.setTargetAtTime(0,t+.007,.012);
      nq.gain.setValueAtTime(1,t+.11);nq.gain.linearRampToValueAtTime(0,t+.14);nb.connect(bp);bp.connect(ng);ng.connect(nq);nq.connect(D);
      return true}
    /* composer 2: a celesta (felt hammers on little steel bars over wooden boxes: a bell-like fundamental with a slow
       shimmer, an octave, a little inharmonic sparkle and a soft felt tick; it rings 1 to 2 s and the damper stops it)
       and an ocarina (round, sine-led with a touch of triangle, a breath at the start and faintly under it, a tiny scoop
       up into the note and a vibrato that comes in late). Every part fades to 0 before it stops, and a gate after the
       envelope ramps the last 30 ms to 0, so a tail cut short never clicks. */
    if(type==="celesta"){const R=rel||.6,ring=Math.max(.35,Math.min(1.5,1.15*Math.pow(523/f,.35))),end=t+Math.max(dur,.3),R2=Math.min(R,ring),stop=end+R2*6*TL+.05,
        q=gn(),g=gn(),lp=biq("lowpass",Math.min(6500,f*7),.5);lp.connect(g);g.connect(q);q.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.003);g.gain.setTargetAtTime(peak*.6,t+.004,.07);g.gain.setTargetAtTime(0,t+.12,ring);g.gain.setTargetAtTime(0,end,R2);
      lp.frequency.setTargetAtTime(Math.min(4200,f*4),t+.01,.25);   // bright as the hammer strikes, then round
      osc("sine",f,t,stop,lp);
      const c2o=gn(0);c2o.connect(q);c2o.gain.setValueAtTime(0,t);c2o.gain.linearRampToValueAtTime(peak*.26,t+.003);c2o.gain.setTargetAtTime(0,t+.005,ring*.33);osc("sine",f*2,t,stop,c2o);   // the octave
      if(!LITE){const c2s=gn(.3);c2s.connect(lp);osc("sine",f*1.0013,t,stop,c2s);   // a twin a hair apart: the slow shimmer of the box
        if(f*2.76<7000){const c2a=gn(0);c2a.connect(q);c2a.gain.setValueAtTime(0,t);c2a.gain.linearRampToValueAtTime(peak*.07,t+.003);c2a.gain.setTargetAtTime(0,t+.004,.11);osc("sine",f*2.76,t,stop,c2a)}
        if(f*4.17<7000){const c2b=gn(0);c2b.connect(q);c2b.gain.setValueAtTime(0,t);c2b.gain.linearRampToValueAtTime(peak*.045,t+.002);c2b.gain.setTargetAtTime(0,t+.003,.045);osc("sine",f*4.17,t,stop,c2b)}}   // the sparkle
      const c2n=noiseSrc(t,.2),c2bp=biq("bandpass",Math.min(2000,f*4),1.2),c2ng=gn(0);c2ng.gain.setValueAtTime(0,t);c2ng.gain.linearRampToValueAtTime(peak*.08,t+.006);c2ng.gain.setTargetAtTime(0,t+.007,.012);
      c2n.connect(c2bp);c2bp.connect(c2ng);c2ng.connect(q);   // the felt hammer's tick
      q.gain.setValueAtTime(1,stop-.03);q.gain.linearRampToValueAtTime(0,stop);return true}
    if(type==="ocarina"){const R=rel||.15,a=Math.min(.09,Math.max(.04,dur*.12)),end=t+Math.max(dur,a+.03),stop=end+R*6*TL+.05,
        q=gn(),g=gn(),lp=biq("lowpass",Math.min(5000,f*6),.5);lp.connect(g);g.connect(q);q.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(peak*.85,t+a,Math.max(.15,dur*.4));g.gain.setTargetAtTime(0,end,R);
      lp.frequency.setTargetAtTime(Math.min(3600,f*3.2),t+a,.12);   // the breath's first push is a little brighter
      const scoop=!GL,c2o1=osc("sine",f,t,stop,lp),c2k=gn(.2);c2k.connect(lp);const c2o2=osc("triangle",f,t,stop,c2k);
      if(scoop)for(const o of [c2o1,c2o2]){o.frequency.setValueAtTime(f*.988,t);o.frequency.exponentialRampToValueAtTime(f,t+a*1.3)}   // it blows in a hair flat
      let c2o3=null;if(!LITE){const c2h=gn(.05);c2h.connect(lp);c2o3=osc("sine",f*2,t,stop,c2h);if(scoop){c2o3.frequency.setValueAtTime(f*2*.988,t);c2o3.frequency.exponentialRampToValueAtTime(f*2,t+a*1.3)}}
      vib([c2o1,c2o2,c2o3],t,stop,5.1,.0055,.4);
      const c2n=noiseSrc(t,stop-t),c2bp=biq("bandpass",Math.min(2000,f*2.3),1.6),c2ng=gn(0);
      c2ng.gain.setValueAtTime(0,t);c2ng.gain.linearRampToValueAtTime(peak*.5,t+a*.5);c2ng.gain.setTargetAtTime(peak*.12,t+a*.6,.05);c2ng.gain.setTargetAtTime(0,end,R*.7);
      c2n.connect(c2bp);c2bp.connect(c2ng);c2ng.connect(q);   // breath: a puff at the start, faintly under the note
      q.gain.setValueAtTime(1,stop-.03);q.gain.linearRampToValueAtTime(0,stop);return true}
    /* the harp, as the game's harp sounds, with a gate after its envelope: on a phone (shorter tails) its fast ripples
       and chords never end in a tick */
    if(type==="c2_harp"){const R=rel||.9,stop=t+R*6*TL+.05,q=gn(),g=gn(),lp=biq("lowpass",3400,.5);lp.connect(g);g.connect(q);q.connect(D);env(g,t,.004,peak,.01,R);
      osc("triangle",f,t,stop,lp);if(!LITE){const h=gn(.3);h.connect(lp);osc("sine",f*2,t,stop,h)}lp.frequency.setTargetAtTime(1200,t+.02,.4);
      q.gain.setValueAtTime(1,stop-.03);q.gain.linearRampToValueAtTime(0,stop);return true}
    /* composer 3: a kalimba, a thumb on a metal tine over a little wooden box. A sine fundamental that settles a hair
       from sharp as the tine is let go, a partial near 6x that is gone in a few tens of milliseconds, a faint twin for the
       box's warmth, a soft woody thump of the box and the barest touch of the thumb. It rings on its own like a tine:
       dur hardly matters; rel scales the ring (1 = natural, .5 = damped, 2 = long). Low tines ring longer. Every layer
       ends through one gate, so a tail cut short can never click. */
    if(type==="kalimba"){const lo=Math.min(1,Math.max(0,(f-130)/1000)),sc=rel&&rel>.2?Math.min(2.2,rel):1,tau=(.42-.2*lo)*sc,
        stop=t+tau*7*TL+.08,q=gn(),g=gn(),lp=biq("lowpass",Math.min(6000,f*7),.5);lp.connect(g);g.connect(q);q.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.004);g.gain.setTargetAtTime(peak*.6,t+.005,.05);g.gain.setTargetAtTime(0,t+.09,tau);
      q.gain.setValueAtTime(1,stop-.03);q.gain.linearRampToValueAtTime(0,stop);   // the gate
      lp.frequency.setTargetAtTime(Math.min(3000,f*3),t+.01,.12);   // the pluck's brightness fades into the wood
      const c3o=osc("sine",f,t,stop,lp);if(!GL){c3o.frequency.setValueAtTime(f*1.006,t);c3o.frequency.exponentialRampToValueAtTime(f,t+.045)}
      if(!LITE){const c3k=gn(.16);c3k.connect(lp);osc("sine",f*1.0011,t,stop,c3k)}   // the box's slow warmth
      if(f*5.93<7000){const c3h=gn(0);c3h.connect(q);c3h.gain.setValueAtTime(0,t);c3h.gain.linearRampToValueAtTime(peak*(.24-.12*lo),t+.003);c3h.gain.setTargetAtTime(0,t+.004,.03+.02*(1-lo));osc("sine",f*5.93,t,stop,c3h)}   // the tine's ping
      if(!LITE&&f*2.98<6000){const c3h3=gn(0);c3h3.connect(q);c3h3.gain.setValueAtTime(0,t);c3h3.gain.linearRampToValueAtTime(peak*.05,t+.003);c3h3.gain.setTargetAtTime(0,t+.004,.09);osc("sine",f*2.98,t,stop,c3h3)}
      // the box: a soft hollow thump of wood, and the thumb leaving the tine, through their own gate
      const c3n=noiseSrc(t,.16),c3bp=biq("bandpass",260+f*.15,1.6),c3ng=gn(0),c3nq=gn();
      c3ng.gain.setValueAtTime(0,t);c3ng.gain.linearRampToValueAtTime(peak*.3,t+.006);c3ng.gain.setTargetAtTime(0,t+.007,.02);
      c3nq.gain.setValueAtTime(1,t+.13);c3nq.gain.linearRampToValueAtTime(0,t+.16);c3n.connect(c3bp);c3bp.connect(c3ng);c3ng.connect(c3nq);c3nq.connect(D);
      return true}
    /* composer 3, for "What the duck?": horror textures. wtd_box is a tired wind-up music box, a few cents flat, its pitch
       wobbling slowly (vib_ may be {det:cents flat, wob:depth, rate:Hz, bend:cents, at:s, back:s} for a sag that may come
       back). wtd_violin is a lone, thin violin that swells through each note. wtd_drone is two low sines a few cents
       apart, slowly beating, with a ghost a half step up (an octave higher) that fades in and out. wtd_whine is a wet
       finger on a glass rim, rising a hair into tune. wtd_knock is a soft knock behind a door. wtd_breath is a breath
       drawn in, like a sigh played backwards. Every one ends through a gate. */
    if(type==="wtd_box"){const o=vib_&&typeof vib_==="object"?vib_:{},R=rel||.9,end=t+Math.max(dur,.4),stop=end+R*6*TL,q=gn(),g=gn();g.connect(q);q.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.012);g.gain.setTargetAtTime(peak*.4,t+.025,.35);g.gain.setTargetAtTime(0,end,R);
      q.gain.setValueAtTime(1,stop-.03);q.gain.linearRampToValueAtTime(0,stop);
      const f0=f*Math.pow(2,-(o.det!=null?o.det:7)/1200),os=[osc("sine",f0,t,stop,g)];
      const g2=gn(0);g2.connect(q);env(g2,t,.01,peak*.16,.02,.22);os.push(osc("sine",f0*2.003,t,stop,g2));
      if(!LITE){const g3=gn(0);g3.connect(q);env(g3,t,.008,peak*.05,.01,.12);os.push(osc("sine",f0*3.98,t,stop,g3));
        const h=gn(0);h.connect(q);h.gain.setValueAtTime(0,t);h.gain.linearRampToValueAtTime(peak*.18,t+.35);h.gain.setTargetAtTime(0,end,R*1.2);os.push(osc("triangle",f0*1.006,t,stop,h))}   // a halo a little out of tune
      const l=ac.createOscillator();l.frequency.value=o.rate||.55;l.start(t);l.stop(stop);   // the spring is tired: a slow wobble
      for(const x of os){const w=gn(x._f*(o.wob!=null?o.wob:.0045));l.connect(w);w.connect(x.frequency);
        if(o.bend){x.frequency.setTargetAtTime(x._f*Math.pow(2,o.bend/1200),t+(o.at||.2),o.tc||.15);if(o.back)x.frequency.setTargetAtTime(x._f,t+o.back,.1)}}
      return true}
    if(type==="wtd_violin"){const a=Math.min(.35,Math.max(.12,dur*.22)),R=rel||.5,end=t+Math.max(dur,a+.06),stop=end+R*6*TL,q=gn(),g=gn(),lp=biq("lowpass",Math.min(3400,f*3.2),.6);
      lp.connect(g);g.connect(q);q.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak*.62,t+a);g.gain.linearRampToValueAtTime(peak,t+Math.max(a+.05,(end-t)*.6));g.gain.setTargetAtTime(0,end,R);   // in softly, aching louder through the note
      q.gain.setValueAtTime(1,stop-.03);q.gain.linearRampToValueAtTime(0,stop);
      const k1=gn(.24);k1.connect(lp);const o1=osc("sawtooth",f,t,stop,k1),k2=gn(.8);k2.connect(lp);const o2=osc("triangle",f*1.0015,t,stop,k2);let o3=null;
      if(!LITE){const k3=gn(.35);k3.connect(lp);o3=osc("sine",f*.9985,t,stop,k3)}
      vib([o1,o2,o3],t,stop,5.4,.0068,.3);return true}
    if(type==="wtd_drone"){const a=Math.min(4,Math.max(.8,dur*.3)),R=rel||2.5,end=t+Math.max(dur,a+.1),stop=end+R*6*TL,L=end-t,q=gn(),g=gn(),lp=biq("lowpass",Math.min(900,f*5),.6);
      lp.connect(g);g.connect(q);q.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(0,end,R);
      q.gain.setValueAtTime(1,stop-.03);q.gain.linearRampToValueAtTime(0,stop);
      osc("sine",f,t,stop,lp);const k=gn(.8);k.connect(lp);osc("sine",f*1.0035,t,stop,k);   // a few cents apart: a slow, seasick beating
      if(!LITE){const h=gn(.1);h.connect(lp);osc("triangle",f*2.003,t,stop,h)}
      const gh=gn(0);gh.connect(q);gh.gain.setValueAtTime(0,t);gh.gain.setValueAtTime(0,t+L*.3);gh.gain.linearRampToValueAtTime(peak*.16,t+L*.52);gh.gain.linearRampToValueAtTime(0,t+L*.8);   // the ghost, a half step up
      osc("sine",f*Math.pow(2,13/12),t,stop,gh);return true}
    if(type==="wtd_whine"){const a=Math.max(.5,dur*.35),R=rel||1.2,end=t+Math.max(dur,a+.1),stop=end+R*6*TL,q=gn(),g=gn(),lp=biq("lowpass",Math.min(5000,f*3),.5);
      lp.connect(g);g.connect(q);q.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(peak*.7,t+a,dur*.4);g.gain.setTargetAtTime(0,end,R);
      q.gain.setValueAtTime(1,stop-.03);q.gain.linearRampToValueAtTime(0,stop);
      const os=[osc("sine",f,t,stop,lp)];if(!LITE){const k=gn(.5);k.connect(lp);os.push(osc("sine",f*1.0021,t,stop,k));const h=gn(.04);h.connect(lp);os.push(osc("sine",f*2.001,t,stop,h))}
      for(const x of os){x.frequency.setValueAtTime(x._f*.984,t);x.frequency.exponentialRampToValueAtTime(x._f,t+(end-t)*.6)}   // a wet finger, creeping into tune
      vib(os,t,stop,3.2,.0025,.6);return true}
    if(type==="wtd_knock"){const fr=f||110,stop=t+.45,q=gn(),lp=biq("lowpass",650,.7);lp.connect(q);q.connect(D);
      q.gain.setValueAtTime(1,stop-.03);q.gain.linearRampToValueAtTime(0,stop);
      const g=gn(0);g.connect(lp);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.004);g.gain.setTargetAtTime(0,t+.007,.04);
      const o=osc("sine",fr*1.6,t,stop,g);o.frequency.exponentialRampToValueAtTime(fr,t+.035);
      const n=noiseSrc(t,.25),bp=biq("bandpass",420,1.3),ng=gn(0);ng.gain.setValueAtTime(0,t);ng.gain.linearRampToValueAtTime(peak*.7,t+.003);ng.gain.setTargetAtTime(0,t+.005,.016);
      n.connect(bp);bp.connect(ng);ng.connect(lp);return true}
    if(type==="wtd_breath"){const L=Math.max(.6,dur),R=rel||.22,stop=t+L+R*7,q=gn(),g=gn(0),bp=biq("bandpass",f*.7,1.8),lp=biq("lowpass",2400,.5);
      noiseSrc(t,stop-t).connect(bp);bp.connect(lp);lp.connect(g);g.connect(q);q.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak*.03,t+L*.2);g.gain.exponentialRampToValueAtTime(peak,t+L);g.gain.setTargetAtTime(0,t+L,R);   // drawn in, then gone
      bp.frequency.setValueAtTime(f*.7,t);bp.frequency.linearRampToValueAtTime(f*1.3,t+L);
      q.gain.setValueAtTime(1,stop-.03);q.gain.linearRampToValueAtTime(0,stop);return true}
    return false}
  function note(type,f,t,dur,peak,rel,vib_){if(voice(type,f,t,dur,peak,rel,vib_))return;const o=ac.createOscillator(),g=ac.createGain();if(type==="pulse")o.setPeriodicWave(pulseWave());else o.type=type;o.frequency.setValueAtTime(f,t);
    if(vib_){const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=5.2;lg.gain.value=f*.007;l.connect(lg).connect(o.frequency);l.start(t);l.stop(t+dur+.6)}
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.012);g.gain.setTargetAtTime(peak*.6,t+.05,.09);g.gain.setTargetAtTime(0,t+Math.max(.05,dur-.06),rel||.05);
    o.connect(g).connect(DST);o.start(t);o.stop(t+dur+.6)}
  function pad(f,t,dur,peak){const o=ac.createOscillator(),g=ac.createGain();o.type="triangle";o.frequency.setValueAtTime(f,t);o.detune.setValueAtTime(-6+Math.random()*12,t);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+Math.min(.9,dur*.4));g.gain.setTargetAtTime(0,t+dur*.8,dur*.18);o.connect(g).connect(DST);o.start(t);o.stop(t+dur*1.6)}
  function drip(t,f){const o=ac.createOscillator(),g=ac.createGain();o.type="sine";o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*1.5,t+.08);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09,t+.005);g.gain.setTargetAtTime(0,t+.02,.07);o.connect(g).connect(DST);o.start(t);o.stop(t+.5)}
  function clank(t){const b=ac.createBuffer(1,Math.floor(ac.sampleRate*.3),ac.sampleRate),d=b.getChannelData(0);for(let k=0;k<d.length;k++)d[k]=(Math.random()*2-1)*Math.pow(1-k/d.length,6);
    const s=ac.createBufferSource(),bp=ac.createBiquadFilter(),g=ac.createGain();bp.type="bandpass";bp.frequency.value=2600+Math.random()*1800;bp.Q.value=14;g.gain.value=.5;s.buffer=b;s.connect(bp).connect(g).connect(DST);s.start(t);
    const f=180+Math.random()*240;voice("fmbell",f,t,.3,.035,.2,false)}
  function hit(t,kind){if(kind==="snare"||kind==="static"){const len=kind==="snare"?.2:1.3,b=ac.createBuffer(1,Math.floor(ac.sampleRate*len),ac.sampleRate),d=b.getChannelData(0);
      for(let k=0;k<d.length;k++)d[k]=(Math.random()*2-1)*(kind==="snare"?Math.pow(1-k/d.length,4):Math.sin(Math.PI*k/d.length)*(.6+.4*Math.sin(k/900)));
      const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();f.type="bandpass";f.frequency.value=kind==="snare"?1800:3200;f.Q.value=kind==="snare"?.8:.6;g.gain.value=kind==="snare"?.22:.045;
      s.buffer=b;s.connect(f).connect(g).connect(DST);s.start(t);return}
    const len=kind==="tick"?.04:.12,b=ac.createBuffer(1,Math.floor(ac.sampleRate*len),ac.sampleRate),d=b.getChannelData(0);
    for(let k=0;k<d.length;k++)d[k]=(Math.random()*2-1)*Math.pow(1-k/d.length,kind==="tick"?1:3);
    const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();f.type=kind==="tick"?"highpass":"lowpass";f.frequency.value=kind==="tick"?2500:kind==="soft"?140:180;g.gain.value=kind==="kick"?.5:kind==="soft"?.3:.06;
    s.buffer=b;s.connect(f).connect(g).connect(DST);s.start(t)}
  /* v59 percussion and textures */
  function thump(t,v,f,dec,a){const o=ac.createOscillator(),g=gn(0);o.frequency.setValueAtTime(f*(a?1.3:1.7),t);o.frequency.exponentialRampToValueAtTime(f,t+.07);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+(a||.006));g.gain.setTargetAtTime(0,t+.02,dec||.09);o.connect(g);g.connect(DST);o.start(t);o.stop(t+.8)}
  // a knock and a brush: they come in over a few milliseconds and fade out fully before their noise stops (a sharper edge crackled)
  function wood(t,v){const s=noiseSrc(t,.09),b=biq("bandpass",1300+Math.random()*500,6),g=gn(0);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*2.4,t+.005);g.gain.setTargetAtTime(0,t+.006,.012);s.connect(b).connect(g).connect(DST)}
  function brush(t,v){const s=noiseSrc(t,.5),b=biq("bandpass",3400,.6),g=gn(0);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.025);g.gain.setTargetAtTime(0,t+.04,.07);s.connect(b).connect(g).connect(DST)}
  /* a sound that travels from one ear to the other while it plays */
  function panTo(a,b,t,dur,rv,ds){const p=ac.createStereoPanner();p.pan.setValueAtTime(a,t);p.pan.linearRampToValueAtTime(b,t+dur);p.connect(send(rv,ds));return p}
  /* wind through an empty street, far off */
  function wind(t,dur,v,p0,p1){const s=noiseSrc(t,dur+1),b=biq("bandpass",400,4),g=gn(0),p=ac.createStereoPanner();
    b.frequency.setValueAtTime(300+300*rnd(),t);b.frequency.linearRampToValueAtTime(700+500*rnd(),t+dur*.6);b.frequency.linearRampToValueAtTime(350,t+dur);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+dur*.5);g.gain.linearRampToValueAtTime(0,t+dur);p.pan.setValueAtTime(p0,t);p.pan.linearRampToValueAtTime(p1,t+dur);
    s.connect(b).connect(g).connect(p).connect(send(.8,.1))}
  /* a bed of soft hiss under the whole song (there was a needle's crackle in it too, from Ether's Crossroads: in Duck
     Friends it was heard as the music crackling, so it's gone) */
  function stopBeds(){if(!ac)return;const t=ac.currentTime;for(const {s,g} of BEDS){g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(0,t,.08);try{s.stop(t+.6)}catch(e){}}BEDS=[]}
  function startBed(t,dur,h){if(!h)return;const s=ac.createBufferSource();s.buffer=noiseBuf();s.loop=true;const b=biq("bandpass",3400,.45),g=gn(0);s.connect(b);b.connect(g);g.connect(BUS.fx);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(h,t+1.2);g.gain.setValueAtTime(h,t+Math.max(1.3,dur-1.5));g.gain.linearRampToValueAtTime(0,t+dur);s.start(t,Math.random()*2);s.stop(t+dur+.05);BEDS.push({s,g})}
  /* a song's notes laid out in time, each with its own loudness: a phrase rises and falls, its last note fades, a higher
     note leans out a little, every other phrase may answer more softly (contrast) */
  function build(T){let s=0;const ev=[];for(const [m,l,v,tag] of T.mel){if(m!=null)ev.push({m:Array.isArray(m)?m:[m],s,l,v:v==null?1:v,tag:tag||"",vel:1,tail:false});s+=l}
    const total=Math.round(s),phs=[];let ph=[];
    ev.forEach((e,k)=>{ph.push(e);const nx=ev[k+1];if(!nx||nx.s-(e.s+e.l)>=.99||e.l>=4||ph.length>=10){phs.push(ph);ph=[]}});
    const c=T.dyn||0;
    phs.forEach((p,pi)=>{const mean=p.reduce((a,e)=>a+e.m[0],0)/p.length;p.forEach((e,k)=>{const q=p.length>1?k/(p.length-1):.5,last=k===p.length-1;e.tail=last;
      if(!c){e.vel=e.v;return}
      const shape=.55+.45*Math.sin(Math.PI*(.12+.76*q)),contour=Math.max(.8,Math.min(1.2,1+(e.m[0]-mean)/24)),fall=last&&p.length>1?.62:1,jit=.82+.18*rnd(),alt=pi%2&&T.contrast?T.contrast:1;
      e.vel=e.v*(1-c+c*shape*contour*fall*jit)*alt})});
    let dur=0;for(let st=0;st<total;st++){const ab=Math.floor(st/T.bar);dur+=60/T.bpm/2/(T.tempo?T.tempo(ab%T.chords.length,st%T.bar,ab):1)}
    ev.total=total;ev.dur=dur;return ev}
  function load(i,now,seed){T=TRACKS[i];last=i;step=0;ei=0;prevF=null;SEED=seed!=null?seed>>>0:FIXED?7919*(i+1):(Math.random()*4294967296)>>>0;EV=build(T);total=EV.total;stopBeds();if(ac)room(now)}
  /* one note of the melody, played: its loudness, a slide from the last note, a sag when the song falls apart, a breath
     that falls away; its own send into the room and the delay (more at a phrase's end, so the end floats off) */
  function playLead(e,t,E8,x){t=Math.max(t,ac.currentTime);const air=e.tag.includes("a"),ty=air?"air":T.leadFor?T.leadFor(x.abs):T.lead;let d=e.l*E8*(T.leg||.93),cut=false;
    if(T.cut&&!air&&e.l>=2&&rnd()<T.cut){d=E8*(.7+rnd()*.5);cut=true}   // broken off where you don't expect it
    const sag=T.drift?T.drift(x.bar):0;if(sag)d*=1.3;
    const rv=(T.rv||0)*(e.tail?1.8:1)*(air?2.4:1)*(sag?2:1),ds=(T.ds||0)*(e.tail||air?2.4:.3);
    const n=send(rv,ds,BUS.lead);on(n);
    for(const m of e.m){const f=hz(m);GL=null;
      if(air)GL={r:1,fall:Math.pow(2,-(35+rnd()*60)/1200),ft:.12,fd:d*.5};
      else if(sag)GL={r:1,fall:Math.pow(2,-(sag*(.6+rnd()*.8))/1200),ft:.05,fd:d*.5};
      else if(T.glide&&prevF&&e.m.length===1){const st=12*Math.log2(f/prevF);GL={r:Math.abs(st)<=5?prevF/f:Math.pow(2,-25/1200),d:Math.min(.11,d*.3)}}
      note(ty,f,t,d,(T.leadVFor?T.leadVFor(x.abs):T.leadV)*e.vel,T.rel!=null?T.rel:.05,T.vib)}
    GL=null;if(e.m.length===1&&!air)prevF=hz(e.m[0]);
    if((T.swipe&&e.tag.includes("s"))||cut){const p=BUS.leadLP.frequency;p.setTargetAtTime(230,t+d*.6,.05);p.setTargetAtTime(16000,t+d+E8*(.8+rnd()),.3)}   // swept away, and back
    if(T.onNote)T.onNote(e,t,E8,x)}
  let RENDER=false,FIXED=false;
  function tick(until){if(!playing||!ac)return;
    if(!RENDER){follow();if(!LIVE)return}
    while(next<(until!=null?until:ac.currentTime+.4)){
      const abs=Math.floor(step/T.bar),bar=abs%T.chords.length,i=step%T.bar,C=T.chords[bar],root=C.b,third=C.third,fifth=C.fifth;
      const E8=60/T.bpm/2/(T.tempo?T.tempo(bar,i,abs):1),x={t:next,bar,abs,i,E8,C,step};
      if(MUTE!=="rest"){
        if(step===0&&T.bed)startBed(next,EV.dur+1,T.bed);
        if(i===0&&T.swell){const P=T.swellP||4,ph=(abs%P)/P;BUS.swl.gain.setTargetAtTime(1-T.swell+T.swell*Math.sin(Math.PI*(ph+.5/P)),next,E8*T.bar*.5)}   // the whole song breathes
        on(BUS.bass);GL=null;
        if(T.bass==="arp")note("triangle",hz(root+[0,fifth,12,fifth,12+third,fifth,12,fifth][i]-12),next,E8*.9,.5);
        else if(T.bass==="softarp")voice("softtri",hz(root+[0,fifth,12,fifth,12+third,fifth,12,fifth][i]-12),next,E8*1.4,[.3,.16,.22,.16,.26,.16,.22,.16][i],.35);
        else if(T.bass==="slowarp"){if(i%2===0)note("triangle",hz(root+[0,fifth,12,fifth][i/2%4]-12),next,E8*1.9,.45,.12)}
        else if(T.bass==="slowsoft"){if(i%2===0)voice("softtri",hz(root+[0,fifth,12,fifth][i/2%4]-12),next,E8*2.6,[.32,.2,.26,.2][i/2%4],.5)}
        else if(T.bass==="walk")note("triangle",hz(root+[0,0,fifth,12,10,fifth,3,fifth][i]-12),next,E8*.8,.5);
        else if(T.bass==="waltz"){if(i===0)note("triangle",hz(root-12),next,E8*1.8,.55,.1);else if(i===2||i===4){note("triangle",hz(root+third),next,E8*.9,.22);note("triangle",hz(root+fifth),next,E8*.9,.22)}}
        else if(T.bass==="drone"&&i===0){note("triangle",hz(root-12),next,E8*T.bar,.42,.4);note("sine",hz(root-5),next,E8*T.bar,.18,.4)}
        else if(T.bass==="pad"&&i===0){const d=E8*T.bar;note("triangle",hz(root-12),next,d,.36,.5);for(const v of [0,third,fifth])pad(hz(root+v),next,d,.07)}
        else if(T.bass==="chordpad"&&i===0){const d=E8*T.bar;note("sine",hz(root-12),next,d,.26,.6);for(const v of C.iv)pad(hz(C.r+v),next,d*1.1,.045)}
        else if(T.bass==="sub"){if(i===0||i===4)note("sine",hz(root-24),next,E8*3.6,.6,.25);if(i===6)note("sine",hz(root-12),next,E8*.9,.3)}
        else if(T.bass==="choirpad"&&i===0){const d=E8*T.bar;note("sine",hz(root-12),next,d,.32,.5);for(const v of C.iv)voice("choir",hz(root+v),next,d,.035,.5,false)}}
      if(MUTE!=="lead")while(ei<EV.length&&EV[ei].s<step+1-1e-6){const e=EV[ei++];playLead(e,next+(e.s-step)*E8+(T.hum?(rnd()*2-1)*T.hum:0),E8,x)}
      if(MUTE!=="rest"){
        on(BUS.perc);GL=null;const D=(T.drum||"").split(" "),has=k=>D.includes(k);
        if(has("tick")&&i===4)hit(next,"tick");if((has("kick")||has("both"))&&(i===0||i===4))hit(next,"kick");if(has("both")&&(i===2||i===6))hit(next,"tick");
        if(has("brush")&&i===4)brush(next,.03);
        if(has("heart")&&i===0)hit(next,"kick");if(has("heart")&&i===1)hit(next+E8*.15,"soft");
        if(has("drip")&&(step*7)%23===3)drip(next,hz(84+(step*5)%7));
        if(has("trip")){if(i===0||i===5&&bar%2)hit(next,"kick");if(i===4)hit(next,"snare");if(i%2===1)hit(next,"tick")}   // a slow, dragging beat
        if(has("metal")&&(i===3||i===7)&&((step*11+bar*3)%5===0))clank(next);   // iron struck somewhere in the dark
        if(has("static")&&i===0&&(bar*7)%3===1)hit(next,"static");   // a radio that won't quite tune
        if(T.step)T.step(x);if(i===0&&T.onBar)T.onBar(x);GL=null}
      next+=E8;step++;
      if(step>=total){if(!RENDER)LIVE=false;return}}   // the song ends (the room's list says what comes after it)
  }
  const GAP=20;
  /* the next song: a random pick that leans away from the songs heard most recently (each song's chance grows with the
     minutes since it was last heard); never the same song twice in a row while there is another, and never a song the
     room turned off (song off on the command line) */
  const HKEY="duckfriends-music",names=TRACKS.map(t=>t.name),idx=n=>names.indexOf(n);
  const heard=()=>{try{const h=JSON.parse(localStorage.getItem(HKEY)||"{}");return h&&typeof h==="object"&&!Array.isArray(h)?h:{}}catch(e){return {}}};
  /* What the duck? is the rare one: once in three rounds of all the other songs, between two songs of the third round */
  const RARE=names.indexOf("What the duck?"),RKEY="duckfriends-music-rare",RN=names.length-1,
    rare=()=>{let r=null;try{r=JSON.parse(localStorage.getItem(RKEY)||"null")}catch(e){}return r&&typeof r.n==="number"&&typeof r.at==="number"?r:{n:0,at:2*RN+1+Math.floor(Math.random()*Math.max(1,RN-1))}},
    keepRare=r=>{try{localStorage.setItem(RKEY,JSON.stringify(r))}catch(e){}};
  function pick(avoid,off){const h=heard(),now=Date.now(),age=n=>h[n]?Math.max(1,(now-h[n])/60000):1e7,on=i=>!(off&&off.has(names[i]));
    const keep=i=>{h[names[i]]=now;try{localStorage.setItem(HKEY,JSON.stringify(h))}catch(e){}return i};
    if(RARE>=0&&on(RARE)){const r=rare();
      if(r.n>=r.at&&avoid!==RARE){keepRare({n:0,at:2*RN+1+Math.floor(Math.random()*Math.max(1,RN-1))});return keep(RARE)}
      r.n++;keepRare(r)}
    const pool=names.map((n,i)=>i).filter(i=>i!==RARE&&on(i));if(!pool.length)return RARE>=0&&on(RARE)?keep(RARE):-1;   // (only the rare one left on: it plays)
    let best=-1,bk=-1;for(const i of pool){if(pool.length>1&&i===avoid)continue;const k=Math.pow(Math.random(),1/Math.log(2+age(names[i])));if(k>bk){bk=k;best=i}}
    return keep(best)}
  const newSeed=()=>(Math.random()*4294967296)>>>0;
  /* how long a song is (the same on every device: its notes and its tempo, nothing left to chance) */
  const DUR={};
  function durOf(i){if(DUR[i]==null){const k=SEED;DUR[i]=build(TRACKS[i]).dur;SEED=k}return DUR[i]}

  /* ---------- everyone in a room hears the same song at the same moment ----------
     The host keeps the room's songs in the state (s.music): the song now (a) and the one after it (b), each a name, its
     start in the server's time (clock.js) and a seed, so its little chances (a note's loudness, a harp's run) come out
     the same everywhere. b starts 20 seconds after a ends; once b has begun, it becomes a and the host picks a new b.
     Every device plays whichever song should be sounding, from where it should be by now: so a page hidden or muted for a
     while comes back to the song where everyone else is, not where it left off. A song turned off stops at once and the
     next one comes in 3 seconds. A room whose host has no song list (an older page) plays this device's own picks. */
  let LOC=null,noListAt=0,PRE=null;
  const end=e=>e.at+durOf(idx(e.n))*1000;
  function plan(S,t){const off=new Set(S&&S.off||[]),ok=n=>idx(n)>=0&&!off.has(n);
    let a=S&&S.a||null,b=S&&S.b||null;const was=JSON.stringify([a,b]);
    if(a&&idx(a.n)<0)a=null;
    if(a&&!ok(a.n)&&t<end(a)){a=null;if(b)b={...b,at:Math.min(b.at,t+3000)}}
    if(b&&!ok(b.n))b=null;
    if(b&&(!a||t>=b.at)){a=b;b=null}
    if(!a){if(PRE&&ok(PRE.n))a={n:PRE.n,at:t+1500,seed:PRE.seed};else{const i=pick(-1,off);if(i>=0)a={n:names[i],at:t+1500,seed:newSeed()}}PRE=null}   // the first song: the one written out since the page opened
    if(a&&!b){const i=pick(idx(a.n),off);if(i>=0)b={n:names[i],at:Math.round(Math.max(end(a),t)+GAP*1000),seed:newSeed()}}
    return JSON.stringify([a,b])===was?null:{a,b}}
  function list(){const r=activeRoom(),s=r&&r.state;if(!s)return null;return s.music||LOC}
  /* the host keeps the list going (every second, whether or not it plays music itself) */
  function conduct(){const r=activeRoom(),s=r&&r.state;if(!s){LOC=null;noListAt=0;return}const t=clockNow();
    if(s.hostId===r.me){const m=plan(s.music,t);if(m)r.send({t:"music",a:m.a,b:m.b});LOC=null}
    else if(s.music){LOC=null;noListAt=0}
    else{if(!noListAt)noListAt=t;if(t-noListAt>4000){const m=plan(LOC,t);if(m)LOC={...m,off:[]}}}
    if(LV()>0&&!profile.settings.musicMute)ahead_(list())}
  setInterval(conduct,1000);
  /* the song that should be sounding now: the first on the list that hasn't ended (it may not have begun) */
  function wantOf(S,t){for(const e of [S.a,S.b])if(e&&idx(e.n)>=0&&t<end(e))return e;return null}
  const same=(x,y)=>!!x&&!!y&&x.n===y.n&&x.at===y.at&&x.seed===y.seed;
  let CUR=null,LIVE=false,ANC=null;   // the song this device plays, whether it is played live, and when it began (in both clocks)
  function follow(){const S=list();if(!S)return;
    if(ac.state!=="running"){if(CUR)drop(true);return}   // (a sleeping audio clock doesn't move: start again once it runs)
    const t=clockNow(),e=wantOf(S,t);
    if(same(e,CUR)&&ANC&&Math.abs((ac.currentTime-ANC.ac)-(t-ANC.t)/1000)<.3)return;   // playing, and still in step with everyone
    if(CUR)drop(t<end(CUR));
    CUR=e;if(!e)return;
    const dt=(e.at-t)/1000,r=REN.get(key(e));ANC={ac:ac.currentTime,t};   // dt: seconds until it starts (below 0: it began that long ago)
    if(r&&r.buf)playBuf(r,ac.currentTime+Math.max(.1,dt),Math.max(0,-dt-.1));
    else{load(idx(e.n),true,e.seed);seek(ac.currentTime+dt);LIVE=step<total}}
  /* stop the song this device plays: cut short, it fades away; ended, its last notes ring out */
  function drop(cut){if(BUF&&cut)fadeOut(BUF);BUF=null;if(LIVE)stopBeds();LIVE=false;CUR=null;ANC=null}
  /* a song played live from part way: the notes already gone by are skipped */
  function seek(t0){next=t0;const lim=ac.currentTime+.1;
    while(next<lim&&step<total){const abs=Math.floor(step/T.bar),bar=abs%T.chords.length;next+=60/T.bpm/2/(T.tempo?T.tempo(bar,step%T.bar,abs):1);step++}
    while(ei<EV.length&&EV[ei].s<step-1e-6)ei++;
    if(step>0&&step<total&&T.bed)startBed(next,Math.max(2,EV.dur*(1-step/total)+1),T.bed)}
  function start(){if(playing)return;if(!ctx())return;if(ac.state==="suspended")ac.resume();playing=true;
    level(.8);timer=setInterval(tick,90);tick()}
  function stop(){if(!playing)return;playing=false;clearInterval(timer);timer=null;if(!ac)return;if(CUR)drop(true);stopBeds();level(.3,0)}
  function level(tc,v){const t=ac.currentTime;for(const g of [out,bout]){g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(v==null?LV():v,t,tc)}}
  // in a room (the lobby or the game), with the music on and the page in view
  const wanted=()=>LV()>0&&!profile.settings.musicMute&&!document.hidden&&["lobby","game"].includes(document.body.dataset.screen);
  function sync(){if(wanted()){if(ac||started)start()}else stop();if(ac&&playing)level(.15)}
  let started=false;   // a click or a key has happened, so the browser lets sound start
  const wake=()=>{started=true;if(!wanted())return;if(!playing)start();else if(ac&&ac.state!=="running")ac.resume()};
  addEventListener("pointerdown",wake,true);
  addEventListener("keydown",wake,true);
  document.addEventListener("visibilitychange",sync);
  document.addEventListener("settings",sync);
  document.addEventListener("screen",sync);
  /* one song written out to an audio buffer: to listen to a song outside the game (fixed, the same each time), or, on a
     computer, the next song ahead of time (new each time) */
  const ST=()=>[ac,out,bout,BUS,CACHE,BEDS,DST,GL,T,last,step,ei,EV,total,next,playing,prevF,SEED,MUTE,BUF];
  const PUT=a=>{[ac,out,bout,BUS,CACHE,BEDS,DST,GL,T,last,step,ei,EV,total,next,playing,prevF,SEED,MUTE,BUF]=a};
  /* the notes are set down in 4-second pieces, so the game never stops for long. Where the browser can pause a recording
     (Chrome), each piece goes in 2 seconds before the recording reaches it: Chrome works through every note it holds, even
     ones that haven't started, so a whole song of notes at once made it three times slower. Elsewhere (Firefox, which is
     quick anyway) they all go in first */
  function offline(i,fixed,lv,seed){const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!OAC||!TRACKS[i])return null;
    const dur=durOf(i),len=dur+7,o=new OAC(2,Math.ceil(44100*len),44100);let mine;
    const run=(f,until)=>{const k=ST();RENDER=true;FIXED=fixed;try{if(f)f();else PUT(mine);tick(until);mine=ST()}finally{RENDER=false;FIXED=false;PUT(k)}};
    run(()=>{ac=o;BUF=null;graph();out.gain.value=lv;load(i,true,seed);next=.05;playing=true},4);
    const p=(async()=>{if(o.suspend)for(let s=4;s<len-6.5;s+=4){const u=Math.min(s+4,len-6.5);o.suspend(s-2).then(()=>{try{run(null,u)}finally{o.resume()}})}
      else for(let s=4;s<len-6.5;s+=4){await new Promise(r=>setTimeout(r));run(null,Math.min(s+4,len-6.5))}
      const b=await o.startRendering(),n=Math.min(b.length,b.sampleRate);   // the last second fades to nothing: the recording ends without a tick
      for(let c=0;c<b.numberOfChannels;c++){const d=b.getChannelData(c),k0=d.length-n;for(let k=0;k<n;k++)d[k0+k]*=1-k/n}return b})();
    return {p,dur:dur+.05}}
  async function renderSong(i){if(typeof i==="string")i=TRACKS.findIndex(t=>t.name===i);const r=offline(i,true,BASE);return r?r.p:null}
  /* on a computer, while one song plays, the next on the room's list is written out, and then played from that recording:
     a recording takes almost no work to play, so another app busy on the computer can't make it crackle. A song joined
     part way that isn't written out yet, a song not ready in time, and every song on a phone (too much memory there) are
     played live, note by note */
  let BUF=null,ahead=!LITE&&!!window.OfflineAudioContext;
  const REN=new Map(),key=e=>e.n+"/"+e.seed;
  function render(e){const i=idx(e.n),k=key(e),t0=performance.now();let r=null;try{r=offline(i,false,1,e.seed)}catch(err){}if(!r){ahead=false;return}
    const x={i,dur:r.dur};REN.set(k,x);
    r.p.then(b=>{x.buf=b;if((performance.now()-t0)/1000>r.dur+GAP)ahead=false},()=>{ahead=false;REN.delete(k)})}   // too slow to keep ahead: stay live
  function ahead_(S){if(!ahead||!S)return;const e=S.b;if(!e||idx(e.n)<0||REN.has(key(e)))return;
    for(const k of [...REN.keys()])if(!CUR||k!==key(CUR))REN.delete(k);   // (only the song playing and the one after it are kept)
    render(e)}
  setTimeout(()=>{if(LV()>0&&ahead&&!PRE&&!list()){const i=pick(-1);if(i>=0){PRE={n:names[i],seed:newSeed()};render(PRE)}}},1500);   // on a computer, a first song is written out as soon as the page is open
  /* each recording plays through its own volume: picked up part way it fades in, and stopped it fades out to nothing before
     it stops (stopped while still sounding, it clicked; and started again before it had, the song played twice) */
  function playBuf(b,t,off){const s=ac.createBufferSource(),g=gn();s.buffer=b.buf;s.connect(g);g.connect(bout);
    if(off>0){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1,t+.3)}s.start(t,off);BUF={...b,s,g,t0:t-off,end:t-off+b.dur,at:0}}
  function fadeOut(b){const t=ac.currentTime;b.g.gain.cancelScheduledValues(t);b.g.gain.setTargetAtTime(0,t,.1);try{b.s.stop(t+.8)}catch(e){}}
  /* what the room hears now, for the music bar: the song (or, in the quiet between two, the next one and when it starts) */
  function nowPlaying(){const S=list();if(!S)return null;const t=clockNow(),e=wantOf(S,t);if(!e)return {name:"",off:S.off||[]};
    return {name:e.n,next:t<e.at,in:Math.max(0,Math.ceil((e.at-t)/1000)),off:S.off||[]}}
  return {sync,renderSong,nowPlaying,length:n=>idx(n)<0?0:durOf(idx(n)),get playing(){return playing},get recorded(){return !!BUF},get track(){return T?T.name:null},tracks:names};
})();
