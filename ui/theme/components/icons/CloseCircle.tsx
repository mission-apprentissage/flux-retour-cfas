import { Icon } from "@chakra-ui/react";
import React from "react";

export function CloseCircle(props) {
  return (
    <Icon viewBox="0 0 24 24" width="24px" height="24px" {...props}>
      <path
        fill="currentColor"
        d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm4.707,14.293a1,1,0,1,1-1.414,1.414L12,13.414,8.707,16.707a1,1,0,1,1-1.414-1.414L10.586,12,7.293,8.707A1,1,0,1,1,8.707,7.293L12,10.586l3.293-3.293a1,1,0,1,1,1.414,1.414L13.414,12Z"
      />
    </Icon>
  );
}
