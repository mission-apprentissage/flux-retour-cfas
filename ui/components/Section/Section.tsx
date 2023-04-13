import { Box, Container } from "@chakra-ui/react";

export default function Section({ children, ...otherProps }) {
  return (
    <Box w="100%" pt={[4, 8]} {...otherProps}>
      <Container maxWidth="xl">{children}</Container>
    </Box>
  );
}
