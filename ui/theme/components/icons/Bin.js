import { Icon } from "@chakra-ui/react";
import React from "react";

export function Bin(props) {
  return (
    <Icon viewBox="0 0 25 25" w="25px" h="25px" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.6055 4.09961H22.6055V6.09961H20.6055V21.0996C20.6055 21.6519 20.1578 22.0996 19.6055 22.0996H5.60547C5.05318 22.0996 4.60547 21.6519 4.60547 21.0996V6.09961H2.60547V4.09961H7.60547V2.09961H17.6055V4.09961ZM9.60547 9.09961V17.0996H11.6055V9.09961H9.60547ZM13.6055 9.09961V17.0996H15.6055V9.09961H13.6055Z"
        fill="currentColor"
      />
    </Icon>
  );
}
