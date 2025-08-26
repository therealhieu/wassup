import { describe, expect, it } from "vitest";
import { GeonamesConfigSchema } from "../../geonames.schemas";
import { GeonamesGeocodeRepository } from "../../geonames";
import path from "path";
import fs from "fs";
import { baseLogger as logger } from "@/lib/logger";


const setUp = () => {
	const testId = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
	const testPath = path.resolve(
		process.cwd(),
		".tmp",
		"unit-tests",
		"geonames-geocode-repository",
		testId
	);
	fs.mkdirSync(testPath, { recursive: true });
	logger.info(`Setting up test ${testId} at ${testPath}`);

	return testPath;
};

const tearDown = (testPath: string) => {
	fs.rmSync(testPath, { recursive: true, force: true });
	const testId = testPath.split("/").pop();
	logger.info(`Tearing down test ${testId} at ${testPath}`);
};

describe("GeonamesGeocodeRepository", () => {
	it("should fetch new data", async () => {
		const testPath = setUp();

		const config = GeonamesConfigSchema.parse({
			outputPath: testPath,
			dataset: "cities15000",
		});

		const repo = new GeonamesGeocodeRepository(config);
		await repo.fetchData();

		expect(repo.length()).toBeGreaterThan(10);

		const geocode = await repo.find("Ho Chi Minh City");
		expect(geocode).toBeDefined();

		tearDown(testPath);
	}, 30_000);

	it("should load downloaded data", async () => {
		const config = GeonamesConfigSchema.parse({
			dataset: "cities15000",
		});

		const repo = new GeonamesGeocodeRepository(config);
		await repo.fetchData();

		expect(repo.length()).toBeGreaterThan(10);

		const geocode = await repo.find("Ho Chi Minh City");
		expect(geocode.isOk()).toBe(true);
		expect(geocode.unwrapOr(null)).toBeDefined();
	}, 30_000);
});
