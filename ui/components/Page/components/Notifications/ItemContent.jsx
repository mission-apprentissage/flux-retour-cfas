import React from "react";
import { Avatar, Flex, Text } from "@chakra-ui/react";
import { ClockIcon } from "../../../../theme/components/icons";

export default function ItemContent(props) {
  const spacing = " ";
  return (
    <>
      <Avatar name={props.aName} borderRadius="12px" me="16px" />
      <Flex flexDirection="column">
        <Text fontSize="14px" mb="5px" color="gray.700">
          <Text fontWeight="bold" fontSize="14px" as="span">
            {props.boldInfo}
            {spacing}
          </Text>
          {props.info}
        </Text>
        <Flex alignItems="center">
          <ClockIcon color="gray.500" boxSize={4} me="3px" />
          <Text fontSize="xs" lineHeight="100%" color="gray.500">
            {props.time}
          </Text>
        </Flex>
      </Flex>
    </>
  );
}
