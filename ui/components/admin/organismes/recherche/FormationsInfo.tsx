import { HStack, Text, Wrap } from "@chakra-ui/react";
import { useMemo } from "react";
import { OffreFormation } from "shared/models/data/@types/OffreFormation";
import { IOrganismeJson } from "shared/models/data/organismes.model";

import { CardInfo } from "./CarInfo";
import { Label } from "./Label";

type FormationsInfoContentProps = {
  organisme: IOrganismeJson;
  formations: OffreFormation[];
};

function FormationsInfoContent({ organisme, formations }: FormationsInfoContentProps) {
  const nature = useMemo(() => organisme.nature ?? "inconnue", [organisme]);
  const formateurs = useMemo(() => organisme.organismesFormateurs?.length ?? 0, [organisme]);
  const formateursPartiels = useMemo(
    () => organisme.organismesFormateurs?.filter((formateur) => formateur.responsabilitePartielle).length ?? 0,
    [organisme]
  );
  const responsables = useMemo(() => organisme.organismesResponsables?.length ?? 0, [organisme]);
  const responsablesPartiel = useMemo(
    () => organisme.organismesResponsables?.filter((responsable) => responsable.responsabilitePartielle).length ?? 0,
    [organisme]
  );

  return (
    <>
      <HStack>
        <Text fontSize="zeta">Nature :</Text>
        {<Label level={nature === "inconnue" ? "error" : "info"} value={nature} />}
      </HStack>
      <HStack>
        <Text fontSize="zeta">Formateurs :</Text>
        {<Label value={formateurs} />}
      </HStack>
      <HStack>
        <Text fontSize="zeta">Formateurs Partiels :</Text>
        {<Label level={formateursPartiels === 0 ? "info" : "warning"} value={formateursPartiels} />}
      </HStack>
      <HStack>
        <Text fontSize="zeta">Responsables :</Text>
        {<Label value={responsables} />}
      </HStack>
      <HStack>
        <Text fontSize="zeta">Responsables Partiels :</Text>
        {<Label level={responsablesPartiel === 0 ? "info" : "warning"} value={responsablesPartiel} />}
      </HStack>
      <HStack>
        <Text fontSize="zeta">Formations :</Text>
        <Wrap>
          {formations.length === 0 && <Label level="warning" value="Aucune" />}
          {formations.map((e) => (
            <Label
              key={e.cle_ministere_educatif}
              value={`${e.cfd.code} | ${e.rncps?.map(({ code }) => code)?.join(" | ") || "RNCP Inconnu"}`}
            />
          ))}
        </Wrap>
      </HStack>
    </>
  );
}

type FormationsInfoProps = {
  organisme?: IOrganismeJson | null | undefined;
  formations: OffreFormation[];
};

export function FormationsInfo({ organisme, formations }: FormationsInfoProps) {
  if (!organisme) {
    return null;
  }

  return (
    <CardInfo title="Formations">
      <FormationsInfoContent organisme={organisme} formations={formations} />
    </CardInfo>
  );
}
