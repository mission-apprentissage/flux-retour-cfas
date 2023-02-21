import { useState } from "react";

const useDownloadClick = (getFile, fileName) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();

  const onClick = async () => {
    try {
      setIsLoading(true);
      const fileResponse = await getFile();
      const blob = new Blob([fileResponse], {
        type: "text/plain",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName || new Date().toISOString();
      link.click();
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { onClick, isLoading, error };
};

export default useDownloadClick;
