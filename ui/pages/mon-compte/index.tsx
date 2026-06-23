import { GetServerSideProps } from "next";

// « Mon compte » est désormais regroupé dans le hub unifié /compte (App Router).
// On redirige côté serveur (307, sans flash) ; l'authentification est gérée par le middleware sur /compte.
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/compte", permanent: false },
});

export default function MonComptePage() {
  return null;
}
