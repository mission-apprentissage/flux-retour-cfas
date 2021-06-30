import PropTypes from "prop-types";
import React from "react";

import Section from "../Section/Section";

const triangleStyle = {
  content: '""',
  borderLeft: "8px solid transparent",
  borderRight: "8px solid transparent",
  borderTop: "8px solid",
  borderTopColor: "bluefrance",
  width: 0,
  height: 0,
  position: "absolute",
  bottom: "-8px",
};

const Highlight = ({ children }) => {
  return (
    <Section backgroundColor="bluefrance" paddingY="3w" position="relative" marginBottom="2w" _after={triangleStyle}>
      {children}
    </Section>
  );
};

Highlight.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Highlight;
