import { resolveAwsCredentials } from "./aws-credentials";

describe("resolveAwsCredentials", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_SESSION_TOKEN;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("uses input values when provided", () => {
    resolveAwsCredentials("input-key-id", "input-secret-key");
    expect(process.env.AWS_ACCESS_KEY_ID).toBe("input-key-id");
    expect(process.env.AWS_SECRET_ACCESS_KEY).toBe("input-secret-key");
  });

  test("falls back to environment variables when inputs are empty", () => {
    process.env.AWS_ACCESS_KEY_ID = "env-key-id";
    process.env.AWS_SECRET_ACCESS_KEY = "env-secret-key";
    process.env.AWS_SESSION_TOKEN = "env-session-token";

    resolveAwsCredentials("", "");
    expect(process.env.AWS_ACCESS_KEY_ID).toBe("env-key-id");
    expect(process.env.AWS_SECRET_ACCESS_KEY).toBe("env-secret-key");
    expect(process.env.AWS_SESSION_TOKEN).toBe("env-session-token");
  });

  test("throws when neither inputs nor env vars are present", () => {
    expect(() => resolveAwsCredentials("", "")).toThrow(
      "Both an access key ID and secret access key are required."
    );
  });

  test("throws and reports what was found when only env access key id is present", () => {
    process.env.AWS_ACCESS_KEY_ID = "env-key-id";
    expect(() => resolveAwsCredentials("", "")).toThrow(
      "Found: AWS_ACCESS_KEY_ID env var. Both an access key ID and secret access key are required."
    );
  });
});
