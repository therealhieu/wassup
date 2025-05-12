import { AppConfigSchema } from "@/infrastructure/config.schemas";
import fs from "fs";
import { zodToJsonSchema } from "zod-to-json-schema";

const jsonSchema = zodToJsonSchema(AppConfigSchema);

fs.writeFileSync(
	".vscode/app-config.schema.json",
	JSON.stringify(jsonSchema, null, 2)
);
