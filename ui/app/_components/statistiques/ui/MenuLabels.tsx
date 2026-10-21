import styles from "./MenuLabels.module.css";

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
      {!collapsed && "Vue d'ensemble"}
    </>
  );
}
