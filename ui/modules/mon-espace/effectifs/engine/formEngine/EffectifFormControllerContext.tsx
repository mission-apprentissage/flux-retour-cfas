import React, { useContext } from "react";

export const EffectifFormControllerContext = React.createContext(undefined);

export const useEffectifFormController = () => {
  return useContext<any>(EffectifFormControllerContext);
};
