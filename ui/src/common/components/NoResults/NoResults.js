import { Text } from "@chakra-ui/react";
import PropTypes from "prop-types";

const NoResults = ({ title }) => {
  return (
    <Text color="grey.800" fontWeight="700" paddingTop="2w" paddingLeft="1w">
      {title}
    </Text>
  );
};

NoResults.propTypes = {
  title: PropTypes.string.isRequired,
};

export default NoResults;
