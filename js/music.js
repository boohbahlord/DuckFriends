/* ---------- music, made on the spot (no sound files) ----------
   The songs come from Nous Within Kenoma's Ether's Crossroads (its ec-music.js): the same player, its instruments and its
   mix, so a song from there can be copied in as it is. Music plays in the lobby and in the game, at the volume of the
   Music slider in Settings (times Volume). Between two songs there are 20 seconds of quiet; the next song is picked at
   random, and the songs heard most recently are the least likely to come again. When each song was last heard is kept on
   this device ("duckfriends-music"). Browsers only start sound after a click or a key. */
import { profile } from './store.js';
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
    dyn:.8,contrast:.85,hum:.012,rv:.4,ds:.16,rev:[6,.55],wow:[.0011,.23],bed:[.003,.022],
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
    dyn:.8,contrast:.85,hum:.014,rv:.42,ds:.16,rev:[6.5,.55],wow:[.0012,.21],bed:[.002,.015],
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
    onNote:(e,t,E8,x)=>{const a=x.abs,s=sprSec(a),C=x.C,m=e.m;GL=null;if(m==null||Array.isArray(m))return;
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
  const TRACKS=[
    /* v59: rewritten in F Lydian: clusters of notes, then a breath; in the quiet, notes fall away (the only air in it);
       crisp and muted, warped a little, with a needle crackling */
    {name:"Lantern in the Fog",bpm:60,trim:1.3,bar:8,lead:"crisp",leadV:.26,rel:.25,bass:"chordpad",drum:"",lp:2000,echo:.2,
      dyn:.5,hum:.01,rv:.28,ds:.1,rev:[5,.45],wow:[.0012,.27],bed:[.004,.05],swell:.12,
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
    SPRING
  ];
  const BASE=.45;   // 100% music: loud, but under the game
  const LV=()=>BASE*(profile.settings.sound/100)*(profile.settings.music/100);
  const hz=m=>440*Math.pow(2,(m-69)/12);
  /* on a phone the notes' tails are cut sooner (after they have faded to almost nothing) and a few faint layers are left
     out (shimmers an octave up, the music box's halo, a second detuned saw), so the music takes less work to play and
     doesn't stutter; a computer plays everything in full */
  const LITE=matchMedia("(hover: none) and (pointer: coarse)").matches,TL=LITE?.6:1;
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
  function ctx(){if(ac)return ac;const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A({latencyHint:"playback"});graph();bout=gn(0);bout.connect(ac.destination);return ac}   // a roomy buffer: a busy computer doesn't make it crackle
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
  function vib(os,t,stop,rate,depth,delay){const l=ac.createOscillator();l.frequency.value=rate;l.start(t);l.stop(stop);
    for(const o of os){const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.setValueAtTime(0,t+(delay||0));g.gain.linearRampToValueAtTime(o._f*depth,t+(delay||0)+.45);l.connect(g);g.connect(o.frequency)}}
  function noiseBuf(){if(CACHE.nb)return CACHE.nb;const n=ac.sampleRate*3,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let k=0;k<n;k++)d[k]=Math.random()*2-1;return CACHE.nb=b}
  function noiseSrc(t,dur){const s=ac.createBufferSource();s.buffer=noiseBuf();s.loop=true;s.start(t,Math.random()*2.5);s.stop(t+dur);return s}
  function crackleBuf(){if(CACHE.cb)return CACHE.cb;const sr=ac.sampleRate,n=sr*4,b=ac.createBuffer(1,n,sr),d=b.getChannelData(0);let k=0;
    while(k<n){k+=Math.floor(-Math.log(1-Math.random())*sr/14)+1;const a=(Math.random()<.85?.18:.6)*(Math.random()<.5?-1:1),L=3+Math.floor(Math.random()*28);
      for(let j=0;j<L&&k+j<n;j++)d[k+j]+=a*Math.exp(-j/(L/3))*(j%2?-1:1)}return CACHE.cb=b}
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
      let o3=null;if(!LITE){const h=gn(.07);h.connect(g);o3=osc("triangle",f*2,t,stop,h)}const s=gn(.16);s.connect(g);osc("sine",f*.5,t,stop,s);   // and a ghost an octave down
      vib(o3?[o1,o2,o3]:[o1,o2],t,stop,4.4,.0045,.3);
      const nb=noiseSrc(t,dur+.4),bp=biq("bandpass",f*2,7),ng=gn(0);ng.gain.setValueAtTime(0,t);ng.gain.linearRampToValueAtTime(peak*1.6,t+a*.6);ng.gain.setTargetAtTime(0,t+a,.18);nb.connect(bp).connect(ng).connect(D);   // breath
      return true}
    if(type==="softtri"){const R=rel||.3,g=gn();g.connect(D);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.03);g.gain.setTargetAtTime(peak*.55,t+.04,.25);g.gain.setTargetAtTime(0,t+dur,R);osc("triangle",f,t,t+dur+R*5,g);return true}
    if(type==="softbox"){const R=rel||.9,end=t+Math.max(dur,.4),g=gn();g.connect(D);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.018);g.gain.setTargetAtTime(peak*.4,t+.03,.35);g.gain.setTargetAtTime(0,end,R);
      osc("sine",f,t,end+R*5*TL,g);const g2=gn();g2.connect(D);env(g2,t,.012,peak*.16,.02,.22);osc("sine",f*2,t,t+1.5,g2);
      const g3=gn();g3.connect(D);env(g3,t,.01,peak*.05,.01,.12);osc("sine",f*3.98,t,t+.8,g3);   // the tine, much softer than the old box
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
      osc("sine",f,t,stop,lp);const k=gn(.65);k.connect(lp);osc("triangle",f*1.0018,t,stop,k);if(!LITE){const h=gn(.1);h.connect(lp);osc("sine",f*2.002,t,stop,h)}
      const nb=noiseSrc(t,.06),bp=biq("bandpass",2300,1.4),ng=gn(0);ng.gain.setValueAtTime(peak*.22,t);ng.gain.setTargetAtTime(0,t,.012);nb.connect(bp).connect(ng).connect(D);
      return true}
    if(type==="harp"){const R=rel||.9,stop=t+R*6*TL,g=gn(),lp=biq("lowpass",3400,.5);lp.connect(g);g.connect(D);env(g,t,.004,peak,.01,R);
      osc("triangle",f,t,stop,lp);if(!LITE){const h=gn(.3);h.connect(lp);osc("sine",f*2,t,stop,h)}lp.frequency.setTargetAtTime(1200,t+.02,.4);return true}
    if(type==="mbass"){const R=rel||.5,stop=t+dur+R*5*TL,g=gn(),lp=biq("lowpass",260,.7);lp.connect(g);g.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.05);g.gain.setTargetAtTime(peak*.7,t+.06,Math.max(.1,dur*.4));g.gain.setTargetAtTime(0,t+dur,R);
      osc("sine",f,t,stop,lp);const k=gn(.45);k.connect(lp);osc("triangle",f*1.002,t,stop,k);return true}
    if(type==="warm"){const a=Math.max(.3,dur*.35),R=rel||.8,stop=t+dur+R*5*TL,g=gn(),lp=biq("lowpass",380,.6);lp.connect(g);g.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(peak*.8,t+a,dur*.5);g.gain.setTargetAtTime(0,t+dur,R);
      const k=gn(.6);k.connect(lp);for(const x of [].concat(f)){osc("sawtooth",x,t,stop,lp);if(!LITE)osc("sawtooth",x*1.0035,t,stop,lp);osc("triangle",x*.5,t,stop,k)}   // f may be a whole chord
      lp.frequency.linearRampToValueAtTime(950,t+a);lp.frequency.setTargetAtTime(600,t+a,dur*.4);return true}
    /* a clean "ooh" of voices: no buzz, just round tones that swell and sway */
    if(type==="ooh"){const a=Math.max(.25,dur*.3),R=rel||.7,stop=t+dur+R*5*TL,g=gn(),lp=biq("lowpass",1800,.5);lp.connect(g);g.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(peak*.8,t+a,dur*.5);g.gain.setTargetAtTime(0,t+dur,R);
      const o1=osc("sine",f,t,stop,lp),o2=osc("sine",f*1.004,t,stop,lp),h=gn(.15);h.connect(lp);const o3=osc("sine",f*2,t,stop,h);vib([o1,o2,o3],t,stop,4.8,.006,.2);return true}
    /* a bowed voice, a cello or a viola played softly: round, not buzzy (a triangle and a sine, a little saw for the bow) */
    if(type==="bow"){const a=Math.min(.22,Math.max(.07,dur*.25)),R=rel||.4,stop=t+dur+R*5*TL,top=Math.min(2600,f*3+300),g=gn(),lp=biq("lowpass",Math.min(1800,f*2),.5);lp.connect(g);g.connect(D);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(peak*.82,t+a,Math.max(.12,dur*.5));g.gain.setTargetAtTime(0,t+dur,R);
      lp.frequency.setValueAtTime(Math.min(1800,f*2),t);lp.frequency.linearRampToValueAtTime(top,t+a);   // the bow digs in, then sings
      const o1=osc("triangle",f,t,stop,lp),o2=osc("sine",f*1.0025,t,stop,lp),k=gn(.22);k.connect(lp);const o3=osc("sawtooth",f,t,stop,k);
      vib([o1,o2,o3],t,stop,5.3,.0045,.22);return true}
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
  function wood(t,v){const s=noiseSrc(t,.06),b=biq("bandpass",1500+Math.random()*700,6),g=gn(0);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*3,t+.002);g.gain.setTargetAtTime(0,t+.004,.012);s.connect(b).connect(g).connect(DST)}
  function brush(t,v){const s=noiseSrc(t,.4),b=biq("bandpass",4200,.5),g=gn(0);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.025);g.gain.setTargetAtTime(0,t+.04,.07);s.connect(b).connect(g).connect(DST)}
  /* a sound that travels from one ear to the other while it plays */
  function panTo(a,b,t,dur,rv,ds){const p=ac.createStereoPanner();p.pan.setValueAtTime(a,t);p.pan.linearRampToValueAtTime(b,t+dur);p.connect(send(rv,ds));return p}
  /* wind through an empty street, far off */
  function wind(t,dur,v,p0,p1){const s=noiseSrc(t,dur+1),b=biq("bandpass",400,4),g=gn(0),p=ac.createStereoPanner();
    b.frequency.setValueAtTime(300+300*rnd(),t);b.frequency.linearRampToValueAtTime(700+500*rnd(),t+dur*.6);b.frequency.linearRampToValueAtTime(350,t+dur);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+dur*.5);g.gain.linearRampToValueAtTime(0,t+dur);p.pan.setValueAtTime(p0,t);p.pan.linearRampToValueAtTime(p1,t+dur);
    s.connect(b).connect(g).connect(p).connect(send(.8,.1))}
  // a bed of hiss and a needle's crackle under the whole song
  function stopBeds(){if(!ac)return;for(const s of BEDS)try{s.stop(ac.currentTime+.05)}catch(e){}BEDS=[]}
  function startBed(t,dur,[h,c]){const mk=(buf,ty,f,q,v)=>{if(!v)return;const s=ac.createBufferSource();s.buffer=buf;s.loop=true;const b=biq(ty,f,q),g=gn(0);s.connect(b);b.connect(g);g.connect(BUS.fx);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+1.2);g.gain.setValueAtTime(v,t+Math.max(1.3,dur-1.5));g.gain.linearRampToValueAtTime(0,t+dur);s.start(t,Math.random()*2);s.stop(t+dur+.05);BEDS.push(s)};
    mk(noiseBuf(),"bandpass",3400,.45,h);mk(crackleBuf(),"highpass",900,.5,c)}
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
  function load(i,now){T=TRACKS[i];last=i;step=0;ei=0;prevF=null;SEED=FIXED?7919*(i+1):(Math.random()*4294967296)>>>0;EV=build(T);total=EV.total;stopBeds();if(ac)room(now)}
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
    if(WAIT&&!RENDER){if(NX&&!NX.buf&&ac.currentTime<WAIT)return;WAIT=0;nextSong(ac.currentTime+.15);if(BUF)return}
    if(BUF&&!RENDER){if(ac.currentTime<BUF.end)return;const e=BUF.end;BUF=null;nextSong(e+GAP);if(BUF)return}
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
      if(step>=total){if(RENDER)return;nextSong(next+GAP);if(BUF)return}}   // the song ends: 20 seconds of quiet, then the next one
  }
  const GAP=20;
  /* the next song: a random pick that leans away from the songs heard most recently (each song's chance grows with the
     minutes since it was last heard); never the same song twice in a row while there is another */
  const HKEY="duckfriends-music",names=TRACKS.map(t=>t.name);
  const heard=()=>{try{const h=JSON.parse(localStorage.getItem(HKEY)||"{}");return h&&typeof h==="object"&&!Array.isArray(h)?h:{}}catch(e){return {}}};
  function pick(){const h=heard(),now=Date.now(),age=n=>h[n]?Math.max(1,(now-h[n])/60000):1e7;
    let best=0,bk=-1;names.forEach((n,i)=>{if(names.length>1&&i===last)return;const k=Math.pow(Math.random(),1/Math.log(2+age(n)));if(k>bk){bk=k;best=i}});
    h[names[best]]=now;try{localStorage.setItem(HKEY,JSON.stringify(h))}catch(e){}return best}
  /* stopped part way (the Music slider at 0, the page hidden, out of the room): starting again picks the same song up
     where it was, and a gap between songs keeps the rest of its quiet */
  let paused=false,left=0;
  function start(){if(playing)return;if(!ctx())return;if(ac.state==="suspended")ac.resume();playing=true;
    const now=ac.currentTime;
    if(paused&&BUF){const a=BUF.at;playBuf(BUF,a<0?now+Math.max(.15,-a):now+.15,Math.max(0,a))}
    else if(paused&&T){next=now+Math.max(.15,left);if(T.bed&&step>0&&step<total)startBed(next,Math.max(2,EV.dur*(1-step/total)+1),T.bed)}
    else if(NX)WAIT=now+15;   // the first song has been written out since the page opened: wait for it (15 seconds at most)
    else{load(pick(),true);next=now+.15;prep()}
    paused=false;level(.8);timer=setInterval(tick,90);tick()}
  function stop(){if(!playing)return;playing=false;paused=true;clearInterval(timer);timer=null;stopBeds();if(!ac)return;
    left=Math.min(GAP,Math.max(0,next-ac.currentTime));if(BUF){BUF.at=ac.currentTime-BUF.t0;try{BUF.s.stop(ac.currentTime+1.5)}catch(e){}}level(.3,0)}
  function level(tc,v){const t=ac.currentTime;for(const g of [out,bout]){g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(v==null?LV():v,t,tc)}}
  // in a room (the lobby or the game), with the sound up and the page in view
  const wanted=()=>LV()>0&&!document.hidden&&["lobby","game"].includes(document.body.dataset.screen);
  function sync(){if(wanted()){if(ac||started)start()}else stop();if(ac&&playing)level(.15)}
  let started=false;   // a click or a key has happened, so the browser lets sound start
  const wake=()=>{started=true;if(!wanted())return;if(!playing)start();else if(ac&&ac.state!=="running")ac.resume()};
  setTimeout(()=>{if(LV()>0)prep()},1500);   // on a computer, the first song is written out as soon as the page is open
  addEventListener("pointerdown",wake,true);
  addEventListener("keydown",wake,true);
  document.addEventListener("visibilitychange",sync);
  document.addEventListener("settings",sync);
  document.addEventListener("screen",sync);
  /* one song written out to an audio buffer: to listen to a song outside the game (fixed, the same each time), or, on a
     computer, the next song ahead of time (new each time) */
  const ST=()=>[ac,out,bout,BUS,CACHE,BEDS,DST,GL,T,last,step,ei,EV,total,next,playing,prevF,SEED,MUTE,BUF];
  const PUT=a=>{[ac,out,bout,BUS,CACHE,BEDS,DST,GL,T,last,step,ei,EV,total,next,playing,prevF,SEED,MUTE,BUF]=a};
  // the notes are set down in 4-second pieces, a moment apart, so the game never stops for long; then the song is written out
  function offline(i,fixed,lv){const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!OAC||!TRACKS[i])return null;
    const dur=build(TRACKS[i]).dur,len=dur+7,o=new OAC(2,Math.ceil(44100*len),44100);let mine;
    const run=(f,until)=>{const k=ST();RENDER=true;FIXED=fixed;try{if(f)f();else PUT(mine);tick(until);mine=ST()}finally{RENDER=false;FIXED=false;PUT(k)}};
    run(()=>{ac=o;BUF=null;graph();out.gain.value=lv;load(i,true);next=.05;playing=true},4);
    const p=(async()=>{for(let s=4;s<len-6.5;s+=4){await new Promise(r=>setTimeout(r));run(null,Math.min(s+4,len-6.5))}return o.startRendering()})();
    return {p,dur:dur+.05}}
  async function renderSong(i){if(typeof i==="string")i=TRACKS.findIndex(t=>t.name===i);const r=offline(i,true,BASE);return r?r.p:null}
  /* on a computer, while one song plays, the next is written out, and then played from that recording: a recording
     takes almost no work to play, so another app busy on the computer can't make it crackle. The first song, a song
     not ready in time, and every song on a phone (too much memory there) are played live, note by note */
  let NX=null,BUF=null,WAIT=0,ahead=!LITE&&!!window.OfflineAudioContext;
  function prep(){if(!ahead||NX)return;const i=pick(),nx=NX={i},t0=performance.now();let r=null;try{r=offline(i,false,1)}catch(e){}if(!r){ahead=false;NX=null;return}
    nx.dur=r.dur;r.p.then(b=>{nx.buf=b;if((performance.now()-t0)/1000>r.dur+GAP)ahead=false},()=>{ahead=false;if(NX===nx)NX=null})}   // too slow to keep ahead: stay live
  function playBuf(b,t,off){const s=ac.createBufferSource();s.buffer=b.buf;s.connect(bout);s.start(t,off);BUF={...b,s,t0:t-off,end:t-off+b.dur,at:0}}
  // a song ends (after its quiet): the next one, from its recording when it's ready, else live
  function nextSong(t){const nx=NX;NX=null;stopBeds();
    if(nx&&nx.buf){T=TRACKS[nx.i];last=nx.i;playBuf(nx,t,0)}else{load(nx?nx.i:pick());next=t}
    prep()}
  return {sync,renderSong,get playing(){return playing},get recorded(){return !!BUF},get track(){return T?T.name:null},tracks:names};
})();
