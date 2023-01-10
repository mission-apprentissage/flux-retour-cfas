import React from "react";
import { Box, Text, Link } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import ChakraUIMarkdownRenderer from "chakra-ui-markdown-renderer";

import Ribbons from "../Ribbons/Ribbons";
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

  if (loading || (!messagesAlertEnabled.length && !messagesInfoEnabled.length)) return null;
  return (
    <Box>
      {messagesAlertEnabled.length > 0 && (
        <Ribbons variant="warning">
          <Text color="grey.800">
            <Messages messages={messagesAlertEnabled} />
          </Text>
        </Ribbons>
      )}
      {messagesInfoEnabled.length > 0 && (
        <Ribbons variant="info">
          <Text color="grey.800">
            <Messages messages={messagesInfoEnabled} />
          </Text>
        </Ribbons>
      )}
    </Box>
  );
};

export default AlertMessage;
