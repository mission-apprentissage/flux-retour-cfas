import { Box, Button, FormControl, FormLabel, Heading, Select } from "@chakra-ui/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

import { _get } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export const reseauxData = [
  { _id: "MFR", label: "MFR", value: "mfr" },
  { _id: "CR_NORMANDIE", label: "CR Normandie", value: "cr-normandie" },
  { _id: "AFTRAL", label: "AFTRAL", value: "aftral" },
  { _id: "CCI", label: "CCI", value: "cci" },
  { _id: "CMA", label: "CMA", value: "cma" },
  { _id: "ADEN", label: "ADEN", value: "aden" },
  { _id: "AGRI", label: "AGRI", value: "agri" },
  { _id: "COMPAGNONS_DU_TOUR_DE_FRANCE", label: "Compagnons du tour de france", value: "compagnons-du-tour-de-france" },
  { _id: "UIMM", label: "UIMM", value: "uimm" },
  { _id: "GRETA", label: "GRETA", value: "greta" },
  { _id: "EDUC_NAT", label: "EDUC. NAT", value: "educ-nat" },
  { _id: "AMUE", label: "AMUE", value: "amue" },
  { _id: "CFA_EC", label: "CFA EC", value: "cfa-ec" },
  { _id: "COMPAGNONS_DU_DEVOIR", label: "Compagnons du devoir", value: "compagnons-du-devoir" },
  { _id: "EDUSERVICE", label: "Eduservice", value: "eduservice" },
  { _id: "AFPA", label: "AFPA", value: "afpa" },
  { _id: "AGRI_UNMFREO", label: "AGRI UNMFREO", value: "agri-unmfreo" },
  { _id: "EN_HORS_MURS", label: "EN Hors Murs", value: "en-hors-murs" },
] as const;

const Users = () => {
  const title = "Gestion des réseaux";
  const router = useRouter();
  const [selectedNetwork, setSelectedNetwork] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedNetwork(event.target.value);
  };

  const handleNavigation = () => {
    if (selectedNetwork) {
      router.push(`/admin/reseaux/${selectedNetwork}`);
    }
  };

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>

      <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700">
        {title}
      </Heading>
      <Box maxW="fit-content" mt={8}>
        <FormControl mb={4}>
          <FormLabel>Sélectionnez le réseau à mettre à jour :</FormLabel>
          <Select placeholder="Sélectionner un réseau" onChange={handleChange}>
            {reseauxData.map((option, index) => (
              <option value={option.value} key={index}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>
        <Button onClick={handleNavigation} variant="primary" mr={5} mt={4} isDisabled={!selectedNetwork}>
          Modifier ce réseau
        </Button>
      </Box>
    </Page>
  );
};

export default withAuth(Users, ["ADMINISTRATEUR"]);
