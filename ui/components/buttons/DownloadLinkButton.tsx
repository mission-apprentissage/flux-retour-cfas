import { DownloadIcon } from "@chakra-ui/icons";
import { Button, ButtonProps } from "@chakra-ui/react";
import { useState } from "react";

import { sleep } from "@/common/utils/misc";
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
      await sleep(300); // évite un changement instantané
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant={"link"}
      mt="2"
      borderBottom={isLoading ? "0" : "1px"}
      borderRadius="0"
      p="0"
      _active={{
        color: "bluefrance",
      }}
      isLoading={isLoading}
      onClick={onClick}
      rightIcon={<DownloadIcon />}
      {...props}
    >
      {children}
    </Button>
  );
}

export default DownloadLinkButton;
