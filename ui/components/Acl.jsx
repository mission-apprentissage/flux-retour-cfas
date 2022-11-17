import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Checkbox,
  Flex,
  FormControl,
  Radio,
  RadioGroup,
  VStack,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import React, { useEffect, useState } from "react";

import ACL from "../common/constants/acl";

const specialsAcls = {
  "wks/page_espace/page_dossiers/voir_liste_dossiers": [
    "wks/page_espace/page_dossiers/voir_liste_dossiers/tous",
    "wks/page_espace/page_dossiers/voir_liste_dossiers/instruction_en_cours",
  ],
};

const shouldBeNotAllowed = (acl, ref) => {
  const isAncestorsAllowed = (acl, ref) => {
    const ancestorRef = ref.substring(0, ref.lastIndexOf("/"));
    const hasAncestor = ancestorRef !== "";
    if (hasAncestor) {
      return isAncestorsAllowed(acl, ancestorRef) && acl.includes(ref);
    } else {
      return acl.includes(ref);
    }
  };

  const parentRef = ref.substring(0, ref.lastIndexOf("/"));
  const isRootRef = parentRef === "";

  return isRootRef ? false : !isAncestorsAllowed(acl, parentRef);
};

const rendreACL = (feature, deepth, handleChange, values) => {
  return (
    <>
      {feature.map((item) => {
        let shouldBeDisabled = shouldBeNotAllowed(values.newAcl, item.ref);

        return (
          <Flex flexDirection="column" marginBottom={deepth === 0 ? 5 : 2} key={`${item.ref}_${deepth}`} width="100%">
            <Box marginBottom={2}>
              <Checkbox
                name="newAcl"
                onChange={handleChange}
                value={item.ref}
                isChecked={values.newAcl.includes(item.ref)}
                isDisabled={shouldBeDisabled}
                fontWeight={deepth < 2 ? "bold" : "none"}
              >
                {item.feature}
              </Checkbox>
            </Box>
            {!item.uniqSubFeature && (
              <Box marginLeft={5} paddingRight={14}>
                {item.subFeatures?.map((subitem) => {
                  if (subitem.subFeatures) {
                    return (
                      <Flex flexDirection="column" key={`${subitem.ref}_${deepth}`} marginLeft={5}>
                        {rendreACL([subitem], deepth + 1, handleChange, values)}
                      </Flex>
                    );
                  }

                  return (
                    <VStack spacing={5} marginLeft={5} key={`${subitem.ref}_${deepth}`} alignItems="baseline">
                      <Checkbox
                        name="newAcl"
                        onChange={handleChange}
                        value={subitem.ref}
                        isChecked={values.newAcl.includes(subitem.ref)}
                        isDisabled={shouldBeDisabled || !values.newAcl.includes(item.ref)}
                      >
                        {subitem.feature}
                      </Checkbox>
                    </VStack>
                  );
                })}
              </Box>
            )}
            {item.uniqSubFeature && (
              <Box marginLeft={5} paddingRight={14}>
                <RadioGroup id={`${item.ref}_SUB`} name={`${item.ref}_SUB`} defaultValue={values[`${item.ref}_SUB`]}>
                  <VStack spacing={0} marginLeft={5} alignItems="baseline">
                    {item.subFeatures?.map((subitem) => {
                      return (
                        <Radio
                          key={`${subitem.ref}_${deepth}`}
                          value={subitem.ref}
                          onChange={handleChange}
                          isDisabled={shouldBeDisabled || !values.newAcl.includes(item.ref)}
                        >
                          {subitem.feature}
                        </Radio>
                      );
                    })}
                  </VStack>
                </RadioGroup>
              </Box>
            )}
          </Flex>
        );
      })}
    </>
  );
};

const buildSpecialValues = (previousAcl = []) => {
  const specialskeys = Object.keys(specialsAcls);
  let specialValues = {};
  for (let index = 0; index < specialskeys.length; index++) {
    specialValues[`${specialskeys[index]}_SUB`] = "";
    for (let j = 0; j < specialsAcls[specialskeys[index]].length; j++) {
      const uniq = specialsAcls[specialskeys[index]][j];
      if (previousAcl.includes(uniq)) {
        specialValues[`${specialskeys[index]}_SUB`] = uniq;
      }
    }
  }
  return specialValues;
};

const buildFinalAcl = (newAcl, rest) => {
  let tmp = [...newAcl];
  const specialskeys = Object.keys(specialsAcls);
  for (let index = 0; index < specialskeys.length; index++) {
    tmp = tmp.filter((a) => !specialsAcls[specialskeys[index]].includes(a));
    tmp.push(rest[`${specialskeys[index]}_SUB`]);
  }

  const final = [];
  for (let index = 0; index < tmp.length; index++) {
    const aclRef = tmp[index];
    if (!shouldBeNotAllowed(tmp, aclRef)) {
      final.push(aclRef);
    }
  }
  return final;
};

const Acl = ({ title = "Droits d'accès", acl = [], onChanged }) => {
  const [manualChange, setManualChange] = useState(false);
  const { values, handleChange } = useFormik({
    initialValues: {
      newAcl: acl || [],
      ...buildSpecialValues(acl),
    },
  });

  useEffect(() => {
    if (manualChange) {
      const { newAcl, ...rest } = values;
      const finalAcl = buildFinalAcl(newAcl, rest);
      onChanged(finalAcl);
      setManualChange(false);
    }
  }, [manualChange, onChanged, values]);

  const onAclChanged = (e) => {
    handleChange(e);
    setManualChange(true);
  };

  return (
    <Accordion background="white" marginTop={3} allowToggle>
      <AccordionItem>
        <AccordionButton _expanded={{ bg: "grey.200" }} border={"none"}>
          <Box flex="1" textAlign="left" fontSize="sm">
            {title}
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel paddingBottom={4} border={"none"} background="grey.100">
          <FormControl padding={2}>{rendreACL(ACL, 0, onAclChanged, values)}</FormControl>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};

export default Acl;
