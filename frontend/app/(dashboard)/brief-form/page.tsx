"use client";

import DefaultCardComponent from "@/app/(dashboard)/components/default-card-component";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { BriefData, defaultBriefData, savePrompt, getConfig } from "@/lib/api";
import {
  Trash2,
  Building2,
  GraduationCap,
  DollarSign,
  MapPin,
  Phone,
  HelpCircle,
  Palette,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  CheckCircle2,
  CloudDownload,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const INPUT_CLASS =
  "border border-neutral-300 px-5 dark:border-slate-500 focus:border-primary dark:focus:border-primary focus-visible:border-primary h-12 rounded-lg !shadow-none !ring-0";
const TEXTAREA_CLASS =
  "border border-neutral-300 px-5 dark:border-slate-500 focus:border-primary dark:focus:border-primary focus-visible:border-primary h-[120px] rounded-lg !shadow-none !ring-0";
const LABEL_CLASS = "text-[#4b5563] dark:text-white mb-2";
const HINT_CLASS = "text-sm text-neutral-400 dark:text-neutral-500 mt-1";

const steps = [
  { title: "Əsas Məlumatlar", icon: Building2, desc: "Mərkəzin əsas məlumatları · 5 sual" },
  { title: "Təhsil Proqramları", icon: GraduationCap, desc: "Proqramlar, imtahanlar, dil kursları · 5 sual" },
  { title: "Qiymətlər", icon: DollarSign, desc: "Qiymət siyasəti və təqaüdlər · 5 sual" },
  { title: "Məkan və Vaxt", icon: MapPin, desc: "Ünvan, iş saatları, filiallar · 7 sual" },
  { title: "Əlaqə", icon: Phone, desc: "Əlaqə məlumatları · 5 sual" },
  { title: "SSS", icon: HelpCircle, desc: "Tez-tez soruşulan suallar · 1 sual" },
  { title: "Üslub", icon: Palette, desc: "Cavab tərzi · 4 sual" },
  { title: "Məhdudiyyətlər", icon: ShieldAlert, desc: "Qaydalar və limitlər · 5 sual" },
];

const STORAGE_KEY = "briefFormData";
const STEP_KEY = "briefFormStep";

export default function BriefFormPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<BriefData>(defaultBriefData);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Client-only: localStorage-dan yüklə (SSR-safe — hydration mismatch yox)
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      const savedStep = localStorage.getItem(STEP_KEY);
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
      if (savedStep) {
        setCurrentStep(parseInt(savedStep, 10));
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // Supabase-dən yüklə (yalnız localStorage boşdursa)
  useEffect(() => {
    if (!hydrated) return;
    const hasData = localStorage.getItem(STORAGE_KEY);
    if (hasData) return;

    getConfig()
      .then((config) => {
        if (config.briefData && typeof config.briefData === "object" && Object.keys(config.briefData).length > 0) {
          const merged = { ...defaultBriefData, ...config.briefData };
          setFormData(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          toast.success("Mövcud brief Supabase-dən yükləndi!");
        }
      })
      .catch(() => { /* backend əlçatan deyil, default istifadə et */ });
  }, [hydrated]);

  // Form verileri değişince localStorage-a kaydet
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData, hydrated]);

  // Aktif adım değişince localStorage-a kaydet
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STEP_KEY, currentStep.toString());
  }, [currentStep, hydrated]);

  const updateField = useCallback(
    (field: keyof BriefData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleReset = () => {
    if (!confirm("Bütün brief məlumatları silinəcək. Əminsiniz?")) return;
    setFormData(defaultBriefData);
    setCurrentStep(0);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STEP_KEY);
    toast.success("Brief sıfırlandı!");
  };

  const handleSave = async () => {
    if (!formData.businessName.trim()) {
      toast.error("Mərkəzin rəsmi adı boş ola bilməz!");
      setCurrentStep(0);
      return;
    }
    setSaving(true);
    try {
      await savePrompt(formData);
      setSaved(true);
      toast.success("Brief uğurla saxlanıldı və prompt yaradıldı! 🎉");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Xəta baş verdi. Backend-ə qoşulmaq mümkün olmadı.");
    } finally {
      setSaving(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const StepIcon = steps[currentStep].icon;

  const renderField = (
    id: string,
    label: string,
    field: keyof BriefData,
    placeholder: string,
    hint?: string,
    type: "input" | "textarea" = "input"
  ) => (
    <div>
      <Label htmlFor={id} className={LABEL_CLASS}>
        {label} {field === "businessName" && <span className="text-red-500">*</span>}
      </Label>
      {type === "textarea" ? (
        <Textarea
          id={id}
          value={(formData[field] as string) || ""}
          onChange={(e) => updateField(field, e.target.value)}
          className={TEXTAREA_CLASS}
          placeholder={placeholder}
        />
      ) : (
        <Input
          type="text"
          id={id}
          value={(formData[field] as string) || ""}
          onChange={(e) => updateField(field, e.target.value)}
          className={INPUT_CLASS}
          placeholder={placeholder}
        />
      )}
      {hint && <p className={HINT_CLASS}>{hint}</p>}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex flex-col gap-4">
            {renderField("businessName", "Mərkəzin rəsmi adı", "businessName", "Məs: Yüksel Təhsil Mərkəzi")}
            {renderField("businessDescription", "Mərkəz təsviri", "businessDescription", "Türkiyə və Avropada təhsil imkanları təklif edən mərkəz...", "Qısa təqdimat", "textarea")}
            {renderField("yearsInBusiness", "Fəaliyyət müddəti", "yearsInBusiness", "Məs: 5 il", "Neçə ildir işləyirsiniz?")}
            {renderField("mission", "Missiya", "mission", "Tələbələrə keyfiyyətli xarici təhsil imkanları...", "Əsas məqsədiniz", "textarea")}
            {renderField("coreValues", "Əsas dəyərlər", "coreValues", "Keyfiyyət, şəffaflıq, nəticə yönümlü...", "Mərkəzin dəyərləri")}
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col gap-4">
            {renderField("programsList", "Proqramlar siyahısı", "programsList", "Bakalavr, Magistr, Doktorantura, YÖS hazırlığı, IELTS...", "Təklif etdiyiniz proqramlar", "textarea")}
            {renderField("programDetails", "Proqram detalları", "programDetails", "Türkiyə: İstanbul, Ankara universitetləri. Avropa: Almaniya, Polşa...", "Ölkələr və universitetlər", "textarea")}
            {renderField("examPrep", "İmtahan hazırlığı", "examPrep", "YÖS: 6 aylıq kurs, IELTS: 3 aylıq kurs, SAT, TOEFL, DİM...", "İmtahan hazırlıq proqramları", "textarea")}
            {renderField("languageCourses", "Dil kursları", "languageCourses", "Türk dili, İngilis dili, Alman dili, Çin dili...", "Təklif olunan dil kursları")}
            {renderField("targetCountries", "Hədəf ölkələr", "targetCountries", "Türkiyə, Almaniya, Polşa, Macarıstan, Çexiya...", "Hansı ölkələrə göndərirsiniz?")}
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col gap-4">
            {renderField("pricingDetails", "Qiymət detalları", "pricingDetails", "YÖS: aylıq 200 AZN, IELTS: aylıq 250 AZN...", "Proqramların qiymətləri", "textarea")}
            {renderField("scholarshipInfo", "Təqaüd imkanları", "scholarshipInfo", "100% təqaüdlü, 50% təqaüdlü, özəl universitetlər...", "Təqaüd/burs haqqında məlumat", "textarea")}
            {renderField("packageDiscounts", "Paket endirimlər", "packageDiscounts", "6 aylıq planda 10% endirim, erkən qeydiyyat 15%...", "Endirim siyasəti")}
            {renderField("paymentMethods", "Ödəniş üsulları", "paymentMethods", "Nağd, bank kartı, hissə-hissə ödəniş", "Qəbul edilən ödəniş üsulları")}
            {renderField("priceResponsePolicy", "Qiymət cavab siyasəti", "priceResponsePolicy", "Dəqiq qiymət ver + pulsuz konsultasiya təklif et", "Qiymət soruşanda necə cavab verilsin?")}
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col gap-4">
            {renderField("workingDays", "İş günləri", "workingDays", "Bazar ertəsi - Şənbə", "Həftənin iş günləri")}
            {renderField("workingHours", "İş saatları", "workingHours", "09:00 - 20:00", "Qəbul saatları")}
            {renderField("holidaySchedule", "Bayram cədvəli", "holidaySchedule", "Rəsmi bayramlarda bağlı", "Xüsusi günlər")}
            {renderField("mainAddress", "Əsas ünvan", "mainAddress", "Bakı, Nəsimi rayonu, ...", "Tam ünvan")}
            {renderField("directionsInfo", "Yol tərifləri", "directionsInfo", "28 May metro stansiyasından 5 dəq piyada...", "Necə gəlmək olar?")}
            {renderField("otherBranches", "Digər filiallar", "otherBranches", "Gəncə filialı: ..., Sumqayıt filialı: ...", "Başqa filiallar varsa")}
            {renderField("onlineServices", "Onlayn xidmət", "onlineServices", "Zoom ilə onlayn dərslər, onlayn konsultasiya", "Onlayn imkanlar")}
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col gap-4">
            {renderField("phoneNumber", "Telefon", "phoneNumber", "+994 50 123 45 67", "Əsas əlaqə nömrəsi")}
            {renderField("email", "E-poçt", "email", "info@yukseltehsil.az", "E-poçt ünvanı")}
            {renderField("website", "Vebsayt", "website", "https://yukseltehsil.az", "Rəsmi sayt")}
            {renderField("socialMedia", "Sosial şəbəkələr", "socialMedia", "Instagram: @yuksel_tehsil_merkezi, Facebook: ...", "Sosial media hesabları", "textarea")}
            {renderField("registrationProcess", "Qeydiyyat prosesi", "registrationProcess", "1. Əlaqə 2. Konsultasiya 3. Sənəd toplama 4. Müraciət...", "Qeydiyyat addımları", "textarea")}
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col gap-4">
            {renderField("faq", "Tez-tez verilən suallar", "faq", "S: Sənədlər lazımdır?\nC: Pasport, attestat, dil sertifikatı...\n\nS: Neçə vaxt çəkir?\nC: Orta hesabla 2-3 ay...", "FAQ - sual və cavablar (hər sual yeni sətirdə)", "textarea")}
          </div>
        );
      case 6:
        return (
          <div className="flex flex-col gap-4">
            {renderField("preferredLanguage", "Əsas dil", "preferredLanguage", "Azərbaycan dili", "Cavab veriləcək dil")}
            {renderField("communicationStyle", "Ünsiyyət tərzi", "communicationStyle", "Peşəkar amma səmimi, hörmətli", "Necə danışmalı?")}
            {renderField("useEmojis", "Emoji istifadəsi", "useEmojis", "Bəli, mülayim şəkildə 😊📚", "Emojilər istifadə olsun?")}
            {renderField("responseLength", "Cavab uzunluğu", "responseLength", "Orta (2-4 cümlə), lazım olduqda detallı", "Nə qədər uzun cavab?")}
          </div>
        );
      case 7:
        return (
          <div className="flex flex-col gap-4">
            {renderField("mentionCompetitors", "Rəqiblər haqqında", "mentionCompetitors", "Rəqiblər haqqında danışma, yalnız öz üstünlüklərimizi vurğula", "Rəqiblərdən bəhs olsun?")}
            {renderField("exactPricing", "Dəqiq qiymət siyasəti", "exactPricing", "Ümumi qiymət aralığı ver, dəqiq qiymət üçün əlaqəyə yönləndir", "Qiymət necə bildirilsin?")}
            {renderField("topicsToAvoid", "Qaçınılacaq mövzular", "topicsToAvoid", "Siyasət, din, rəqib mərkəzlər...", "Hansı mövzulardan qaçınmalı?", "textarea")}
            {renderField("urgentCases", "Təcili hallar", "urgentCases", "Şikayət və ya təcili sual olduqda operatora yönləndir", "Təcili hallarda nə olsun?")}
            {renderField("complaintHandling", "Şikayət idarəsi", "complaintHandling", "Üzr istə, problemi qeyd et, operatora yönləndir", "Şikayətlərə necə cavab verilsin?", "textarea")}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <DashboardBreadcrumb title="Brief Formu" text="Brief Formu" />

      {/* Step indicator bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            Addım {currentStep + 1} / {steps.length}
          </span>
          <span className="text-sm font-medium text-primary">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          return (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-white"
                  : isCompleted
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "bg-neutral-100 text-neutral-500 dark:bg-slate-700 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-slate-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{step.title}</span>
            </button>
          );
        })}
      </div>

      {/* Form content */}
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12">
          <DefaultCardComponent
            title={
              <div className="flex items-center gap-3">
                <StepIcon className="w-5 h-5 text-primary" />
                <div>
                  <span>{steps[currentStep].title}</span>
                  <p className="text-sm font-normal text-neutral-400 dark:text-neutral-500 mt-0.5">
                    {steps[currentStep].desc}
                  </p>
                </div>
              </div>
            }
          >
            {renderStepContent()}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-neutral-200 dark:border-slate-600">
              <Button
                variant="outline"
                className="h-12 px-6"
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Əvvəlki
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="h-12 px-4 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={handleReset}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Sıfırla
                </Button>
                {currentStep === steps.length - 1 ? (
                  <Button
                    variant="default"
                    className="h-12 px-8"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : saved ? (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {saving ? "Saxlanılır..." : saved ? "Saxlanıldı!" : "Saxla və Prompt Yarat"}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="h-12 px-6"
                    onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
                  >
                    Növbəti
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </DefaultCardComponent>
        </div>
      </div>
    </>
  );
}
