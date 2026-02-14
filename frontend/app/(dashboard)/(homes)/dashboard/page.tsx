import DefaultCardComponent from "@/app/(dashboard)/components/default-card-component";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, StickyNote, MessageCircleMore, Settings, Instagram, Bot, Database, Rocket } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

const metadata: Metadata = {
  title: "Dashboard | Yüksel Təhsil Mərkəzi",
  description: "Instagram DM Automation Admin Panel",
};

const quickActions = [
  {
    title: "Brief Formu",
    desc: "Biznes məlumatlarını daxil edin və AI promptunu yaradın",
    icon: StickyNote,
    href: "/brief-form",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Chat Test",
    desc: "AI cavablarını real vaxtda test edin",
    icon: MessageCircleMore,
    href: "/chat-test",
    color: "bg-green-500/10 text-green-600",
  },
  {
    title: "Ayarlar",
    desc: "Environment variables və ManyChat konfiqurasiyası",
    icon: Settings,
    href: "/settings",
    color: "bg-orange-500/10 text-orange-600",
  },
];

const setupSteps = [
  { text: "Backend-i Railway-da deploy edin", icon: Rocket },
  { text: "Supabase-də database yaradın", icon: Database },
  { text: "Brief formu doldurun və prompt yaradın", icon: StickyNote },
  { text: "ManyChat-ı konfiqurasiya edin", icon: Bot },
  { text: "Chat Test ilə AI-ı sınayın", icon: MessageCircleMore },
  { text: "Instagram DM automation-ı aktivləşdirin", icon: Instagram },
];

export default async function DashboardPage() {
  return (
    <>
      <DashboardBreadcrumb title="Dashboard" text="Dashboard" />

      {/* Welcome Banner */}
      <Card className="border-0 bg-gradient-to-r from-primary to-blue-600 text-white mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <GraduationCap className="w-12 h-12 opacity-80" />
            <div>
              <h2 className="text-xl font-bold">Yüksel Təhsil Mərkəzi</h2>
              <p className="text-white/80 text-sm mt-1">
                Instagram DM Automation Admin Panel — ManyChat + OpenAI GPT-4
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="border-0 hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color}`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{action.title}</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{action.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Setup Checklist */}
      <div className="grid grid-cols-12 gap-5">
        <div className="lg:col-span-7 col-span-12">
          <DefaultCardComponent title="Quraşdırma Addımları">
            <div className="space-y-3">
              {setupSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-slate-800">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <step.icon className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">{step.text}</span>
                </div>
              ))}
            </div>
          </DefaultCardComponent>
        </div>

        <div className="lg:col-span-5 col-span-12">
          <DefaultCardComponent title="Sistem Haqqında">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-slate-700">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Backend</span>
                <span className="text-sm font-medium">FastAPI (Python)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-slate-700">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Frontend</span>
                <span className="text-sm font-medium">Next.js + WowDash</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-slate-700">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">AI Model</span>
                <span className="text-sm font-medium">OpenAI GPT-4o-mini</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-slate-700">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Messaging</span>
                <span className="text-sm font-medium">ManyChat API</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-slate-700">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Database</span>
                <span className="text-sm font-medium">Supabase PostgreSQL</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Instagram</span>
                <span className="text-sm font-medium">@yuksel_tehsil_merkezi</span>
              </div>
            </div>
          </DefaultCardComponent>
        </div>
      </div>
    </>
  );
}
