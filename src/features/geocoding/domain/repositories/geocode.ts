import { Result } from "neverthrow";
import { Geocode } from "../value-objects/geocode";

export interface GeocodeRepository {
	find(name: string): Promise<Result<Geocode | null, Error>>;
}
