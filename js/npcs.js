/* ---------- the characters you can mute: Justin, the cats, Justin's Butler, the shadow duck ----------
   The chat's \mute, \permmute and \show take them by name like players (the only commands that work on the cats). Their
   mutes are kept under 'npc:<id>'. A cat's line shows in my chat only if the cat was on my screen when it spoke
   (hangout/characters.js writes which lines those were in seen). No imports, so chat.js, shell.js and the Hangout can
   all use it. */
export const NPCS = [
  { id: 'justin', name: 'Justin', tags: ['justin'] },
  { id: 'annabelle', name: 'Annabelle', tags: ['annabelle'], cat: true },
  { id: 'bubbles', name: 'Bubbles', tags: ['bubbles'], cat: true },
  { id: 'oreo', name: 'Oreo', tags: ['oreo'], cat: true },
  { id: 'opal', name: 'Opal', tags: ['opal'], cat: true },
  { id: 'butler', name: "Justin's Butler", at: 'JustinsButler', tags: ['butler', "justin'sbutler", 'justinsbutler'] },
  { id: 'shadow', name: 'Shadow duck', at: 'ShadowDuck', tags: ['shadowduck', 'shadow'] },
];
export const npcById = id => NPCS.find(n => n.id === id);
/* @name → the character, or null */
export const npcByTag = t => NPCS.find(n => n.tags.includes(String(t || '').replace(/\s+/g, '').toLowerCase())) || null;
/* the ones in this room now (for Tab): Justin on the boards (the Justin option) or anyone in Duck Cabin */
export const npcsHere = s => NPCS.filter(n => ((s && s.hang && s.hang.npc) || {})[n.id] || (n.id === 'justin' && s && s.justin));
/* the @name to type for one */
export const npcTag = n => n.at || n.name;
/* is a character's text, ping or bubble muted for me? (chat.js' isMuted, put here by chat.js: the Hangout can't import
   chat.js without a loop) */
export const muted = { is: () => false };
export const npcMuted = (s, id, kind) => muted.is(s, id, kind);
/* the cats' chat lines (log n) that were said on my screen */
export const seen = new Set();
