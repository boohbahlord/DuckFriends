# Duncelation: the plan

Built like Lawyering (one duck in the middle, everyone else walks to a side). Mode id `dunce`.

## A game
1. **Write:** at the start of every rotation, everyone writes one controversial take. The writing timer and the Writing catch-up timer work as usual.
2. **Deal:** the takes are handed out at random. They can land on their writer (the default). Lobby setting **Takes**: *Random* (default) / *Write your own* / *Never your own*.
3. **Order:** a new random turn order every rotation.
4. **A turn:**
   - The defender stands in the circle in the middle. The cloud says "Dunce or Not?" and the prompt line says "Convinced this isn't a dunce take? {take}". The writer is never shown.
   - A 15 s grace period, then the **Take timer** (lobby: Off / 1 min / 2 min (default) / 3 min / 5 min).
   - Everyone else walks to **Dunce** (left) or **Not a Dunce** (right) and can change sides until time runs out.
   - With the timer off, the turn ends the usual way: "Turn ends when done" plus the catch-up timer, or a skip vote.
5. **The vote:** Vote (and Change vote) like Lawyering; a duck that never voted counts where it stands when the turn ends. More on Dunce means a dunce; a tie means not a dunce.
6. **Not a dunce:** the next defender. After the last one, a new rotation (write again, new order).
7. **A dunce:**
   - The dunce hat drops on and lightning strikes 3 times.
   - The dunce stands on the LOSER podium, spams the horn (the Trombone special, the owner's pick) and gets struck once more.
   - Then the stats.
   - The game then goes on with the hat on and the duck in black and white until the room goes back to the lobby. More dunces can follow, and each one gets the hat.
8. **Minimum players:** 3 (a defender and two voters), added to `MIN_PLAYERS`, so "Waiting for players to continue" works here too.

## The hat and the black and white
- **Never saved:** the room's state keeps the dunces (`s.dunce`). The board draws the dunce hat and the black and white over the duck, and the player's own duck and hat are never touched.
- **Reset:** leaving, lag, a reload or the lobby can't leave them stuck. A dunce who lags out and rejoins the same game keeps them until the lobby.
- **Unlock:** the dunce hat gets locked until you've been voted a dunce 10 times. The count lives in `profile.dunced`, next to `justinKills`, and each dunce counts once even after a reconnect. The hat tile says "Be voted a dunce 10 times (3/10)".
  - Locking it takes the hat off anyone who wears it today.

## Stats (after each dunce, and at the end)
- **Most convincing:** the most Not a Dunce votes over their turns.
- **Comeback:** the most votes turned from Dunce to Not a Dunce during their own turns.
- **Dunce:** who was voted a dunce, and by how much.
- **Jumps:** jumps this game.
- Each player's box, and the takes with their scores (never their writers).

## New art (before/after pictures before merging)
- **LOSER podium:** a simple colored block like the Twister shapes, "LOSER" in the multicolored title letters, a small shadow.
- **The board:** Dunce on the left and Not a Dunce on the right, see-through like every board, with the circle in the middle.

## Files
- New `js/duncerules.js` (the rules, like `quackrules.js`) and `js/dunce.js` (board, podium, stats, like `court.js`).
- Changed: `rules.js`, `game.js`, `modes.js`, `lobby.js`, `bots.js` (computers write takes and pick a side), `unlocks.js`, `store.js`, `stats.js`, `updates.js` (off `UPCOMING`, new version entry), `css/app.css`, `notes/plan-duncelation.md`, `CLAUDE.md` (the mode list).

## Test (Full: a new mode)
The whole tour once at the end (every map, Chromium and Firefox, phone and computer, online with 2 players), with these extra checks:
- a dunce
- a tie
- the timer off
- each Takes setting
- a dunce leaving and rejoining
- going back to the lobby clears the hat
- dropping below 3 players

## As built
- Rules: `js/duncerules.js` (phases `submit` → `answer` → `discuss` (only with the Discussion round on) or `dunced` (the dunce's moment, 12 s) → `results` after a dunce). Screen: `js/dunce.js`; game.js draws the hat, the black and white and the podium.
- A player who sends no take gets one from `DUNCE_TAKES`. The Take timer counts from the end of the grace period; with it on, the turn always runs its full time.
- The dunce count (`profile.dunced`) doesn't grow in TEST rooms.
