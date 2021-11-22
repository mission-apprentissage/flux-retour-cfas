import { chakra } from "@chakra-ui/react";
import PropTypes from "prop-types";

const Section = ({ withShadow = false, children, ...otherProps }) => {
  const style = {
    width: "100%",
    margin: "auto",
    maxWidth: "1440px",
    paddingX: "8w",
    backgroundColor: "white",
  };
  return (
    <chakra.section
      boxShadow={withShadow ? "inset 0px 8px 16px 0px rgb(0 0 0 / 8%)" : "none"}
      {...style}
      {...otherProps}
    >
      {children}
    </chakra.section>
  );
};

Section.propTypes = {
  withShadow: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default Section;
