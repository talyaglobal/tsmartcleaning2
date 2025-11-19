'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'

interface AvailabilityCalendarProps {
  companyId: string
}

export function AvailabilityCalendar({ companyId }: AvailabilityCalendarProps) {
  const [availability, setAvailability] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true)
      try {
        // Fetch availability for the next 7 days
        const today = new Date()
        const dates: string[] = []
        for (let i = 0; i < 7; i++) {
          const date = new Date(today)
          date.setDate(today.getDate() + i)
          dates.push(date.toISOString().split('T')[0])
        }

        const availabilityData: Record<string, string[]> = {}
        
        // Note: Availability API is designed for providers, not companies
        // For now, we'll try to fetch but gracefully handle if it doesn't work
        for (const date of dates) {
          try {
            const response = await fetch(`/api/availability?date=${date}`)
            if (response.ok) {
              const data = await response.json()
              availabilityData[date] = data.slots?.map((slot: { time: string }) => slot.time) || []
            }
          } catch (error) {
            // Silently fail - availability might not be available for companies
            console.debug(`Availability not available for ${date}`)
          }
        }

        setAvailability(availabilityData)
      } catch (error) {
        console.error('Error fetching availability:', error)
      } finally {
        setLoading(false)
      }
    }

    if (companyId) {
      fetchAvailability()
    }
  }, [companyId])

  const getNext7Days = () => {
    const days = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: i === 0,
      })
    }
    return days
  }

  const days = getNext7Days()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading availability...
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasAnyAvailability = Object.values(availability).some(slots => slots.length > 0)

  if (!hasAnyAvailability) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No availability information available</p>
            <p className="text-sm mt-1">Contact us to check availability</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {days.map((day) => {
            const slots = availability[day.date] || []
            const hasSlots = slots.length > 0

            return (
              <div
                key={day.date}
                className={`border rounded-lg p-4 ${hasSlots ? 'bg-green-50/50 dark:bg-green-950/20' : 'bg-muted/30'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {day.dayName}, {day.month} {day.dayNumber}
                    </span>
                    {day.isToday && (
                      <Badge variant="secondary" className="text-xs">
                        Today
                      </Badge>
                    )}
                  </div>
                  {hasSlots ? (
                    <Badge variant="default" className="bg-green-600">
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Unavailable</Badge>
                  )}
                </div>
                {hasSlots ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {slots.map((slot) => (
                      <div
                        key={slot}
                        className="flex items-center gap-1 px-2 py-1 bg-background rounded border text-sm"
                      >
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {slot}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">
                    No available time slots
                  </p>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p>
            <strong>Note:</strong> Availability is subject to change. Book now to secure your preferred time slot.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

