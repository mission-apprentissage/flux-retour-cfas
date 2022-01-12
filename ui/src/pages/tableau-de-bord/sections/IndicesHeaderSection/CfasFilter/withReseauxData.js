import React from "react";
import { useQuery } from "react-query";

import { fetchReseaux } from "../../../../../common/api/tableauDeBord";
import { sortAlphabeticallyBy } from "../../../../../common/utils/sortAlphabetically";

const withReseauxData = (Component) => {
  const WithReseauxData = (props) => {
    // reseaux are very unlikely during the user's session, thus the infinite staleTime
    const { data } = useQuery("reseaux", () => fetchReseaux(), { staleTime: Infinity });

    const reseauxSorted = sortAlphabeticallyBy("nom", data || []);

    return <Component {...props} reseaux={reseauxSorted} />;
  };

  return WithReseauxData;
};

export default withReseauxData;
