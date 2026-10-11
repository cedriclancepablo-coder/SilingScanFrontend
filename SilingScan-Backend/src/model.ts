import { ApiError } from "./auth.js";
import type { ScanResult } from "./types.js";

export const analyzePepperImage = async (
  _image: Buffer,
): Promise<ScanResult> => {
  throw new ApiError(
    503,
    "Image diagnosis is not configured yet. Add a trained disease-detection model to enable scanning.",
  );
};
