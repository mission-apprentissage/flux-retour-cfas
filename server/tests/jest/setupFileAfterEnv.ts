// Mock mailer service (a bit hacky to implement since jest has been configured for ES modules)
// https://jestjs.io/docs/ecmascript-modules
(import.meta.jest as any).unstable_mockModule("@/common/services/mailer/mailer", () => ({
  createMailerService: import.meta.jest.fn(),
  getEmailInfos: import.meta.jest.fn(),
  sendEmail: import.meta.jest.fn(),
}));

// eslint-disable-next-line node/no-unsupported-features/es-syntax
await import("@/common/services/mailer/mailer");
