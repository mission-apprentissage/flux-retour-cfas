import { Button } from "@chakra-ui/react";

function ButtonTeleversement({
  children,
  href,
  ...props
}: {
  children: React.ReactNode;
  href?: string;
  [x: string]: any;
}) {
  return (
    <Button
      as="a"
      variant={"link"}
      target="_blank"
      fontSize="md"
      borderBottom="1px"
      borderRadius="0"
      lineHeight="6"
      p="0"
      _active={{
        color: "bluefrance",
      }}
      href={href || "#"}
      {...props}
    >
      {children}
    </Button>
  );
}

export default ButtonTeleversement;
