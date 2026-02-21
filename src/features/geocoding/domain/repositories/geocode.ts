import { Geocode } from "../value-objects/geocode";

export interface GeocodeRepository {
	find(name: string): Promise<Geocode | null>;
}
