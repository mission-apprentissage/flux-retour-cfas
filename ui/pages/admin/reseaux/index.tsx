import { Box, Button, FormControl, FormLabel, Heading, Select } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

import { _get } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Page from "@/components/Page/Page";
import withAuth from "@/components/withAuth";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const Users = () => {
  const title = "Gestion des réseaux";
  const router = useRouter();
  const [selectedReseau, setSelectedReseau] = useState<string>();

  const { data: reseauxData } = useQuery<{ _id: string; nom: string }[], any>(
    ["reseau", "admin", "search"],
    ({ signal }) => _get(`/api/v1/admin/reseaux`, { signal }),
    {}
  );

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedReseau(event.target.value);
  };

  const handleNavigation = () => {
    if (selectedReseau) {
      const sanitizedSelectedReseau = encodeURIComponent(selectedReseau);
      router.push(`/admin/reseaux/${sanitizedSelectedReseau}`);
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
            {reseauxData?.map((reseau) => (
              <option value={reseau._id} key={reseau._id}>
                {reseau.nom}
              </option>
            ))}
          </Select>
        </FormControl>
        <Button onClick={handleNavigation} variant="primary" mr={5} mt={4} isDisabled={!selectedReseau}>
          Modifier ce réseau
        </Button>
      </Box>
    </Page>
  );
};

export default withAuth(Users, ["ADMINISTRATEUR"]);
