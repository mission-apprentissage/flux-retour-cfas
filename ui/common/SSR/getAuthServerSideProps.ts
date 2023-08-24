import { GetServerSidePropsContext } from "next";

const isInitialServerSideProps = (context: GetServerSidePropsContext) =>
  context.req?.url?.indexOf("/_next/data/") === -1;

// par défaut, récupère l'authentification seulement lors d'un accès direct à un page (SSR)
export const getAuthServerSideProps = async (context, onlyOnServerSideRendering = true) => {
  if (onlyOnServerSideRendering && !isInitialServerSideProps(context)) {
    return {};
  }
  try {
    const res = await fetch(`${process.env.SERVER_URI}/api/v1/session`, {
      headers: {
        cookie: context.req.headers.cookie,
      },
    });
    return {
      auth: res.status === 200 ? await res.json() : null,
    };
  } catch (err) {
    return { auth: null };
  }
};
