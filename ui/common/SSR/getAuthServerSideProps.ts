import { GetServerSidePropsContext } from "next";

const isInitialServerSideProps = (context: GetServerSidePropsContext) =>
  context.req?.url?.indexOf("/_next/data/") === -1;

export const getAuthServerSideProps = async (context) => {
  if (!isInitialServerSideProps(context)) {
    return {};
  }
  try {
    const res = await fetch(`${process.env.SERVER_URI}/api/v1/session`, {
      headers: context.req.headers,
    });
    return {
      auth: res.status === 200 ? await res.json() : null,
    };
  } catch (err) {
    console.error("ssr auth err", err);
    return { auth: null };
  }
};
