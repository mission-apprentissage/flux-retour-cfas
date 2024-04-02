import {
  Stack,
  Radio,
  ModalContent,
  ModalOverlay,
  Button,
  Modal,
  Text,
  ModalHeader,
  ModalBody,
  ModalFooter,
  HStack,
  VStack,
  RadioGroup,
} from "@chakra-ui/react";
import { useState } from "react";

import { ArrowRightLine, Close } from "@/theme/components/icons";

const MODE = {
  MANUEL: "MANUEL",
  EXCEL: "EXCEL",
};

const path = {
  [MODE.MANUEL]: "new",
  [MODE.EXCEL]: "televersement",
};
const radioStyle = {
  alignItems: "start",
  paddingTop: "20px",
};

const subTitleRadioStyle = {
  color: "#666",
  fontFamily: "Marianne",
  fontSize: "12px",
  fontStyle: "normal",
  fontWeight: 400,
  lineHeight: "20px",
};

const SelectionAjoutEffectifModal = ({ onClose, onValidate, title, isOpen }) => {
  const [value, setValue] = useState(MODE.MANUEL);
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay bg="rgba(0, 0, 0, 0.48)" />
      <ModalContent>
        <Button
          display={"flex"}
          alignSelf={"flex-end"}
          color="bluefrance"
          fontSize={"epsilon"}
          onClick={() => {
            onClose();
          }}
          variant="link"
          fontWeight={400}
          p={0}
          m={4}
        >
          <Text as={"span"}>
            Fermer <Close boxSize={4} />
          </Text>
        </Button>
        <ModalHeader>
          <ArrowRightLine mt="-0.5rem" />
          <Text as="span" ml="1rem" textStyle={"h4"}>
            {title}
          </Text>
        </ModalHeader>
        <ModalBody pb={6}>
          <RadioGroup onChange={setValue} value={value}>
            <Stack>
              <Radio size="lg" name={MODE.MANUEL} value={MODE.MANUEL}>
                <VStack style={radioStyle}>
                  <Text>Ajouter manuellement un apprenant</Text>
                  <Text style={subTitleRadioStyle}>Idéal si vous avez un ou moins de 5 apprenants à déclarer </Text>
                </VStack>
              </Radio>
              <Radio size="lg" name={MODE.EXCEL} value={MODE.EXCEL}>
                <VStack style={radioStyle}>
                  <Text>Ajouter plusieurs apprenants via l’ajout d’un fichier Excel</Text>
                  <Text style={subTitleRadioStyle}>Idéal si vous avez plus de 5 apprenants à déclarer</Text>
                </VStack>
              </Radio>
            </Stack>
          </RadioGroup>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={4}>
            <Button
              variant="secondary"
              onClick={() => {
                onClose?.();
              }}
              type="submit"
            >
              <Text as="span">Annuler</Text>
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onValidate?.(path[value]);
              }}
              type="submit"
            >
              <Text as="span">Valider</Text>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SelectionAjoutEffectifModal;
