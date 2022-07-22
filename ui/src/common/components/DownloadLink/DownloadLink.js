import { Box, Link } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import useDownloadClick from "../../hooks/useDownloadClick";

const DownloadLink = ({ children, getFile, fileName }) => {
  const onClick = useDownloadClick(getFile, fileName);

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
