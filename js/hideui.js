/* ---------- hide ui (the owner's, Nov 19 12:59Z) ----------
   "the terminal can be brought up and typed into to hide most UI, simply by typing hide ui / this hides everything but
   the top right buttons for things like fullscreen or pause and what not, or doesnt hide the text chat ("abc"), the
   leave sandbox or leave other button, the vote button, and hot bar. It hides the black outline above and below the
   screen AND it hides the text on the bottom (except for cheat sheet …) … this command can be fonnd in pause settings OR
   in text chat commands and not just terminal".
   Mine alone, kept on this device (profile.settings.hideUi; html.hide-ui, css/app.css). Two ways in: \hide ui and
   \show ui in the chat (chat.js), and the pause menu and Settings (game.js, settings.js). We cut the command line on
   Nov 27. */
import { profile, save } from "./store.js";
import { applySettings } from "./settings.js";

export const uiHidden = () => !!profile.settings.hideUi;

/* on: hide it (true), bring it back (false); the words for the chat */
export function setHideUi(on) {
  profile.settings.hideUi = !!on;
  save();
  applySettings();
  return on
    ? "UI hidden. hide ui again, or show ui, brings it back."
    : "UI back.";
}

/* the chat's words: verb "hide" (again: back) or "show", what "ui" */
export function uiCommand(verb, what) {
  if (String(what || "").toLowerCase() !== "ui")
    return `${verb} ui: ${verb === "hide" ? "hides the bars, the words at the bottom and the song bar (again: back)" : "brings them back"}.`;
  return setHideUi(verb === "hide" ? !uiHidden() : false);
}
