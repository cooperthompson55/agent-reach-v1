"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CsvUploadButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.name.endsWith(".csv")) {
      setFile(selectedFile)
    } else {
      alert("Please select a CSV file")
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile)
    } else {
      alert("Please drop a CSV file")
    }
  }

  const handleUpload = () => {
    // Here you would handle the actual CSV parsing and data import
    // For now, we'll just close the dialog and show a success message
    alert(
      `File "${file.name}" uploaded successfully! In a real implementation, this would parse the CSV and update the table.`,
    )
    setIsOpen(false)
    setFile(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Import Leads
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing your lead data. The file should include columns for agent name, address, photo
            count, and listing date.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <h3 className="font-medium">Drag and drop your CSV file here</h3>
              <p className="text-sm text-muted-foreground">or</p>
              <Label
                htmlFor="csv-file"
                className="cursor-pointer inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
              >
                Browse Files
              </Label>
              <Input id="csv-file" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              {file && (
                <div className="mt-2 text-sm">
                  Selected: <span className="font-medium">{file.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file}>
              Upload and Import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
