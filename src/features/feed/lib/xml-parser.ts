import { XMLParser } from "fast-xml-parser";

export const xmlParser = new XMLParser({
	ignoreAttributes: false,
	removeNSPrefix: true,
	attributeNamePrefix: "",
});
