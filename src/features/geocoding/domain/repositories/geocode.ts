import { Result } from "neverthrow";
import { Geocode } from "../value-objects/geocode";

export interface GeocodeRepository {
    getGeocode(name: string): Promise<Result<Geocode | null, Error>>;
}

