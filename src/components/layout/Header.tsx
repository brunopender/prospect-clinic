"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Header da aplicação
 */
export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospect Clinic</h1>
          <p className="text-sm text-gray-500">Sistema de Prospecção de Leads</p>
        </div>
        <Link href="/settings">
          <Button variant="outline">Configurações</Button>
        </Link>
      </div>
    </header>
  );
}
