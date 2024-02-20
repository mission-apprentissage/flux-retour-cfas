import { HStack, Text, Wrap } from "@chakra-ui/react";
import { useMemo } from "react";

import { CardInfo } from "./CarInfo";
import { Label } from "./Label";

function ReferentielContent({ organisme }) {
  const adresse = useMemo(() => organisme.adresse?.label ?? "inconnue", [organisme]);

  const formateurs = useMemo(
    () => organisme.relations?.filter((r) => r.type === "responsable->formateur").length ?? 0,
    [organisme]
  );
  const responsables = useMemo(
    () => organisme.relations?.filter((r) => r.type === "formateur->responsable").length ?? 0,
    [organisme]
  );
  const contacts = useMemo(() => organisme.contacts ?? [], [organisme]);

  return (
    <>
      <HStack>
        <Text fontSize="zeta">Adresse :</Text>
        <Label level={adresse === "inconnue" ? "error" : "info"} value={adresse} />
      </HStack>
      <HStack>
        <Text fontSize="zeta">Formateurs :</Text>
        <Label value={formateurs} />
      </HStack>
      <HStack>
        <Text fontSize="zeta">Responsables :</Text>
        <Label value={responsables} />
      </HStack>
      <HStack>
        <Text fontSize="zeta">Contacts :</Text>
        <Wrap>
          {contacts.length === 0 && <Label level="warning" value="Aucun" />}
          {contacts.map((e) => (
            <Label
              key={e}
              value={e.confirmé ? `${e.email} (confirmé)` : `${e.email} (non confirmé)`}
              level={e.confirmé ? "success" : "info"}
            />
          ))}
        </Wrap>
      </HStack>
    </>
  );
}

type ReferentielInfoProps = {
  // TODO: Share type in shared
  organisme?: any | null | undefined;
};

export function ReferentielInfo({ organisme }: ReferentielInfoProps) {
  if (!organisme) {
    return (
      <CardInfo title="Référentiel">
        <Label level="error" value="Non trouvé" />
      </CardInfo>
    );
  }

  return (
    <CardInfo title="Référentiel">
      <ReferentielContent organisme={organisme} />
    </CardInfo>
  );
}
