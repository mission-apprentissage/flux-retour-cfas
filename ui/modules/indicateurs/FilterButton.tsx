import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import { Button, HStack, Stack, Text } from "@chakra-ui/react";
import { Dispatch, SetStateAction } from "react";

import RoundedBadge from "@/components/RoundedBadge/RoundedBadge";

interface FilterButtonProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  buttonLabel: string;
  badge?: number;
}

export function FilterButton(props: FilterButtonProps) {
  const hasFilters = props.badge !== undefined && props.badge > 0;
  return (
    <Button
      bg="#F9F8F6"
      variant="unstyled"
      w="100%"
      h={14}
      px={4}
      py={2}
      _hover={{ bg: "var(--chakra-colors-blackAlpha-50);" }}
      onClick={() => props.setIsOpen(!props.isOpen)}
      isActive={props.isOpen}
    >
      <HStack>
        <Stack direction="row" flex="1">
          <Text
            fontWeight={hasFilters ? "bold" : "normal"}
            color={hasFilters ? "bluefrance" : "var(--chakra-colors-gray-800)"}
          >
            {props.buttonLabel}
          </Text>
          {props.badge && <RoundedBadge value={props.badge} />}
        </Stack>
        {props.isOpen ? <MinusIcon fontSize="12px" color="#000091" /> : <AddIcon fontSize="12px" color="#000091" />}
      </HStack>
    </Button>
  );
}
