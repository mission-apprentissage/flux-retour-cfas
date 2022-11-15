import { Flex, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import Link from "../Links/Link";

import { RightLine } from "../../theme/components/icons";

const cardVariants = {
  blue: {
    backgroundColor: "bluefrance",
    textColor: "white",
    arrowColor: "#8585F6",
    alignSelf: "flex-end",
    marginBottom: "1w",
    paddingX: "5w",
    height: "116px",
    hoverBackgroundColor: "bluefrance_hover",
  },
  white: {
    backgroundColor: "white",
    textColor: "black",
    arrowColor: "bluefrance",
    alignSelf: "flex-end",
    border: "1px solid",
    paddingX: "2w",
    borderColor: "#E5E5E5",
    fontWeight: "bold",
    hoverBackgroundColor: "grey.200",
  },
};

const LinkCard = ({ children, linkHref, variant = "blue", ...styleProps }) => {
  return (
    <Flex
      background={cardVariants[variant].backgroundColor}
      height={cardVariants[variant].height}
      fontSize="gamma"
      paddingY="3w"
      _hover={{ bg: `${cardVariants[variant].hoverBackgroundColor}` }}
      border={cardVariants[variant].border}
      borderColor={cardVariants[variant].borderColor}
      fontWeight={cardVariants[variant].fontWeight}
      paddingX={cardVariants[variant].paddingX}
      flex="1"
      as={Link}
      href={linkHref}
      {...styleProps}
    >
      <Text color={cardVariants[variant].textColor} marginBottom="4w" flex="1">
        {children}
      </Text>
      <Flex alignSelf={cardVariants[variant].alignSelf}>
        <RightLine color={cardVariants[variant].arrowColor} marginBottom={cardVariants[variant].marginBottom} />
      </Flex>
    </Flex>
  );
};

LinkCard.propTypes = {
  linkHref: PropTypes.string.isRequired,
  variant: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default LinkCard;
