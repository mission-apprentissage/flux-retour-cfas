import { FormControl, FormLabel, Radio, RadioGroup, VStack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { categoriesCompteInscription } from "@/modules/auth/inscription/categories";
import InscriptionWrapper from "@/modules/auth/inscription/InscriptionWrapper";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const RegisterPage = () => {
  const router = useRouter();
  return (
    <InscriptionWrapper>
      <FormControl>
        <FormLabel>Vous représentez&nbsp;:</FormLabel>
        <RadioGroup id="type" name="type" mt={8}>
          <VStack alignItems="baseline" fontSize="1.2rem" spacing={8}>
            {categoriesCompteInscription.map((item, i) => {
              return (
                <Radio
                  key={i}
                  value={item.value}
                  onChange={(e) => {
                    router.push(`/auth/inscription/${e.target.value}`);
                  }}
                  size="lg"
                >
                  {item.text}
                </Radio>
              );
            })}
          </VStack>
        </RadioGroup>
      </FormControl>
    </InscriptionWrapper>
  );
};

export default RegisterPage;
