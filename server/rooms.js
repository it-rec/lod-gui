// Socket.IO room name for a game. State broadcasts and ephemeral table-side
// events (dice, soundscape, reactions) are scoped to this room so two
// campaigns sharing one server never overwrite or leak into each other.
const roomFor = (gameID) => `game:${gameID}`;

module.exports = { roomFor };
