import { GetStaticProps, InferGetStaticPropsType } from "next";
import Image from "next/image";
import Link from "next/link";
import { NotionAPI } from "notion-client";
import { ExtendedRecordMap } from "notion-types";
import { NotionRenderer } from "react-notion-x";

import { _get } from "@/common/httpClient";
import SimplePage from "@/components/Page/SimplePage";

import "react-notion-x/src/styles.css";

export const getStaticProps = (async () => {
  const notion = new NotionAPI();
  const recordMap = await notion.getPage("Page-d-Aide-FAQ-dbb1eddc954441eaa0ba7f5c6404bdc0");
  return { props: { data: recordMap }, revalidate: 60 * 30 };
}) satisfies GetStaticProps<{
  data: ExtendedRecordMap;
}>;

export default function FAQNotionPage({ data }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <SimplePage title="Page d’Aide & FAQ">
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
