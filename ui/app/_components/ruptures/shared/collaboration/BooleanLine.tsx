export function BooleanLine({ label, value, className }: { label: string; value: boolean; className: string }) {
  return (
    <p className={className}>
      {label}{" "}
      <strong>
        {value ? (
          <>
            Oui <span aria-hidden="true">{"\u2705"}</span>
          </>
        ) : (
          <>
            Non <span aria-hidden="true">{"\u274C"}</span>
          </>
        )}
      </strong>
    </p>
  );
}
