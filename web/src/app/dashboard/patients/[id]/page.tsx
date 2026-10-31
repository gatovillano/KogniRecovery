import { PatientDetailClient } from "@/components/patient-detail";

export const instant = false;

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientDetailClient patientId={id} />;
}
