import React from "react";

import { useFetch } from "../../../../common/hooks/useFetch";

const withReseauxData = (Component) => {
  const WithReseauxData = (props) => {
    const [reseaux] = useFetch("/api/referentiel/networks");

    const sortedReseaux = reseaux
      ? reseaux.slice().sort((a, b) => {
          if (a.nom < b.nom) return -1;
          if (a.nom > b.nom) return 1;
          return 0;
        })
      : [];

    return <Component {...props} reseaux={sortedReseaux} />;
  };

  return WithReseauxData;
};

export default withReseauxData;
