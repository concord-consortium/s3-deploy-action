export function resolveAwsCredentials(
  accessKeyIdInput: string,
  secretAccessKeyInput: string
): void {
  if (accessKeyIdInput && secretAccessKeyInput) {
    process.env.AWS_ACCESS_KEY_ID = accessKeyIdInput;
    process.env.AWS_SECRET_ACCESS_KEY = secretAccessKeyInput;
    return;
  }

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    // Credentials already in environment (e.g. from configure-aws-credentials).
    // AWS_SESSION_TOKEN, if present, is also picked up automatically by the CLI.
    return;
  }

  const found: string[] = [];
  if (accessKeyIdInput) found.push("awsAccessKeyId input");
  if (secretAccessKeyInput) found.push("awsSecretAccessKey input");
  if (process.env.AWS_ACCESS_KEY_ID) found.push("AWS_ACCESS_KEY_ID env var");
  if (process.env.AWS_SECRET_ACCESS_KEY) found.push("AWS_SECRET_ACCESS_KEY env var");

  const foundMsg = found.length > 0
    ? `Found: ${found.join(", ")}. `
    : "";

  throw new Error(
    `${foundMsg}Both an access key ID and secret access key are required. ` +
    "Provide awsAccessKeyId/awsSecretAccessKey inputs or configure environment credentials " +
    "(e.g. using aws-actions/configure-aws-credentials)."
  );
}
