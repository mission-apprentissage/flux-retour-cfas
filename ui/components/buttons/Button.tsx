import { Alert, AlertIcon, Button, ButtonProps } from "@chakra-ui/react";
import { useState } from "react";

import { sleep } from "@/common/utils/misc";

export type AppButtonProps = {
  action: (() => Promise<any>) | (() => any);
  children: React.ReactNode;
} & ButtonProps;

function AppButton({ children, action, ...props }: AppButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    try {
      setError(null);
      setIsLoading(true);
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      await sleep(300); // évite un changement instantané
      setIsLoading(false);
    }
  }

  return (
    <>
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
      {error && (
        <Alert status="error" mt={2}>
          <AlertIcon />
          {error}
        </Alert>
      )}
    </>
  );
}

export default AppButton;
