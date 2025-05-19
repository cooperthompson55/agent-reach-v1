import LeadTable from "@/components/lead-table"
import CsvUploadButton from "@/components/csv-upload-button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Dashboard() {
  return (
    <div className="flex flex-col w-full">
      <div className="border-b">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-2xl font-semibold">Lead Manager</h1>
          <ThemeToggle />
        </div>
      </div>
      <main className="flex-1">
        <div className="py-6">
          <LeadTable />
        </div>
      </main>
    </div>
  )
}
