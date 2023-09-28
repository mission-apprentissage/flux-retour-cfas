import { Button, ButtonProps } from "@chakra-ui/react";
import { useState } from "react";

import { sleep } from "@/common/utils/misc";
import useToaster from "@/hooks/useToaster";
import { DownloadLine } from "@/theme/components/icons";

type Props = {
  action: (() => Promise<any>) | (() => any);
  children: React.ReactNode;
  asLink?: boolean;
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
      variant={props.asLink ? "link" : "secondary"}
      mt="2"
      margin={props.asLink ? "0" : "8"}
      borderBottom={isLoading ? "0" : "1px"}
      borderRadius="0"
      p={props.asLink ? "0" : "4"}
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
