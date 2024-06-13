import { Link, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React from "react";

import { FAQ_PATH } from "@/common/constants/faq";
import InscriptionWrapper from "@/modules/auth/inscription/InscriptionWrapper";

export default function InscriptionOrganismeInconnu() {
  const router = useRouter();
  return (
    <InscriptionWrapper>
      <Text fontWeight={700}>Vous ne connaissez ni l’UAI ni le SIRET de votre organisme.</Text>
      <Text my="3w">
        Vous pouvez le retrouver facilement en consultant le{" "}
        <Link
          href={"https://referentiel.apprentissage.onisep.fr/"}
          fontWeight={700}
          color="bluefrance"
          whiteSpace="nowrap"
        >
          référentiel de l’apprentissage
        </Link>
        . Vous pouvez aussi consulter la{" "}
        <Link href={FAQ_PATH} fontWeight={700} color="bluefrance" whiteSpace="nowrap">
          FAQ
        </Link>{" "}
        du tableau de bord.
      </Text>
      <Link
        onClick={() => {
          router.back();
        }}
        color="bluefrance"
        borderBottom="1px solid"
        _hover={{ cursor: "pointer", textDecoration: "none", borderBottom: "2px solid" }}
      >
        Retour à l’étape précédente
      </Link>
    </InscriptionWrapper>
  );
}
