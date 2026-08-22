import type { Metadata } from "next";
import AdminGate from "@/components/AdminGate";

export const metadata: Metadata = {
  title: "Админка RemTech",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="admin-page">
      <div className="admin-card">
        <header className="admin-header">
          <span className="brand-mark" aria-hidden="true">R</span>
          <div>
          <h1>Админка RemTech</h1>
          <p>Настройки сайта. Доступ по паролю.</p>
          </div>
        </header>
        <AdminGate />
      </div>
    </main>
  );
}
