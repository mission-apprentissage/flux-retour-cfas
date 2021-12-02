import React from "react";
import { useQuery } from "react-query";

import { fetchReseaux } from "../../../../../common/api/tableauDeBord";

const withReseauxData = (Component) => {
  const WithReseauxData = (props) => {
    // reseaux are very unlikely during the user's session, thus the infinite staleTime
    const { data: reseaux } = useQuery("reseaux", () => fetchReseaux(), { staleTime: Infinity });

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
