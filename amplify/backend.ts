import { defineBackend } from "@aws-amplify/backend";
import { data } from "./data/resource";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { auth } from "./auth/resource";
import * as ssm from "aws-cdk-lib/aws-ssm";

// Define backend
const backend = defineBackend({
  auth,
  data,
});

// Read Bedrock API key from SSM Parameter Store
const bedrockApiKeyParam = ssm.StringParameter.fromStringParameterAttributes(
  backend.stack,
  "BedrockApiKey",
  {
    parameterName:
      "/amplify/resource_reference/airecipegenerator/SLIM-sandbox-5f5d31ab31/bedrockApiKey",
  }
);

console.log("Bedrock API Key param ARN:", bedrockApiKeyParam.parameterArn);

// Add Bedrock HTTP data source (IAM-signed)
const bedrockDataSource = backend.data.resources.graphqlApi.addHttpDataSource(
  "bedrockDS",
  "https://bedrock-runtime.us-east-1.amazonaws.com",
  {
    authorizationConfig: {
      signingRegion: "us-east-1",
      signingServiceName: "bedrock",
    },
  }
);

// Grant permission to invoke model
bedrockDataSource.grantPrincipal.addToPrincipalPolicy(
  new PolicyStatement({
    resources: [
      "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
    ],
    actions: ["bedrock:InvokeModel"],
  })
);

// At runtime, when sending HTTP requests to Bedrock, include the API key manually:
// headers: { "x-api-key": bedrockApiKeyParam.stringValue }

export { backend };
