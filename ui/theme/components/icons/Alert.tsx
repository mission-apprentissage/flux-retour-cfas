import { Icon } from "@chakra-ui/react";
import React from "react";

export function Alert(props) {
  return (
    <Icon viewBox="0 0 24 24" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.866 2.99996L22.392 19.5C22.5706 19.8094 22.5706 20.1905 22.392 20.4999C22.2134 20.8093 21.8833 20.9999 21.526 21H2.474C2.11674 20.9999 1.78662 20.8093 1.608 20.4999C1.42937 20.1905 1.42937 19.8094 1.608 19.5L11.134 2.99996C11.3126 2.69058 11.6428 2.5 12 2.5C12.3573 2.5 12.6874 2.69058 12.866 2.99996ZM11 16V18H13V16H11ZM11 8.99996V14H13V8.99996H11Z"
        fill="currentColor"
      />
    </Icon>
  );
}
