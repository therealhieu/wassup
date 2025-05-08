import { AppConfigSchema } from "@/infrastructure/config.schemas";
import { z } from "zod";
import fs from "fs";

const jsonSchema = z.toJSONSchema(AppConfigSchema);

fs.writeFileSync(
	".vscode/app-config.schema.json",
	JSON.stringify(jsonSchema, null, 2)
);
