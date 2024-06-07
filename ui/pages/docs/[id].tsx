import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Image from "next/image";
import Link from "next/link";
import { NotionAPI } from "notion-client";
import { ExtendedRecordMap } from "notion-types";
import { NotionRenderer } from "react-notion-x";

import { _get } from "@/common/httpClient";
import SimplePage from "@/components/Page/SimplePage";
import NotFound from "ui/pages/404";

import "react-notion-x/src/styles.css";

export const getStaticPaths: GetStaticPaths<{ slug: string }> = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps = (async ({ params }) => {
  let recordMap: ExtendedRecordMap | null = null;
  try {
    const notion = new NotionAPI();
    const id = params?.id as string;
    if (id) {
      recordMap = await notion.getPage(id);
    }
  } catch (e) {
    recordMap = null;
  }
  return { props: { data: recordMap }, revalidate: 60 * 30 };
}) satisfies GetStaticProps<{
  data: ExtendedRecordMap | null;
}>;

export default function DefaultNotionRenderer({ data }: InferGetStaticPropsType<typeof getStaticProps>) {
  if (!data) {
    return <NotFound />;
  }
  return (
    <SimplePage title="Tableau de bord de l'apprentissage">
      <NotionRenderer
        disableHeader={true}
        recordMap={data}
        fullPage={true}
        darkMode={false}
        mapPageUrl={(str) => str}
        components={{
          nextImage: Image,
          nextLink: Link,
        }}
      />
    </SimplePage>
  );
}
