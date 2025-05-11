import { GeocodeRepository } from "@/features/geocoding/domain/repositories/geocode";
import {
	Geocode,
	GeocodeSchema,
} from "@/features/geocoding/domain/value-objects/geocode";
import { baseLogger } from "@/lib/logger";
import AdmZip from "adm-zip";
import fs from "fs";
import { ok, Result } from "neverthrow";
import path from "path";
import { GeonamesConfig } from "./geonames.schemas";

const FIELD_MAPPING = {
	name: 1,
	latitude: 4,
	longitude: 5,
};

const logger = baseLogger.getSubLogger({
	name: "GeonamesGeocodeRepository",
});

export class GeonamesGeocodeRepository implements GeocodeRepository {
	private mapping: Record<string, Geocode> = {};

	constructor(private config: GeonamesConfig) {
		this.config = config;
	}

	/** Load (or download) data and build the in‐memory map */
	public async fetchData(): Promise<void> {
		// Make sure we have a valid absolute path, but relative to the project directory
		const outputPath = path.isAbsolute(this.config.outputPath)
			? this.config.outputPath
			: path.join(process.cwd(), this.config.outputPath);

		const txtFile = path.resolve(outputPath, `${this.config.dataset}.txt`);

		// ensure output dir exists
		fs.mkdirSync(path.dirname(txtFile), { recursive: true });

		if (!fs.existsSync(txtFile)) {
			logger.info(`GeoNames data not found at ${txtFile}, downloading…`);

			const url = `https://download.geonames.org/export/dump/${this.config.dataset}.zip`;
			const resp = await fetch(url);
			if (!resp.ok) {
				throw new Error(
					`Failed to download GeoNames dataset: ${resp.status} ${resp.statusText}`
				);
			}

			// turn the downloaded ArrayBuffer into a Node Buffer
			const arrayBuffer = await resp.arrayBuffer();
			const zipBuffer = Buffer.from(arrayBuffer);

			// load the ZIP and pull out the .txt entry
			const zip = new AdmZip(zipBuffer);
			const entryName = `${this.config.dataset}.txt`;
			const zipEntry = zip.getEntry(entryName);
			if (!zipEntry) {
				throw new Error(`"${entryName}" not found inside GeoNames ZIP`);
			}

			// extract & write it
			const fileData = zipEntry.getData().toString("utf8");
			fs.mkdirSync(path.dirname(txtFile), { recursive: true });
			fs.writeFileSync(txtFile, fileData, "utf8");

			logger.info(`GeoNames data downloaded and saved to ${txtFile}`);
		}

		logger.info(`Reading GeoNames data from ${txtFile}`);
		const contents = fs.readFileSync(txtFile, "utf8");
		const lines = contents.split(/\r?\n/);

		const map: Record<string, Geocode> = {};
		for (const line of lines) {
			if (!line.trim()) continue;
			const fields = line.split("\t");
			const geocode = GeocodeSchema.parse({
				name: fields[FIELD_MAPPING.name],
				latitude: parseFloat(fields[FIELD_MAPPING.latitude]),
				longitude: parseFloat(fields[FIELD_MAPPING.longitude]),
			});

			map[geocode.name] = geocode;
		}

		this.mapping = map;
		logger.info(
			`Loaded ${Object.keys(map).length} geocodes from ${txtFile}`
		);
	}

	/** Public API: returns `null` if not found */
	public async find(name: string): Promise<Result<Geocode | null, Error>> {
		return ok(this.mapping[name] ?? null);
	}

	public length(): number {
		return Object.keys(this.mapping).length;
	}
}
