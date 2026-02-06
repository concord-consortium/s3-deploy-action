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

  throw new Error(
    "AWS credentials not found. Either provide awsAccessKeyId/awsSecretAccessKey inputs " +
    "or configure environment credentials (e.g. using aws-actions/configure-aws-credentials)."
  );
}
