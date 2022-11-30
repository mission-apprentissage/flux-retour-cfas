import { Box } from "@chakra-ui/react";
import React, {
  memo,
  // useEffect, useRef, useState
} from "react";
// import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box, HStack, Text } from "@chakra-ui/react";
// import { AddFill, StepComplete, StepWip, SubtractLine } from "../../../../../theme/components/icons";
// import { CerfaMaitre } from "./blocks/maitre/CerfaMaitre";
import { EffectifApprenant } from "./blocks/apprenant/EffectifApprenant";
// import { cerfaStatusGetter } from "../formEngine/atoms";
// import { useRecoilValue } from "recoil";
// import { CerfaApprenti } from "./blocks/apprenti/CerfaApprenti";
// import { CerfaContrat } from "./blocks/contrat/cerfaContrat";
// import { CerfaFormation } from "./blocks/formation/CerfaFormation";

// const useOpenAccordionToLocation = () => {
//   const scrolledRef = useRef(false);
//   const { hash } = location;
//   const hashRef = useRef(hash);
//   const [accordionIndex, setAccordionIndex] = useState([]);

//   useEffect(() => {
//     if (hash) {
//       // We want to reset if the hash has changed
//       if (hashRef.current !== hash) {
//         hashRef.current = hash;
//         scrolledRef.current = false;
//       }

//       // only attempt to scroll if we haven't yet (this could have just reset above if hash changed)
//       if (!scrolledRef.current) {
//         const id = hash.replace("#", "");

//         if (id.startsWith("apprenti_")) {
//           setAccordionIndex([1]);
//         }
//       }
//     }
//     return () => {
//       return false;
//     };
//   }, [hash]);

//   return { accordionIndex, setAccordionIndex };
// };

// eslint-disable-next-line react/display-name
export const CerfaForm = memo(() => {
  // const { accordionIndex, setAccordionIndex } = useOpenAccordionToLocation();
  // const cerfaStatus = useRecoilValue(cerfaStatusGetter);

  return (
    <Box my={12} px={5}>
      <EffectifApprenant />
      {/* {cerfaStatus && (
        <Accordion allowMultiple mt={12} minH="25vh" index={accordionIndex} onChange={setAccordionIndex}>
          <AccordionItem border="none" id={`apprenant`}>
            {({ isExpanded }) => (
              <AccordionItemChild
                isExpanded={isExpanded}
                title={"Apprenant"}
                completion={cerfaStatus.apprenant.completion}
              >
                <EffectifApprenant />
              </AccordionItemChild>
            )}
          </AccordionItem>
        </Accordion>
      )} */}
    </Box>
  );
});

// eslint-disable-next-line react/display-name
// const AccordionItemChild = React.memo(({ title, children, completion, isExpanded }) => {
//   return (
//     <>
//       <AccordionButton bg="#F9F8F6">
//         {completion < 100 && <StepWip color={"flatwarm"} boxSize="4" mr={2} />}
//         {completion >= 100 && <StepComplete color={"greensoft.500"} boxSize="4" mr={2} />}
//         <Box flex="1" textAlign="left">
//           <HStack>
//             <Text fontWeight="bold">{title}</Text>
//             <Text> - {Math.round(completion)}%</Text>
//           </HStack>
//         </Box>
//         {isExpanded ? (
//           <SubtractLine fontSize="12px" color="bluefrance" />
//         ) : (
//           <AddFill fontSize="12px" color="bluefrance" />
//         )}
//       </AccordionButton>
//       <AccordionPanel pb={4}>{isExpanded && children}</AccordionPanel>
//     </>
//   );
// });
