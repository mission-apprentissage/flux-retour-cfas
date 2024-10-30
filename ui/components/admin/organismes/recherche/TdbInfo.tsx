import { HStack, SimpleGrid, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { OrganismeSupportInfoJson } from "shared";

import { formatDateDayMonthYear } from "@/common/utils/dateUtils";

import { CardInfo } from "./CarInfo";
import { Label } from "./Label";

function TdbInfoContent({ organisme, organisation }) {
  const reseaux = useMemo(() => organisme.reseaux ?? [], [organisme]);
  const nom = useMemo(() => organisme.nom ?? "inconnue", [organisme]);
  const opcos = useMemo(() => organisme.opcos ?? [], [organisme]);
  const userCount = useMemo(() => organisation?.users.length ?? 0, [organisation]);
  const derniereConnection = useMemo(() => {
    if (!organisation) return null;

    return organisation.users.reduce((acc, user) => {
      if (user.last_connection == null) return acc;
      if (acc === null) return user;
      return acc.getTime() < user.last_connection.getTime() ? user.last_connection : acc;
    }, null);
  }, [organisation]);

  return (
    <>
      <HStack>
        <Text fontSize="zeta">Nom :</Text>
        {<Label level={nom === "inconnue" ? "error" : "info"} value={nom} />}
      </HStack>
      <HStack>
        <Text fontSize="zeta">Réseaux :</Text>
        {reseaux.length === 0 && <Label value="Aucun" />}
        {reseaux.map((e) => (
          <Label key={e} value={e} />
        ))}
      </HStack>
      <HStack>
        <Text fontSize="zeta">OPCOs :</Text>
        {opcos.length === 0 && <Label level="warning" value="Aucun" />}
        {opcos.map((e) => (
          <Label key={e} value={e} />
        ))}
      </HStack>
      <HStack>
        <Text fontSize="zeta">Utilisateurs :</Text>
        <Label level={userCount === 0 ? "warning" : "info"} value={userCount} />
      </HStack>
      <HStack>
        <Text fontSize="zeta">Dernière connection :</Text>
        <Label value={derniereConnection ? formatDateDayMonthYear(derniereConnection) : "jamais"} />
      </HStack>
      <HStack>
        <Text fontSize="zeta">Fiabilisation :</Text>
        {
          <Label
            level={organisme.fiabilisation_statut === "FIABLE" ? "success" : "error"}
            value={organisme.fiabilisation_statut}
          />
        }
      </HStack>
    </>
  );
}

function TransmissionInfoContent({ organisme }) {
  const erps = useMemo(() => organisme.erps ?? [], [organisme]);
  return (
    <>
      <HStack>
        <Text fontSize="zeta">ERPs :</Text>
        {erps.length === 0 && <Label level="warning" value="Aucun" />}
        {erps.map((e) => (
          <Label key={e} value={e} level={erps.length === 1 ? "info" : "warning"} />
        ))}
      </HStack>
      <HStack>
        <Text fontSize="zeta">Première transmission :</Text>
        {
          <Label
            level={organisme.first_transmission_date ? "info" : "error"}
            value={organisme.first_transmission_date ? organisme.first_transmission_date : "Jamais"}
          />
        }
      </HStack>
      <HStack>
        <Text fontSize="zeta">Dernière transmission :</Text>
        {
          <Label
            level={organisme.last_transmission_date ? "info" : "error"}
            value={organisme.last_transmission_date ? organisme.last_transmission_date : "Jamais"}
          />
        }
      </HStack>
      <HStack>
        <Text fontSize="zeta">Version API :</Text>
        {<Label level={organisme.api_version === "v3" ? "info" : "error"} value={organisme.api_version ?? "Aucune"} />}
      </HStack>
    </>
  );
}

type TdbInfoProps = {
  organisme: OrganismeSupportInfoJson["tdb"] | null;
  organisation: OrganismeSupportInfoJson["organisation"] | null;
};

export function TdbInfo({ organisme, organisation }: TdbInfoProps) {
  if (!organisme) {
    return (
      <CardInfo title="Tableau de bord">
        <Label level="error" value="Non trouvé" />
      </CardInfo>
    );
  }

  return (
    <SimpleGrid templateColumns="repeat(2, 1fr)" spacing="2">
      <CardInfo title="Tableau de bord">
        <TdbInfoContent organisme={organisme} organisation={organisation} />
      </CardInfo>
      <CardInfo title="Transmission">
        <TransmissionInfoContent organisme={organisme} />
      </CardInfo>
    </SimpleGrid>
  );
}
