'use client'

import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { cn } from '@/lib/utils';

function LogoSidebar() {
  const isCollapsed = useSidebarCollapsed();

  return (
    <Link
      href="/dashboard"
      className={cn(
        'sidebar-logo h-[72px] py-3.5 flex items-center justify-center border-b border-neutral-100 dark:border-slate-700',
        isCollapsed ? 'px-1' : 'px-4'
      )}
    >
      {isCollapsed ? (
        <GraduationCap className="w-8 h-8 text-primary" />
      ) : (
        <div className="flex items-center gap-2.5">
          <GraduationCap className="w-8 h-8 text-primary shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-neutral-900 dark:text-white">Yüksel Təhsil</span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Mərkəzi Instagram DM Bot</span>
          </div>
        </div>
      )}
    </Link>
  )
}

export default LogoSidebar