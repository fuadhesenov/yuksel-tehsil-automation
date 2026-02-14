import DefaultCardComponent from "@/app/(dashboard)/components/default-card-component";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

const metadata: Metadata = {
  title: "Ayarlar | Yüksel Təhsil Mərkəzi",
};

export default function SettingsPage() {
  return (
    <>
      <DashboardBreadcrumb title="Ayarlar" text="Ayarlar" />

      <div className="grid grid-cols-12 gap-5">
        {/* Backend Environment Variables */}
        <div className="lg:col-span-6 col-span-12">
          <DefaultCardComponent title="Backend Environment Variables">
            <div className="space-y-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Bu dəyişənləri Railway-da backend servisinə əlavə edin.
              </p>
              <div className="space-y-3">
                {[
                  { key: "OPENAI_API_KEY", desc: "OpenAI API açarı", required: true },
                  { key: "MANYCHAT_API_KEY", desc: "ManyChat API açarı (Pro hesab)", required: true },
                  { key: "MANYCHAT_FLOW_NS", desc: "ManyChat Flow namespace", required: true },
                  { key: "DATABASE_URL", desc: "Supabase PostgreSQL bağlantı URL", required: true },
                  { key: "PORT", desc: "Server portu (default: 8000)", required: false },
                  { key: "FRONTEND_URL", desc: "Netlify frontend URL", required: false },
                ].map((env) => (
                  <div
                    key={env.key}
                    className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-600"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-medium text-primary">{env.key}</code>
                        {env.required && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Məcburi</Badge>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{env.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DefaultCardComponent>
        </div>

        {/* Frontend Environment Variables */}
        <div className="lg:col-span-6 col-span-12">
          <DefaultCardComponent title="Frontend Environment Variables">
            <div className="space-y-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Bu dəyişəni Netlify-da frontend servisinə əlavə edin.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-600">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-medium text-primary">NEXT_PUBLIC_API_URL</code>
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Məcburi</Badge>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Backend API URL (Railway URL)</p>
                  </div>
                </div>
              </div>
            </div>
          </DefaultCardComponent>
        </div>

        {/* ManyChat Configuration */}
        <div className="col-span-12">
          <DefaultCardComponent title="ManyChat Konfiqurasiyası">
            <div className="space-y-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                ManyChat-ı aşağıdakı addımlarla konfiqurasiya edin:
              </p>
              <ol className="space-y-3">
                {[
                  "ManyChat-da Instagram hesabını bağlayın",
                  "Settings → API → API key alın",
                  'Settings → Fields → "AI_Response" (Text) custom field yaradın',
                  'Yeni Flow yaradın: "Send AI Response" → mesaj: {{AI_Response}}',
                  "Default Reply flow-da External Request əlavə edin",
                  "URL: https://your-backend.up.railway.app/webhook",
                  'Body: {"id": "{{contact.id}}", "last_input_text": "{{last_text_input}}"}',
                  "Flow-nu publish edin, flow_ns-i URL-dən kopyalayın",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-neutral-600 dark:text-neutral-300 pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </DefaultCardComponent>
        </div>

        {/* Supabase Setup */}
        <div className="col-span-12">
          <DefaultCardComponent title="Supabase Quraşdırma">
            <div className="space-y-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Supabase-də yeni proje yaradıb, SQL Editor-da <code className="text-primary">supabase/migration.sql</code> faylını çalıştırın.
                Sonra Settings → Database → Connection string-i alıb <code className="text-primary">DATABASE_URL</code> olaraq backend-ə əlavə edin.
              </p>
            </div>
          </DefaultCardComponent>
        </div>
      </div>
    </>
  );
}
