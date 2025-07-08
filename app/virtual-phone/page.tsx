import { Metadata } from 'next'
import VirtualPhoneInterface from '@/components/virtual-phone/VirtualPhoneInterface'

export const metadata: Metadata = {
  title: 'Virtual Phone',
  description: 'Manage your SMS conversations',
}

export default function VirtualPhonePage() {
  return (
    <div className="container mx-auto py-4 px-4 md:px-6">
      {/* Environment Variable Check */}
      {!process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold">Configuration Issue</h3>
          <p className="text-red-700 text-sm mt-1">
            NEXT_PUBLIC_TWILIO_PHONE_NUMBER is not configured. Check your environment variables.
          </p>
        </div>
      )}
      
      <VirtualPhoneInterface />
    </div>
  )
} 