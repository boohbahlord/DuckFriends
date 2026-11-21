/* ---------- the green bar on an upload ----------
   The owner's, Nov 20 18:46Z: "there should be a loading on the UI itself, not the loading screen, but on the UI itself,
   whenever you import things like images or audio files for player feedback. Like a short little green bar on the UI in
   which it was added to that shows its progress of it uploading".
   upBar(el): a short green bar under el (an upload button), { set(0 … 1), done() }; done fills it, then it fades.
   Every picture's upload button gets one by itself (the file is read here as its own code reads it: how far that has
   got is the bar; once read, it fills as the picture is made into pixels and sent); an input with data-nobar draws its
   own (a song: sbsaves.js) */
export function upBar(el) {
  if (!el || !el.isConnected) return { set() {}, done() {} };
  const host = el.closest("label, button") || el;
  host.querySelectorAll(".up-bar").forEach((b) => b.remove());
  const bar = document.createElement("span");
  bar.className = "up-bar";
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", "Uploading");
  bar.innerHTML = "<i></i>";
  host.append(bar);
  const pos = getComputedStyle(host).position === "static"; // (the bar sits inside the button)
  if (pos) host.style.position = "relative";
  const fill = bar.firstChild;
  let gone = false;
  const set = (p) => {
    p = Math.max(0, Math.min(1, +p || 0));
    fill.style.width = Math.round(p * 100) + "%";
    bar.setAttribute("aria-valuenow", String(Math.round(p * 100)));
  };
  set(0.02);
  return {
    set,
    done() {
      if (gone) return;
      gone = true;
      set(1);
      setTimeout(() => bar.classList.add("up-gone"), 350);
      setTimeout(() => {
        bar.remove();
        if (pos && !host.querySelector(".up-bar")) host.style.position = "";
      }, 800);
    },
  };
}
document.addEventListener(
  "change",
  (e) => {
    const i = e.target;
    if (!(i instanceof HTMLInputElement) || i.type !== "file") return;
    if (i.hasAttribute("data-nobar") || !i.files || !i.files[0]) return;
    const b = upBar(i),
      fr = new FileReader();
    fr.onprogress = (q) => {
      if (q.lengthComputable) b.set((q.loaded / q.total) * 0.6);
    };
    fr.onloadend = () => {
      b.set(0.6);
      /* made into pixels and sent: it fills on toward the end, done when its window redraws it or in a moment */
      let k = 0;
      const t = setInterval(() => {
        k++;
        if (!i.isConnected || k >= 8) {
          clearInterval(t);
          b.done();
        } else b.set(0.6 + k * 0.05);
      }, 120);
    };
    fr.readAsArrayBuffer(i.files[0]);
  },
  true,
);

/* ---------- the green line at the very top ----------
   The owner's, Nov 20 22:23Z: "the very, very, very, very top of Duck Friends. A green line will pass through the top
   when I'm loading customization. So it shows me how much it has actually finished loading", and the black screen only
   for maps, modes and votes. topBar(): the line, how much is in as a percent under its start; { set(0 … 1), done() }.
   One at a time: asked for again while it shows, it's the same one (front.js starts it at the click, while the rest of
   the game comes; customize.js carries it on). It never goes back, and it goes by itself if nothing ends it */
let top = null;
export function topBar() {
  if (top) return top;
  const bar = document.createElement("div");
  bar.className = "top-bar";
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", "Loading");
  bar.innerHTML = "<i></i><b></b>";
  document.body.append(bar);
  const [fill, pct] = bar.children;
  let at = -1;
  const set = (p) => {
    p = Math.max(0, Math.min(1, +p || 0));
    if (p <= at) return;
    at = p;
    fill.style.width = (p * 100).toFixed(1) + "%";
    pct.textContent = Math.floor(p * 100) + "%";
    bar.setAttribute("aria-valuenow", String(Math.floor(p * 100)));
  };
  const done = () => {
    if (top !== me) return;
    top = null;
    clearTimeout(lost);
    set(1);
    setTimeout(() => bar.classList.add("up-gone"), 250);
    setTimeout(() => bar.remove(), 700);
  };
  const lost = setTimeout(done, 90000);
  const me = { set, done };
  set(0.02);
  return (top = me);
}
