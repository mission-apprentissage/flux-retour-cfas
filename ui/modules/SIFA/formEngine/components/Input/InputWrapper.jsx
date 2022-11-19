import { Center, InputGroup, InputRightElement, Spinner } from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { LockFill } from "../../../../../theme/components/icons";
import React from "react";

export const getRightIcon = ({ loading, locked, success }) => {
  if (loading) return <Spinner boxSize="4" />;
  if (success) return <CheckIcon color={"green.500"} boxSize="4" />;
  if (locked) return <LockFill color={"disablegrey"} boxSize="4" />;
};

export const InputWrapper = (props) => {
  const { name, success, loading = false, locked, children } = props;
  const rightIcon = getRightIcon({ loading, success, locked });
  return (
    <InputGroup id={`${name}_group_input`}>
      {children}
      {rightIcon && (
        <InputRightElement>
          <Center w="40px" h="40px" ml={"0 !important"}>
            {getRightIcon({ loading, success, locked })}
          </Center>
        </InputRightElement>
      )}
    </InputGroup>
  );
};
