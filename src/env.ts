import type { InferOutput, ValiError } from "valibot";

import { flatten, object, parseAsync, pipe, string, transform } from "valibot";

const VEnvSchema = object({
  NODE_ENV: string(),
  API_VERSION: string(),
  PORT: pipe(
    string(),
    transform(val => Number(val)),
  ),
  DB_HOST: string(),
  DB_PORT: pipe(
    string(),
    transform(val => Number(val)),
  ),
  DB_USER: string(),
  DB_PASSWORD: string(),
  DB_NAME: string(),
  JWT_SECRET: string(),
  META_ACCESS_TOKEN: string(),
  WABA_ID: string(),
  WHATSAPP_VERIFY_TOKEN: string(),
  META_PHONE_NUMBER_ID: string(),
  APP_ID: string(),
  PHONE_NUMBER_ID: string(),
  AWS_S3_BUCKET_REGION: string(),
  AWS_S3_BUCKET: string(),
  AWS_S3_ACCESS_KEY_ID: string(),
  AWS_S3_SECRET_ACCESS_KEY: string(),

});

export type Env = InferOutput<typeof VEnvSchema>;

// eslint-disable-next-line import/no-mutable-exports
let envData: Env;

try {
  // eslint-disable-next-line node/no-process-env
  envData = await parseAsync(VEnvSchema, process.env, {
    abortPipeEarly: true,
  });
}
catch (e) {
  const error = e as ValiError<typeof VEnvSchema>;
  console.error("❌ Invalid Env");
  console.error(flatten(error.issues));
  process.exit(1);
}

export default envData;
