import { Text } from "@chakra-ui/react";

const NoResults = ({ title }) => {
  return (
    <Text color="grey.800" fontWeight="700" paddingTop="2w" paddingLeft="1w">
      {title}
    </Text>
  );
};

export default NoResults;
