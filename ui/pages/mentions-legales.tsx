import { ExtendedRecordMap } from "notion-types";

import { _get } from "@/common/httpClient";
import { NotionDoc } from "@/components/NotionDoc";
import SimplePage from "@/components/Page/SimplePage";

import "react-notion-x/src/styles.css";

export async function getServerSideProps() {
  const data = await _get("/mentions-legales");
  return { props: { data } };
}

export default function Home({ data }: { data: ExtendedRecordMap }) {
  return (
    <SimplePage title="Mentions légales">
      <NotionDoc recordMap={data} />
    </SimplePage>
  );
}
