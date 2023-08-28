import { useEffect, useState } from "react";

import { publicConfig } from "@/config.public";

export default function useServerEvents() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const eventSource = new EventSource(`${publicConfig.baseUrl}/api/v1/server-events`);
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
