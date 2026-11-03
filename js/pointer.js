/* ---------- a computer or a phone ----------
   I want a computer to get the computer's controls (the row of specials, the key hints, the weapons bar) even with a
   touch screen: a touchscreen laptop can tell the page that all it has is a touch screen. So the page is a computer's
   (html.keyboard) when a mouse or a touchpad is there (any-pointer: fine), when the system is a computer's (Windows,
   Linux, ChromeOS) on a screen bigger than a phone's, or from the moment a key is pressed outside a typing box or a
   mouse or a touchpad moves. Having a touch screen never decides it. A narrow window still gets the phone's controls
   (css: max-width 760px). */
const html = document.documentElement;
const ua = navigator.userAgent || "",
  platform =
    (navigator.userAgentData && navigator.userAgentData.platform) ||
    navigator.platform ||
    "";
const computerSystem =
  !/Android|iPhone|iPad|iPod|Mobile/i.test(ua) &&
  /Win|Linux|X11|CrOS|Chrome OS/i.test(platform + " " + ua) &&
  Math.min(screen.width, screen.height) >= 600; // (a Mac has its touchpad, an iPad calls itself a Mac, and a phone asking for the desktop site still has a phone's screen)

const isComputer = () => html.classList.add("keyboard");
if (matchMedia("(any-pointer: fine)").matches || computerSystem) isComputer();

const typing = (t) =>
  !!t &&
  !!t.closest &&
  !!t.closest("input, textarea, select, [contenteditable]");
function real(e) {
  if (e.type === "keydown" ? typing(e.target) : e.pointerType !== "mouse")
    return; // (a phone's own keyboard types into a box; a finger isn't a mouse)
  isComputer();
  removeEventListener("keydown", real, true);
  removeEventListener("pointermove", real, true);
}
addEventListener("keydown", real, true);
addEventListener("pointermove", real, true);

/* true on a phone or a tablet: only a touch screen, and no key or mouse used yet */
export const touchOnly = () => !html.classList.contains("keyboard");
