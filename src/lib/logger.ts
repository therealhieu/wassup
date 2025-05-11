import { Logger, ILogObj } from "tslog";

export const baseLogger: Logger<ILogObj> = new Logger({
    hideLogPositionForProduction: true,
})
