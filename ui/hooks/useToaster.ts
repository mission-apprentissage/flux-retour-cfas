import { useToast } from "@chakra-ui/react";

export default function useToaster() {
  const toast = useToast();

  const toastSuccess = (title, options) =>
    toast({
      title,
      status: "success",
      isClosable: true,
      ...options,
    });

  const toastError = (title, options) =>
    toast({
      title,
      status: "error",
      isClosable: true,
      ...options,
    });

  return { toastError, toastSuccess };
}
