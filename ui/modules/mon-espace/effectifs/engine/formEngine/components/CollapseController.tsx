import { Collapse } from "@chakra-ui/react";
import { memo } from "react";
import { useRecoilValue } from "recoil";

import { valuesSelector } from "@/modules/mon-espace/effectifs/engine/formEngine/atoms";

// eslint-disable-next-line react/display-name
export const CollapseController = memo(({ children, show }: { children: any; show?: (args: any) => boolean }) => {
  const values = useRecoilValue<any>(valuesSelector);
  return (
    <Collapse animateOpacity in={show ? show({ values }) : false} unmountOnExit={true}>
      {children}
    </Collapse>
  );
});
