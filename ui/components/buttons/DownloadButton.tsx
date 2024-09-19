import { DownloadLine } from "@/theme/components/icons";

import AppButton, { AppButtonProps } from "./Button";

function DownloadButton({ children, ...props }: AppButtonProps) {
  return (
    <AppButton rightIcon={<DownloadLine />} {...props}>
      {children}
    </AppButton>
  );
}

export default DownloadButton;
