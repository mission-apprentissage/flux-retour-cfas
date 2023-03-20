import { v4 as uuidv4 } from "uuid";

let clients: any[] = [];

export function sendServerEventsForUser(userId, message) {
  clients
    .filter((client) => client.userId.toString() === userId.toString())
    .map((client) => {
      client.response.write(`data: ${JSON.stringify(message)}\n\n`);
    });
}

export function serverEventsHandler(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  });
  req.id = uuidv4();

  const userId = req.user._id;

  clients.push({
    userId: userId,
    requestId: req.id,
    response: res,
  });

  req.on("close", () => {
    console.log(`${userId} Connection closed`);
    clients = clients.filter((client) => client.requestId !== req.id);
  });
}
