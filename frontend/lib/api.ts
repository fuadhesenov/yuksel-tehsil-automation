const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export interface BriefData {
  // BÖLÜM 1: ƏSAS MƏLUMATLAR
  businessName: string;
  businessDescription?: string;
  yearsInBusiness?: string;
  mission?: string;
  coreValues?: string;
  // BÖLÜM 2: TƏHSİL PROQRAMLARI
  programsList?: string;
  programDetails?: string;
  examPrep?: string;
  languageCourses?: string;
  targetCountries?: string;
  // BÖLÜM 3: QİYMƏTLƏR VƏ ŞƏRTLƏR
  pricingDetails?: string;
  scholarshipInfo?: string;
  packageDiscounts?: string;
  paymentMethods?: string;
  priceResponsePolicy?: string;
  // BÖLÜM 4: İŞ SAATLARI VƏ MƏKAN
  workingDays?: string;
  workingHours?: string;
  holidaySchedule?: string;
  mainAddress?: string;
  directionsInfo?: string;
  otherBranches?: string;
  onlineServices?: string;
  // BÖLÜM 5: ƏLAQƏ VƏ QEYDİYYAT
  phoneNumber?: string;
  email?: string;
  website?: string;
  socialMedia?: string;
  registrationProcess?: string;
  // BÖLÜM 6: SSS
  faq?: string;
  // BÖLÜM 7: ÜSLİP VƏ DİL
  preferredLanguage?: string;
  communicationStyle?: string;
  useEmojis?: string;
  responseLength?: string;
  // BÖLÜM 8: MƏHDUDIYYƏTLƏR
  mentionCompetitors?: string;
  exactPricing?: string;
  topicsToAvoid?: string;
  urgentCases?: string;
  complaintHandling?: string;
}

export const defaultBriefData: BriefData = {
  businessName: "Yüksel Təhsil Mərkəzi",
  businessDescription: "",
  yearsInBusiness: "",
  mission: "",
  coreValues: "",
  programsList: "",
  programDetails: "",
  examPrep: "",
  languageCourses: "",
  targetCountries: "",
  pricingDetails: "",
  scholarshipInfo: "",
  packageDiscounts: "",
  paymentMethods: "",
  priceResponsePolicy: "",
  workingDays: "",
  workingHours: "",
  holidaySchedule: "",
  mainAddress: "",
  directionsInfo: "",
  otherBranches: "",
  onlineServices: "",
  phoneNumber: "",
  email: "",
  website: "",
  socialMedia: "",
  registrationProcess: "",
  faq: "",
  preferredLanguage: "Azərbaycan dili",
  communicationStyle: "",
  useEmojis: "",
  responseLength: "",
  mentionCompetitors: "",
  exactPricing: "",
  topicsToAvoid: "",
  urgentCases: "",
  complaintHandling: "",
};

export const savePrompt = async (
  briefData: BriefData
): Promise<{ success: boolean; generatedPrompt: string }> => {
  return apiFetch("/admin/savePrompt", {
    method: "POST",
    body: JSON.stringify({ briefData }),
  });
};

export const testPrompt = async (
  message: string
): Promise<{ reply: string }> => {
  return apiFetch("/admin/testPrompt", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
};

export const getConfig = async (): Promise<{
  systemPrompt: string;
  briefData: BriefData | null;
}> => {
  return apiFetch("/admin/getConfig");
};

export const healthCheck = async (): Promise<{ status: string }> => {
  return apiFetch("/health");
};
