let clients: any[] = [];

export function sendServerEventsForUser(userId, message) {
  clients
    .filter((client) => client.userId.toString() === userId.toString())
    .map((client) => {
      client.response.write(`data: ${JSON.stringify(message)}\n\n`);
    });
}
