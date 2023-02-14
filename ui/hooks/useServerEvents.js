import { useEffect, useState } from "react";

export default function useServerEvents() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/server-events`);
    eventSource.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);
      setData(parsedData);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return [data, setData];
}
