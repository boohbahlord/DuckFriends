# Story Chain: the plan the owner agreed (2026-10-25)

The owner's words are in `agree-or-disagree.md` (Story Chain, word for word). Built in `js/rules.js` (the Story Chain
section), `js/story.js` (what it looks like) and `js/game.js`.

- A round is one paragraph. Nothing has a timer unless the host sets a writing time (Game options: Off, 60, 90, 120 s;
  when it runs out, whatever is typed is sent).
- **Secret words:** everyone writes one word (20 letters at most, no spaces). The words are shared out so nobody gets
  their own; a writer nobody's word is left for gets a game word. A random order of writers is drawn.
- **Writing:** one at a time. The first writer writes the opening line (or the first line of a new paragraph). The
  writer's window shows their secret word in the game's own font, the box (160 letters at most, in the writer's font)
  and Send, which stays grey until the secret word is in the line (any capitals, inside a longer word counts).
  Everyone else watches the line typed live in the story; it glows a little. Ducks walk the whole time.
- **The story:** see-through over the map, one row a line, in the writer's font, underlined in their card color, with
  a small copy of their duck under it. Earlier paragraphs stay above, faded. The board scrolls up and down with your
  duck (and to the line being typed while you stand still).
- **Favorite line:** walk onto a line and vote (not your own; not an earlier paragraph). The vote ends when the usual
  share of players has voted (the host's "turn ends when done" setting).
- **Favorite secret word:** the words show below the story, each in its writer's card, and light up inside their
  lines. Walk onto one and vote (not your own).
- **Stats:** most votes for their lines (with the line), most votes for their word, who took the longest writing, most
  jumps. The all-rounds review adds the whole game's and every finished story.
- **What next:** walk onto Continue the story (a new paragraph, a new order and new words), A new story, or Back to the
  lobby, and vote. Most ducks wins; a tie is a coin toss.
- A player with nothing left to vote for (only their own line or word) doesn't hold up a vote.
