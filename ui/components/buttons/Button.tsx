import { Button, ButtonProps } from "@chakra-ui/react";
import { useState } from "react";

import { sleep } from "@/common/utils/misc";
import useToaster from "@/hooks/useToaster";

export type AppButtonProps = {
  action: (() => Promise<any>) | (() => any);
  children: React.ReactNode;
} & ButtonProps;

function AppButton({ children, action, ...props }: AppButtonProps) {
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
      variant={props.variant ?? "secondary"}
      borderBottom={isLoading && props.variant === "link" ? "0" : "1px"}
      borderRadius="0"
      _active={{
        color: "bluefrance",
      }}
      isLoading={isLoading}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
}

export default AppButton;
