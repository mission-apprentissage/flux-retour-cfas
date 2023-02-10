import { useEffect, useState } from "react";

export default function useServerEvent() {
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (!listening) {
      setListening(true);
      const events = new EventSource(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/server-events`);
      events.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        setMessages((messages) => messages.concat(parsedData));
      };
    }
  }, [listening, messages]);

  return {
    messages,
    lastMessage: messages[messages.length - 1],
    reset: () => setMessages([]),
  };
}
