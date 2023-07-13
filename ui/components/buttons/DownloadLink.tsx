import { DownloadIcon } from "@chakra-ui/icons";
import { Button, ButtonProps } from "@chakra-ui/react";
import { useState } from "react";

import useToaster from "@/hooks/useToaster";

type Props = {
  action: (() => Promise<any>) | (() => any);
  children: React.ReactNode;
} & ButtonProps;

function DownloadLinkButton({ children, action, ...props }: Props) {
  const { toastError } = useToaster();
  const [isLoading, setIsLoading] = useState(false);

  async function onClick() {
    try {
      setIsLoading(true);
      await action();
    } catch (err) {
      toastError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant={"link"}
      fontSize="sm"
      mt="2"
      borderBottom={isLoading ? "0" : "1px"}
      borderRadius="0"
      p="0"
      _active={{
        color: "bluefrance",
      }}
      isLoading={isLoading}
      onClick={onClick}
      {...props}
    >
      {children}
      <DownloadIcon ml="2" />
    </Button>
  );
}

export default DownloadLinkButton;
