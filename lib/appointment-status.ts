/** Map backend appointment status to display label (shared across calendar, patient profile, etc.) */
export function getAppointmentStatusLabel(status: string | null | undefined): string {
  if (!status) return "Scheduled"
  const labels: Record<string, string> = {
    pending: "Pending",
    unconfirmed: "Unconfirmed",
    scheduled: "Scheduled",
    confirmed: "Confirmed",
    checked_in: "Checked In",
    in_treatment: "In Treatment",
    completed: "Completed",
    cancelled: "Canceled",
    no_show: "No-Show",
  }
  return labels[status] ?? status
}
