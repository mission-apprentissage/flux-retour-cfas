import { Box, Container } from "@chakra-ui/react";

export default function Section({ children, ...otherProps }) {
  return (
    <Box width="100%" paddingTop={[4, 8]} px={[1, 1, 6, 8]} {...otherProps}>
      <Container maxWidth="xl">{children}</Container>
    </Box>
  );
}
