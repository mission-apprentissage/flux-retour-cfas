import React from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useRouter } from "next/router";
import InscriptionWrapper from "@/modules/auth/inscription/InscriptionWrapper";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageFormulaireProfil = () => {
  const router = useRouter();
  // TODO extract from url json conf
  console.log(router.query);

  return (
    <InscriptionWrapper>
      {/* {isFetching ? (
        <Spinner />
      ) : (
        etablissement &&
        typeOrganisation && (
          <InscriptionStep2
            flexDirection="column"
            border="1px solid"
            h="100%"
            flexGrow={1}
            borderColor="openbluefrance"
            etablissement={etablissement}
            typeOrganisation={typeOrganisation}
            type={type}
            uai={uai}
            onSucceeded={() => router.push("/auth/inscription/bravo")}
          />
        )
      )} */}
    </InscriptionWrapper>
  );
};

export default PageFormulaireProfil;
