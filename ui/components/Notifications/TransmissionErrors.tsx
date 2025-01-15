import { Flex, Link, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";

import { _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { usePlausibleTracking } from "@/hooks/plausible";

import Ribbons from "../Ribbons/Ribbons";

const NotificationTransmissionError = ({ organisme }: { organisme: Organisme }) => {
  const [hasTransmissionError, setHasTransmissionError] = useState<boolean>(false);
  const { trackPlausibleEvent } = usePlausibleTracking();

  useEffect(() => {
    if (organisme?.has_transmission_errors) {
      setHasTransmissionError(true);
    }
  }, [organisme]);

  return (
    <>
      {hasTransmissionError && (
        <Ribbons variant="alert" mb={6}>
          <Flex justify="space-between" align="center">
            <Text color="grey.800">
              <strong>
                {`Bonjour, des erreurs ont été détectées dans vos données${
                  organisme.transmission_errors_date
                    ? ` le ${new Date(organisme.transmission_errors_date).toLocaleDateString()}`
                    : ""
                }`}
              </strong>
              . Consultez votre{" "}
              <Link
                href="/transmissions"
                display="inline"
                textDecoration="underline"
                onClick={() => trackPlausibleEvent("televersement_clic_rapport_transmission")}
              >
                rapport de transmission
              </Link>{" "}
              pour les identifier et les corriger. Une fois la correction effectuée, revenez dans 24h pour vérifier
              qu’elles ont disparu.
            </Text>
          </Flex>
        </Ribbons>
      )}
    </>
  );
};

export default NotificationTransmissionError;
