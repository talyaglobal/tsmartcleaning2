'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface CampaignData {
  name: string
  type: 'email' | 'sms' | 'whatsapp' | 'meta_ads' | 'google_ads'
  audienceFilter: Record<string, unknown>
  template: string
  scheduledAt: string | null
  budget?: number
}

interface CampaignBuilderProps {
  onSave: (campaign: CampaignData) => Promise<void>
}

export function CampaignBuilder({ onSave }: CampaignBuilderProps) {
  const [campaign, setCampaign] = useState<CampaignData>({
    name: '',
    type: 'email',
    audienceFilter: {},
    template: '',
    scheduledAt: null,
    budget: 0
  })

  const [audiencePreview, setAudiencePreview] = useState<number>(0)

  const audienceFilters = [
    { key: 'role', label: 'User Type', options: ['customer', 'provider'] },
    { key: 'loyaltyTier', label: 'Loyalty Tier', options: ['basic', 'silver', 'gold', 'platinum'] },
    { key: 'lastBookingDays', label: 'Last Booking (days ago)', type: 'number' },
    { key: 'zipCodes', label: 'ZIP Codes', type: 'text' },
    { key: 'totalSpent', label: 'Total Spent ($)', type: 'number' }
  ]

  const generateAudiencePreview = async (filters: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/campaigns/audience-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      })
      if (!response.ok) {
        setAudiencePreview(0)
        return
      }
      const { count } = await response.json()
      setAudiencePreview(count)
    } catch {
      setAudiencePreview(0)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Create Marketing Campaign</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Name</label>
            <Input
              value={campaign.name}
              onChange={(e) => setCampaign(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Holiday Cleaning Special"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Channel</label>
            <Select value={campaign.type} onValueChange={(value) => setCampaign(prev => ({ ...prev, type: value as CampaignData['type'] }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="meta_ads">Meta Ads</SelectItem>
                <SelectItem value="google_ads">Google Ads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Target Audience</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 mb-4">
              {audienceFilters.map(filter => (
                <div key={filter.key}>
                  <label className="block text-sm font-medium mb-1">{filter.label}</label>
                  {'options' in filter ? (
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${filter.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(filter as any).options.map((option: string) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input type={(filter as any).type} placeholder={`Enter ${filter.label}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => generateAudiencePreview(campaign.audienceFilter)}
              >
                Preview Audience
              </Button>
              <span className="text-sm text-gray-600">
                Estimated reach: <strong>{audiencePreview.toLocaleString()}</strong> users
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Message Content</h3>
          {campaign.type === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject Line</label>
                <Input placeholder="🏠 Special Offer: 20% Off Your Next Cleaning!" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Content</label>
                <Textarea
                  rows={8}
                  placeholder="Hi {{name}}, We've got an exclusive offer for you..."
                />
              </div>
            </div>
          )}

          {(campaign.type === 'sms' || campaign.type === 'whatsapp') && (
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <Textarea
                rows={4}
                placeholder="Hi {{name}}! Ready for your next cleaning? Book now and save 20%: {{booking_link}}"
              />
              <p className="text-sm text-gray-500 mt-1">
                Available variables: {'{{name}}'}, {'{{booking_link}}'}, {'{{loyalty_points}}'}
              </p>
            </div>
          )}

          {(campaign.type === 'meta_ads' || campaign.type === 'google_ads') && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ad Headline</label>
                <Input placeholder="Professional House Cleaning Services" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ad Description</label>
                <Textarea
                  rows={3}
                  placeholder="Book trusted, vetted cleaners in your area. Same-day service available."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Daily Budget ($)</label>
                <Input type="number" min={10} placeholder="50" />
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Schedule Campaign</h3>
          <div className="flex space-x-4">
            <Button variant="outline">Send Now</Button>
            <Button variant="outline">Schedule for Later</Button>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline">Save Draft</Button>
          <Button onClick={() => onSave(campaign)}>Create Campaign</Button>
        </div>
      </div>
    </div>
  )
}


