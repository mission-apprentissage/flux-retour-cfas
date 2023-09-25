import { Badge, Button, HStack, Stack, Text } from "@chakra-ui/react";
import { Dispatch, SetStateAction } from "react";

interface OrganismesFilterButtonProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  buttonLabel: string;
  badge?: number;
}

export function OrganismesFilterButton(props: OrganismesFilterButtonProps) {
  const hasFilters = props.badge !== undefined && props.badge > 0;
  return (
    <Button
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
        <Stack direction="row" flex="1" alignItems="center">
          <Text
            fontSize="zeta"
            fontWeight={hasFilters ? "bold" : "normal"}
            color={hasFilters ? "bluefrance" : "var(--chakra-colors-gray-800)"}
          >
            {props.buttonLabel}
          </Text>
          {props.badge && (
            <Badge backgroundColor="openbluefrance" color="bluefrance">
              {props.badge}
            </Badge>
          )}
        </Stack>
        {props.isOpen ? (
          <i className="ri-arrow-up-s-line" color="#000091" />
        ) : (
          <i className="ri-arrow-down-s-line" color="#000091" />
        )}
      </HStack>
    </Button>
  );
}
