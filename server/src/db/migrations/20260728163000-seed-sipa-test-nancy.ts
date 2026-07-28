export const up = async () => {
  if (process.env.MNA_TDB_ENV === "production") {
    return;
  }
  const { seedSipaTestNancy } = await import("@/jobs/tmp/seed-sipa-test-nancy");
  await seedSipaTestNancy({});
};

export const down = async () => {
  const { seedSipaTestNancy } = await import("@/jobs/tmp/seed-sipa-test-nancy");
  await seedSipaTestNancy({ cleanup: true });
};
