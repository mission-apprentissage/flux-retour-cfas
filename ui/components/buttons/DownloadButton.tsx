import { Button, ButtonProps } from "@chakra-ui/react";
import { useState } from "react";

import { sleep } from "@/common/utils/misc";
import useToaster from "@/hooks/useToaster";
import { DownloadLine } from "@/theme/components/icons";

type Props = {
  action: (() => Promise<any>) | (() => any);
  children: React.ReactNode;
} & ButtonProps;

function DownloadButton({ children, action, ...props }: Props) {
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
      variant="secondary"
      mt="2"
      borderBottom={isLoading ? "0" : "1px"}
      borderRadius="0"
      p="4"
      _active={{
        color: "bluefrance",
      }}
      isLoading={isLoading}
      onClick={onClick}
      leftIcon={<DownloadLine />}
      {...props}
    >
      {children}
    </Button>
  );
}

export default DownloadButton;
