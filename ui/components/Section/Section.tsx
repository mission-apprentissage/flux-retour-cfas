import { Box, BoxProps, Container } from "@chakra-ui/react";

type SectionProps = {
  children: React.ReactNode;
} & BoxProps;

export default function Section({ children, ...otherProps }: SectionProps) {
  return (
    <Box w="100%" pt={[4, 8]} {...otherProps}>
      <Container maxWidth="xl">{children}</Container>
    </Box>
  );
}
