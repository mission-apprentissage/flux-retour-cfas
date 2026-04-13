import { DetailLayout } from "../_components/layouts/DetailLayout";

export default async function CfaDetailLayout({ children }: { children: React.ReactNode }) {
  return <DetailLayout>{children}</DetailLayout>;
}
