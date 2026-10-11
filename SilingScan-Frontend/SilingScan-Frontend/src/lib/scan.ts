export type ScanResult = {
  status: "Healthy" | "Diseased";
  confidence: number;
  summary: string;
  urgency: string;
  recommendations: string[];
};

import { apiRequest } from "./api";

export const analyzeImage = async (file: File): Promise<ScanResult> => {
  const formData = new FormData();
  formData.append("image", file);

  return apiRequest<ScanResult>("/scans/analyze", {
    method: "POST",
    body: formData,
  });
};
