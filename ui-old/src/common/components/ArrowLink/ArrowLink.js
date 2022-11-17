const { Link, Box } = require("@chakra-ui/react");
import PropTypes from "prop-types";

const ArrowLink = ({ title, ...props }) => (
  <Link
    color="bluefrance"
    borderBottom="1px solid"
    {...props}
    _hover={{ textDecoration: "none", borderBottom: "2px solid" }}
  >
    <Box as="i" className="ri-arrow-right-line" marginRight="3v" verticalAlign="middle" />
    {title}
  </Link>
);

ArrowLink.propTypes = {
  title: PropTypes.string.isRequired,
};

export default ArrowLink;
