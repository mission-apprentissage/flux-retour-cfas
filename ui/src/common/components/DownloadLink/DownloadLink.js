import { Box, Link } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

const DownloadLink = ({ children, getFile, fileName }) => {
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

  return (
    <Link onClick={onClick} color="bluefrance" fontSize="zeta" fontWeight="400" whiteSpace="nowrap">
      {children}
      <Box as="i" className="ri-download-line" marginLeft="1w" verticalAlign="middle" />
    </Link>
  );
};

DownloadLink.propTypes = {
  children: PropTypes.node.isRequired,
  getFile: PropTypes.func.isRequired,
  fileName: PropTypes.string,
};

export default DownloadLink;
