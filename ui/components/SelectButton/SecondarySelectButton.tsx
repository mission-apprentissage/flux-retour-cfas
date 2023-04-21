import { Box, Button, Divider } from "@chakra-ui/react";
import React from "react";

const SecondarySelectButton = ({
  children,
  onClick,
  isActive = false,
  isClearable = false,
  clearIconOnClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  isClearable?: boolean;
  clearIconOnClick?: () => void;
}) => {
  const style = isClearable
    ? {
        color: "bluefrance",
        border: "solid 1px",
        borderColor: "bluefrance",
      }
    : {};
  return (
    <Button variant="select-secondary" onClick={onClick} isActive={isActive} {...style}>
      <Box as="span" verticalAlign="middle" textOverflow="ellipsis" maxWidth="600px" overflow="hidden">
        {children}
      </Box>
      <Box
        fontSize="epsilon"
        as="i"
        className={isActive ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
        marginLeft="1v"
        paddingTop="2px"
        verticalAlign="middle"
      />
      {isClearable && (
        <>
          <Divider
            height="22px"
            marginTop="2px"
            marginLeft="1w"
            marginRight="1v"
            orientation="vertical"
            verticalAlign="middle"
            opacity="0.3"
          />
          <Box
            paddingTop="2px"
            fontSize="epsilon"
            as="i"
            verticalAlign="middle"
            className="ri-close-circle-fill"
            marginLeft="1v"
            opacity="0.3"
            _hover={{ opacity: "0.5" }}
            onClick={(event) => {
              event.stopPropagation();
              clearIconOnClick?.();
            }}
          />
        </>
      )}
    </Button>
  );
};

export default SecondarySelectButton;
