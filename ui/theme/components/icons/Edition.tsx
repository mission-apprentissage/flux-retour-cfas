import { Icon } from "@chakra-ui/react";
import React from "react";

export default function Edition(props) {
  return (
    <Icon width="16px" height="16px" viewBox="0 0 16 16" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.3333 1.3335C13.7013 1.3335 14 1.63216 14 2.00016V4.50483L8.00067 10.5048L7.99667 13.3302L10.8273 13.3342L14 10.1615V14.0002C14 14.3682 13.7013 14.6668 13.3333 14.6668H2.66667C2.29867 14.6668 2 14.3682 2 14.0002V2.00016C2 1.63216 2.29867 1.3335 2.66667 1.3335H13.3333ZM14.5187 5.87216L15.4613 6.81483L10.276 12.0002L9.332 11.9988L9.33333 11.0575L14.5187 5.87216ZM8 8.00016H4.66667V9.3335H8V8.00016ZM10 5.3335H4.66667V6.66683H10V5.3335Z"
        fill="#F5F5FE"
      />
    </Icon>
  );
}
