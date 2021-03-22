import React from "react";

import { useFetch } from "../../../../common/hooks/useFetch";

const withReseauxData = (Component) => {
  const WithReseauxData = (props) => {
    const [reseaux] = useFetch("/api/referentiel/networks");

    return <Component {...props} reseaux={reseaux || []} />;
  };

  return WithReseauxData;
};

export default withReseauxData;
