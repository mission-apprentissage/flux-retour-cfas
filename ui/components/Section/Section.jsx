import { Box, chakra, Container } from "@chakra-ui/react";
import PropTypes from "prop-types";

const Section = ({ withShadow = false, children, ...otherProps }) => {
  return (
    <chakra.section position="relative" {...otherProps}>
      {withShadow && (
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="16px"
          background="linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0, 0, 0, 0) 100%)"
        />
      )}
      <Container maxWidth="1230px">{children}</Container>
    </chakra.section>
  );
};

Section.propTypes = {
  withShadow: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default Section;
