import { memo } from "react";
import { useRecoilValue } from "recoil";
import { valuesSelector } from "../atoms";
import { Collapse } from "@chakra-ui/react";

// eslint-disable-next-line react/display-name
export const CollapseController = memo(({ children, show }: { children: any; show?: (args: any) => boolean }) => {
  const values = useRecoilValue<any>(valuesSelector);
  return (
    <Collapse animateOpacity in={show ? show({ values }) : false} unmountOnExit={true}>
      {children}
    </Collapse>
  );
});
