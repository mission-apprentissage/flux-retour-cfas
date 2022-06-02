import { Box, Link } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

const DownloadButton = ({ children, getFile, fileName }) => {
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

  return (
    <Link onClick={onClick} _hover={{ textDecoration: "none" }}>
      <Box as="span" verticalAlign="middle" _hover={{ textDecoration: "underline" }}>
        {isLoading ? "Chargement..." : children}
      </Box>
      {!isLoading && (
        <Box
          fontSize="delta"
          marginLeft="1w"
          as="i"
          className="ri-download-line"
          verticalAlign="middle"
          textDecoration="none"
        />
      )}
    </Link>
  );
};

DownloadButton.propTypes = {
  children: PropTypes.node.isRequired,
  getFile: PropTypes.func.isRequired,
  fileName: PropTypes.string,
};

export default DownloadButton;
