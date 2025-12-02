import { REGIONS_BY_CODE } from "shared/constants/territoires";

import { FranceIcon } from "./FranceIcon";
import { FranceMapSVG } from "./FranceMapSVG";
import styles from "./MenuLabels.module.css";
import { RegionSVG } from "./RegionSVG";

interface MenuLabelProps {
  isActive: boolean;
  collapsed?: boolean;
}

export function SyntheseLabel({ isActive, collapsed }: MenuLabelProps) {
  return (
    <>
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.menuIcon}
      >
        <path
          d="M2.75 11H6.41667V19.25H2.75V11ZM15.5833 7.33331H19.25V19.25H15.5833V7.33331ZM9.16667 1.83331H12.8333V19.25H9.16667V1.83331Z"
          fill={isActive ? "#000091" : "#CECECE"}
        />
      </svg>
      {!collapsed && "Synthèse"}
    </>
  );
}

export function NationalLabel({ isActive, collapsed }: MenuLabelProps) {
  return (
    <>
      <FranceIcon isActive={isActive} width={22} height={22} className={styles.menuIcon} />
      {!collapsed && "National"}
    </>
  );
}

export function MissionLocaleLabel({ isActive, collapsed }: MenuLabelProps) {
  return (
    <>
      <i
        className={`ri-school-fill ${styles.menuIcon}`}
        style={{
          fontSize: "22px",
          color: isActive ? "#000091" : "#CECECE",
        }}
      />
      {!collapsed && "Par Mission Locale"}
    </>
  );
}

interface RegionsLabelProps extends MenuLabelProps {
  regionCodes: string[];
}

export function RegionsLabel({ isActive, collapsed, regionCodes }: RegionsLabelProps) {
  return (
    <>
      <div
        className={styles.regionsIcon}
        style={{
          filter: isActive ? "none" : "grayscale(100%)",
          opacity: isActive ? 1 : 0.6,
        }}
      >
        <FranceMapSVG regionsActives={regionCodes} />
      </div>
      {!collapsed && (regionCodes.length === 1 ? "Ma région" : "Mes régions")}
    </>
  );
}

interface RegionItemLabelProps extends MenuLabelProps {
  regionCode: string;
}

export function RegionItemLabel({ regionCode, isActive, collapsed }: RegionItemLabelProps) {
  const region = REGIONS_BY_CODE[regionCode as keyof typeof REGIONS_BY_CODE];
  return (
    <>
      <RegionSVG regionCode={regionCode} className={styles.regionItemIcon} fill={isActive ? "#6A6AF4" : "#CECECE"} />
      {!collapsed && (region?.nom || regionCode)}
    </>
  );
}
