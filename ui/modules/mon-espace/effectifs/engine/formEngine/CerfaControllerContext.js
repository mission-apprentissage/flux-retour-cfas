import React, { useContext } from "react";

export const CerfaControllerContext = React.createContext(undefined);

export const useCerfaController = () => {
  return useContext(CerfaControllerContext);
};
