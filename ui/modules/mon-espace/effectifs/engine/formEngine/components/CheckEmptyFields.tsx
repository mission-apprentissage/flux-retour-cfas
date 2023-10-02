import { Box, Button, Collapse, Text, List, ListItem, ListIcon, Link, Flex } from "@chakra-ui/react";
import React, { useState } from "react";
import { useRecoilValue } from "recoil";

import Ribbons from "@/components/Ribbons/Ribbons";
import { EffectifFormStatusStatusGetter } from "@/modules/mon-espace/effectifs/engine/formEngine/atoms";
import { useEffectifFormController } from "@/modules/mon-espace/effectifs/engine/formEngine/EffectifFormControllerContext";
import { ArrowRightLine, ErrorIcon } from "@/theme/components/icons";

// eslint-disable-next-line react/display-name
const CheckEmptyFields = React.memo(({ schema, blocName }: { schema: any; blocName: string }) => {
  const controller = useEffectifFormController();
  const [isOpen, setIsOpen] = useState(false);

  const effectifFormStatus = useRecoilValue<any>(EffectifFormStatusStatusGetter);

  const invalidFields = effectifFormStatus[blocName].fieldErrors;
  const success = effectifFormStatus[blocName].complete;
  const checkFields = () => controller.triggerValidation(Object.keys(schema), true);
  const nbErrors = Object.keys(effectifFormStatus.global.errors).length + invalidFields.length;

  return (
    <Box mt={10}>
      <Button
        mr={4}
        size="md"
        variant="secondary"
        onClick={async () => {
          await checkFields();
          setIsOpen(true);
        }}
      >
        Est-ce que tous mes champs sont remplis ?
      </Button>
      <Collapse in={isOpen} animateOpacity unmountOnExit>
        <Ribbons variant={success ? "success" : "error"} mt={5} oneLiner={success}>
          {success ? (
            <Text>Tous les champs sont remplis</Text>
          ) : (
            <>
              <Flex w="full" ml={10}>
                <Text>
                  <ErrorIcon boxSize="4" color="flaterror" mt="-0.125rem" mr={2} />
                  {nbErrors} champ(s) non remplis :
                </Text>
              </Flex>
              <List spacing={3} mt={3} ml={5}>
                {invalidFields.map(({ name, label }) => {
                  return (
                    <ListItem key={name}>
                      <ListIcon as={ArrowRightLine} color="flaterror" />
                      <Link
                        onClick={() => {
                          const element = document.getElementById(`${name.replaceAll(".", "_")}-label`);
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                        textDecoration="underline"
                      >
                        {label.replace(":", "")}
                      </Link>
                    </ListItem>
                  );
                })}
                {Object.entries(effectifFormStatus.global.errors).map(([target, error]: [any, any]) => (
                  <ListItem key={target}>
                    <ListIcon as={ArrowRightLine} color="flaterror" />
                    <Link
                      onClick={() => {
                        const element = document.getElementById(`${target}_bloc_section-label`);
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      textDecoration="underline"
                    >
                      {error.error}
                    </Link>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Ribbons>
      </Collapse>
    </Box>
  );
});

export default CheckEmptyFields;
