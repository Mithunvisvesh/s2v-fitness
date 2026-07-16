import { ChangePasswordForm } from "@/components/staff/change-password-form"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Account Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal account credentials and profile configurations.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <ChangePasswordForm />
      </div>
    </div>
  )
}
