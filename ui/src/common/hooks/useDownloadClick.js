import { useState } from "react";

const useDownloadClick = (getFile, fileName) => {
  const [, setError] = useState();

  const onClick = async () => {
    try {
      const fileResponse = await getFile();
      const fileBlob = await fileResponse.blob();

      const link = document.createElement("a");
      link.href = URL.createObjectURL(fileBlob);
      link.download = fileName || new Date().toISOString();
      link.click();
    } catch (err) {
      setError(err);
    }
  };

  return onClick;
};

export default useDownloadClick;
