import React from "react";
import { Heading } from "@chakra-ui/react";
import { useEspace } from "../../../hooks/useEspace";
import { useOrganisme } from "../../../hooks/useOrganisme";

const ParametresOrganisme = () => {
  const { myOrganisme, isMonOrganismePages, isOrganismePages } = useEspace();
  const { organisme } = useOrganisme();

  // eslint-disable-next-line no-unused-vars
  const curentOrganisme = myOrganisme || organisme;

  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5}>
        {isMonOrganismePages && `Paramètres de mon organisme`}
        {isOrganismePages && `Paramètres de son organisme`}
      </Heading>
    </>
  );
};

export default ParametresOrganisme;
