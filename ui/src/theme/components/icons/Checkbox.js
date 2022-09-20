import { Icon } from "@chakra-ui/react";
import React from "react";

export function Checkbox(props) {
  return (
    <Icon width="20px" height="20px" viewBox="0 0 20 20" {...props}>
      <g clipPath="url(#clip0_5061_121180)">
        <path
          d="M10.0001 18.3333C5.39758 18.3333 1.66675 14.6025 1.66675 9.99996C1.66675 5.39746 5.39758 1.66663 10.0001 1.66663C14.6026 1.66663 18.3334 5.39746 18.3334 9.99996C18.3334 14.6025 14.6026 18.3333 10.0001 18.3333ZM9.16925 13.3333L15.0609 7.44079L13.8826 6.26246L9.16925 10.9766L6.81175 8.61913L5.63341 9.79746L9.16925 13.3333Z"
          fill="#3A3A3A"
        />
      </g>
      <defs>
        <clipPath id="clip0_5061_121180">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </Icon>
  );
}
