import React from "react";
import { Heading } from "@chakra-ui/react";
import { useEspace } from "../../../hooks/useEspace";
import { useOrganisme } from "../../../hooks/useOrganisme";

const EffectifsOrganisme = () => {
  const { myOrganisme, isMonOrganismePages, isOrganismePages } = useEspace();
  const { organisme } = useOrganisme();

  // eslint-disable-next-line no-unused-vars
  const curentOrganisme = myOrganisme || organisme;

  return (
    <>
      <Heading textStyle="h2" color="grey.800" mt={5}>
        {isMonOrganismePages && `Mes effectifs`}
        {isOrganismePages && `Ses effetifs`}
      </Heading>
    </>
  );
};

export default EffectifsOrganisme;
