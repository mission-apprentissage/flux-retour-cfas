import { Icon, SystemProps } from "@chakra-ui/react";

// dsfr fr-icon-logout-box-r-line
export function ExitIcon(props?: SystemProps) {
  return (
    <Icon viewBox="0 0 24 24" w="20px" h="20px" {...props}>
      <path
        d="M19 2a1 1 0 0 1 1 1v3h-2V4H6v16h12v-2h2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h14Zm-1 6 5 4-5 4v-3h-7v-2h7V8Z"
        fill="currentColor"
      />
    </Icon>
  );
}
