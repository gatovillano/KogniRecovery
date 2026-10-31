import { OrgPanel } from "@/components/org-panel";

export default function OrganizationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Administración del Centro</h1>
          <p className="text-sm text-gray-600">
            Pacientes, invitaciones, miembros y auditoría
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OrgPanel />
      </main>
    </div>
  );
}
