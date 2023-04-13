import { useToast, UseToastOptions } from "@chakra-ui/react";

export default function useToaster() {
  const toast = useToast();

  const toastSuccess = (title: UseToastOptions["title"], options?: UseToastOptions) =>
    toast({
      title,
      status: "success",
      isClosable: true,
      ...options,
    });

  const toastError = (title: UseToastOptions["title"], options?: UseToastOptions) =>
    toast({
      title,
      status: "error",
      isClosable: true,
      ...options,
    });

  return { toastError, toastSuccess };
}
