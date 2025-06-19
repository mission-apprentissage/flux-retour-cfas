import { FormControl, FormLabel, Select } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { IOrganisationMissionLocale, DEPARTEMENTS_BY_CODE } from "shared";

import { _get } from "@/common/httpClient";

import { InscriptionOrganistionChildProps } from "./common";

const typesOrganisation = [
  {
    label: "L'UNML (Union Nationale)",
    value: "UNML",
  },
  {
    label: "Une ARML (Agence Régionale)",
    value: "ARML",
  },
  {
    label: "Une Mission locale",
    value: "ML",
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

  return (
    <>
      <FormControl isRequired onChange={(e: any) => setTypeOrganisation(e.target.value)} mb={4}>
        <FormLabel>Vous représentez :</FormLabel>
        <Select placeholder="Sélectionner un opérateur public">
          {typesOrganisation.map((option, index) => (
            <option value={option.value} key={index}>
              {option.label}
            </option>
          ))}
        </Select>
      </FormControl>

      {/* {typeOrganisation === "ARML" && (
                <FormControl isRequired>
                    <FormLabel>Votre territoire :</FormLabel>
                    <Select
                        placeholder="Sélectionner un territoire"
                        onChange={(e) =>
                            setOrganisation({
                                type: typeOrganisation,
                                code_academie: e.target.value as IAcademieCode,
                            })
                        }
                    >
                        {ACADEMIES_SORTED.map((option, index) => (
                            <option value={option.code} key={index}>
                                {option.nom}
                            </option>
                        ))}
                    </Select>
                </FormControl>
            )} */}

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
