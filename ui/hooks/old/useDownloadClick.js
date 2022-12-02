import { useState } from "react";

const useDownloadClick = (getFile, fileName) => {
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState();

  const onClick = async () => {
    try {
      setIsLoading(true);
      const fileResponse = await getFile();

      const fileBlob = await fileResponse.blob();

      const link = document.createElement("a");
      link.href = URL.createObjectURL(fileBlob);
      link.download = fileName || new Date().toISOString();
      link.click();
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return [onClick, isLoading];
};

export default useDownloadClick;
