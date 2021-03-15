/* eslint-disable react/display-name */
import React from "react";

import { useFetch } from "../../../../common/hooks/useFetch";

const withReseauxData = (Component) => (props) => {
  const [reseaux] = useFetch("/api/referentiel/networks");

  return <Component {...props} reseaux={reseaux || []} />;
};

export default withReseauxData;
