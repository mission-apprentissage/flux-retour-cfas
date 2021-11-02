import { Box } from "@chakra-ui/react";
import React, { useState } from "react";

import { AppHeader } from "../../common/components";
import { _post } from "../../common/httpClient";
import DemandeAccesBlock from "./DemandeAccesBlock";
import SuccessBlock from "./SuccessBlock";

const DemandeAccesPage = () => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const submitDemandeAcces = async (values, { setStatus }) => {
    try {
      await _post("/api/demande-acces", values);
      setShowSuccessMessage(true);
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
    }
  };

  return (
    <>
      <AppHeader />
      <Box paddingY="6w" paddingLeft="120px" boxShadow="inset 0px 12px 12px 0px rgba(30, 30, 30, 0.08)">
        {showSuccessMessage ? <SuccessBlock /> : <DemandeAccesBlock onSubmit={submitDemandeAcces} />}
      </Box>
    </>
  );
};

export default DemandeAccesPage;
