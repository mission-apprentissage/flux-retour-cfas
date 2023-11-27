import { Center, Spinner } from "@chakra-ui/react";
import { GetServerSidePropsContext } from "next";
import { ExtendedRecordMap } from "notion-types";
import { useEffect, useState } from "react";

import { _get } from "@/common/httpClient";
import { NotionDoc } from "@/components/NotionDoc";
import SimplePage from "@/components/Page/SimplePage";

import "react-notion-x/src/styles.css";

const isInitialServerSideProps = (context: GetServerSidePropsContext) =>
  context.req?.url?.indexOf("/_next/data/") === -1;

export const getServerSideProps = async (context) => {
  try {
    const isInitial = isInitialServerSideProps(context);
    if (!isInitial) return { props: {} };
    const dataSSR = await _get("/api/mentions-legales");
    return { props: { dataSSR } };
  } catch (e) {
    console.error(e);
    return { props: {} };
  }
};

export default function Home({ dataSSR }: { dataSSR: ExtendedRecordMap }) {
  const [data, setData] = useState(dataSSR);
  const [isLoading, setIsLoading] = useState(!dataSSR);

  useEffect(() => {
    if (dataSSR) return;
    (async () => {
      setIsLoading(true);
      setData(await _get("/api/mentions-legales"));
      setIsLoading(false);
    })();
  }, []);

  return (
    <SimplePage title="Mentions légales">
      {isLoading ? (
        <Center>
          <Spinner />
        </Center>
      ) : (
        <NotionDoc recordMap={data} />
      )}
    </SimplePage>
  );
}
