/* I want the checks' Dead Ducks Arcade games made one way (director.cjs, merchants.cjs): a TEST room on Downpour with
   one computer duck, run beat by beat on the faked clock (npc-golden/init.js, in the page first: lib.cjs fakedPage),
   every duck voting ready, until done(room) holds or 600 beats pass. window.__now is the clock. */
export async function l4Room(name, done) {
  const net = await import("../../js/net.js");
  window.__fake = true;
  window.__now = window.__now || 1.8e12;
  const room = net.createLocalRoom({ name, test: true, computers: 1 });
  room.close();
  room.send({
    t: "options",
    options: {
      modePick: "host",
      mapPick: "host",
      mode: "l4dd",
      map: "downpour",
      botWait: 1,
      wildJustin: 0,
    },
  });
  room.send({ t: "start" });
  for (let k = 0; k < 600 && !done(room); k++) {
    const w = room.state.hang && room.state.hang.l4 && room.state.hang.l4.wait;
    for (const id of room.state.seat)
      if (w && !(w.v || {})[id])
        room.send({ t: "hang", k: "l4", do: "endturn", on: true, id });
    window.__now += 200;
    room.send({ t: "tick", id: room.me });
  }
  return room;
}
