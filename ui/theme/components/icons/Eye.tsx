import { Icon } from "@chakra-ui/react";
import React from "react";

export default function Eye(props) {
  return (
    <Icon width="14px" height="14px" viewBox="0 0 16 16" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.99978 2C11.5944 2 14.5851 4.58667 15.2124 8C14.5858 11.4133 11.5944 14 7.99978 14C4.40511 14 1.41444 11.4133 0.787109 8C1.41378 4.58667 4.40511 2 7.99978 2ZM7.99978 4.66667C6.15883 4.66667 4.66644 6.15905 4.66644 8C4.66644 9.84095 6.15883 11.3333 7.99978 11.3333C9.84073 11.3333 11.3331 9.84095 11.3331 8C11.3331 6.15905 9.84073 4.66667 7.99978 4.66667ZM7.99978 6C9.10435 6 9.99978 6.89543 9.99978 8C9.99978 9.10457 9.10435 10 7.99978 10C6.89521 10 5.99978 9.10457 5.99978 8C5.99978 6.89543 6.89521 6 7.99978 6Z"
        fill="currentColor"
      />
    </Icon>
  );
}