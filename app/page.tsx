import LeadTable from "@/components/lead-table"
import CsvUploadButton from "@/components/csv-upload-button"

export default function Dashboard() {
  return (
    <div className="flex flex-col w-full">
      <main className="flex-1">
        <div className="py-6 px-6">
          {/* <h1 className="text-2xl font-semibold mb-6">Listings Manager</h1> */}
          <LeadTable />
        </div>
      </main>
    </div>
  )
}
