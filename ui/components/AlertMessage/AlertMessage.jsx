import React from "react";
import { Box, Alert, AlertIcon, AlertTitle, AlertDescription, Text, Link } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import ChakraUIMarkdownRenderer from "chakra-ui-markdown-renderer";

import useMaintenanceMessages from "../../hooks/useMaintenanceMessages";

const chakraUIMarkdownRendererTheme = {
  // we override anchors to reformat the link (aka remove the '##') and add an icon.
  a: ({ children, href, ...rest }) => (
    <Link textDecoration={"underline"} fontSize="md" isExternal {...rest} href={href.replace(/^##/, "")}>
      {children}
    </Link>
  ),
  p: ({ children }) => <p>{children}</p>,
};
const Messages = ({ messages }) => (
  <>
    {messages.map((element) => (
      <Text as="div" key={element._id}>
        <ReactMarkdown components={ChakraUIMarkdownRenderer(chakraUIMarkdownRendererTheme)} skipHtml>
          {element?.msg}
        </ReactMarkdown>
      </Text>
    ))}
  </>
);

const AlertMessage = () => {
  const { messagesAlert, messagesInfo, loading } = useMaintenanceMessages();
  const messagesAlertEnabled = messagesAlert?.filter((message) => message.enabled);
  const messagesInfoEnabled = messagesInfo?.filter((message) => message.enabled);

  if (loading || (!messagesAlertEnabled?.length && !messagesInfoEnabled?.length)) return null;
  return (
    <Box>
      {messagesAlertEnabled.length > 0 && (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle mr={3}>Alerte</AlertTitle>
          <AlertDescription>
            <Messages messages={messagesAlertEnabled} />
          </AlertDescription>
        </Alert>
      )}
      {messagesInfoEnabled.length > 0 && (
        <Alert status="info">
          <AlertIcon />
          <AlertTitle mr={3}>Info</AlertTitle>
          <AlertDescription>
            <Messages messages={messagesInfoEnabled} />
          </AlertDescription>
        </Alert>
      )}
    </Box>
  );
};

export default AlertMessage;
