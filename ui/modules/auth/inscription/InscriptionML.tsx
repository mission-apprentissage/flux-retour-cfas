import { FormControl, FormLabel, Radio, RadioGroup, Select, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { IOrganisationMissionLocale, DEPARTEMENTS_BY_CODE, IOrganisationARML } from "shared";

import { _get } from "@/common/httpClient";

import { InscriptionOrganistionChildProps } from "./common";

const typesOrganisation = [
  {
    label: "L'UNML (Union Nationale)",
    value: "UNML",
    disabled: true,
  },
  {
    label: "Une ARML (Agence Régionale)",
    value: "ARML",
    disabled: false,
  },
  {
    label: "Une Mission locale",
    value: "ML",
    disabled: false,
  },
] as const;

type TypeOrganisation = (typeof typesOrganisation)[number]["value"];

export const InscriptionML = ({ setOrganisation }: InscriptionOrganistionChildProps) => {
  const [typeOrganisation, setTypeOrganisation] = useState<TypeOrganisation | null>(null);
  const [departementList, setDepartementList] = useState<Record<string, Array<IOrganisationMissionLocale>>>({});

  const [missionLocaleList, setMissionLocaleList] = useState<Array<IOrganisationMissionLocale>>([]);

  const { data: missionLocales } = useQuery<Array<IOrganisationMissionLocale>>(["mission-locale"], async () =>
    _get("/api/v1/mission-locale")
  );

  const { data: armls } = useQuery<Array<IOrganisationARML>>(["arml"], async () => _get("/api/v1/mission-locale/arml"));

  useEffect(() => {
    if (missionLocales) {
      setDepartementList(
        missionLocales.reduce((acc, curr) => {
          if (!curr.adresse?.departement) {
            return acc;
          }
          return {
            ...acc,
            [curr.adresse?.departement]: acc[curr.adresse?.departement]
              ? [...acc[curr.adresse?.departement], curr]
              : [curr],
          };
        }, {})
      );
    }
  }, [missionLocales]);

  const onSelectedDepartement = (code: string) => {
    setMissionLocaleList(departementList[code]);
  };

  const onSelectedMissionLocale = (mlId: string) => {
    const ml = missionLocaleList.find(({ _id }) => _id.toString() === mlId);
    if (ml) {
      setOrganisation(ml);
    }
  };

  const onSelectedArml = (armlId: string) => {
    const arml = armls?.find(({ _id }) => _id.toString() === armlId);
    if (arml) {
      setOrganisation(arml);
    }
  };

  return (
    <>
      <FormControl isRequired onChange={(e: any) => setTypeOrganisation(e.target.value)} mb={8}>
        <FormLabel>Vous représentez :</FormLabel>
        <RadioGroup id="type" name="type" mt={8}>
          <VStack alignItems="baseline" fontSize="1.2rem" spacing={8}>
            {typesOrganisation.map((item, i) => {
              return (
                <Radio key={i} value={item.value} size="lg" isDisabled={item.disabled}>
                  {item.label}
                </Radio>
              );
            })}
          </VStack>
        </RadioGroup>
      </FormControl>

      {typeOrganisation === "ARML" && (
        <FormControl isRequired mb={4}>
          <FormLabel>Votre ARML :</FormLabel>
          <Select placeholder="Sélectionner une ARML" onChange={(e) => onSelectedArml(e.target.value)}>
            {armls?.sort().map((arml) => (
              <option value={arml._id.toString()} key={arml._id.toString()}>
                {arml.nom}
              </option>
            ))}
          </Select>
        </FormControl>
      )}

      {typeOrganisation === "ML" && (
        <FormControl isRequired mb={4}>
          <FormLabel>Votre département :</FormLabel>
          <Select placeholder="Sélectionner un département" onChange={(e) => onSelectedDepartement(e.target.value)}>
            {Object.keys(departementList)
              .sort()
              .map((dpt) => (
                <option value={dpt} key={dpt}>
                  {dpt} - {DEPARTEMENTS_BY_CODE[dpt].nom}
                </option>
              ))}
          </Select>
        </FormControl>
      )}

      {typeOrganisation === "ML" && !!missionLocaleList.length && (
        <FormControl isRequired>
          <FormLabel>Votre Mission locale :</FormLabel>
          <Select
            placeholder="Sélectionner une Mission locale"
            onChange={(e) => onSelectedMissionLocale(e.target.value)}
          >
            {missionLocaleList.map((ml) => (
              <option value={ml._id.toString()} key={ml._id.toString()}>
                {ml.nom} - {ml.adresse?.code_postal}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
    </>
  );
};
