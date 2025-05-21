import { Metadata } from 'next'
import VirtualPhoneInterface from '@/components/virtual-phone/VirtualPhoneInterface'

export const metadata: Metadata = {
  title: 'Virtual Phone',
  description: 'Manage your SMS conversations',
}

export default function VirtualPhonePage() {
  return (
    <div className="container mx-auto py-4 px-4 md:px-6">
      <VirtualPhoneInterface />
    </div>
  )
} 