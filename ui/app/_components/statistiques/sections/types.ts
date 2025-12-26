import type { Period } from "../ui/PeriodSelector";

export interface BaseSectionProps {
  region?: string;
  national?: boolean;
}

export interface SectionWithMlProps extends BaseSectionProps {
  mlId?: string;
}

export interface SectionWithPeriodProps extends BaseSectionProps {
  period?: Period;
}

export interface SectionWithPeriodAndMlProps extends SectionWithMlProps {
  period?: Period;
}

export interface SectionWithNoDataProps {
  noData?: boolean;
}

export interface SectionWithLayoutProps {
  fullWidth?: boolean;
}
