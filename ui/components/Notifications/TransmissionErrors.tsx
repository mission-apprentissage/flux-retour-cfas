import { CloseIcon } from "@chakra-ui/icons";
import { Flex, IconButton, Link, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";

import { _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";

import Ribbons from "../Ribbons/Ribbons";

const NotificationTransmissionError = ({ organisme }: { organisme: Organisme }) => {
  const [hasTransmissionError, setHasTransmissionError] = useState<boolean>(false);

  useEffect(() => {
    if (organisme?.has_transmission_errors) {
      setHasTransmissionError(true);
    }
  }, [organisme]);

  const onCloseNotification = async () => {
    await _put(`/api/v1/organismes/${organisme._id}/transmission/reset-notification`, {});
    setHasTransmissionError(false);
  };

  return (
    <>
      {hasTransmissionError && (
        <Ribbons variant="alert" mb={6}>
          <Flex justify="space-between" align="center">
            <Text color="grey.800">
              <strong>
                {`Des erreurs dans l’envoi des données ont été détectées${
                  organisme.transmission_errors_date
                    ? ` le ${new Date(organisme.transmission_errors_date).toLocaleDateString()}`
                    : ""
                }`}
              </strong>
              . Consultez le{" "}
              <Link href="/transmissions" display="inline" textDecoration="underline">
                rapport de transmission
              </Link>{" "}
              pour les identifier et les corriger. Une fois la correction effectuée, vous pouvez fermer ce bandeau et
              revenir dans 24h pour vérifier que les erreurs ont disparu.
            </Text>
            <IconButton
              aria-label="Close"
              icon={<CloseIcon />}
              onClick={() => onCloseNotification()}
              size="sm"
              variant="ghost"
              ml={4}
            />
          </Flex>
        </Ribbons>
      )}
    </>
  );
};

export default NotificationTransmissionError;
