'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, CheckCircle2, XCircle, Repeat, CalendarDays } from 'lucide-react'

interface ProviderAvailabilityManagerProps {
  providerId?: string | null
}

export function ProviderAvailabilityManager({ providerId }: ProviderAvailabilityManagerProps) {
  const [availability, setAvailability] = useState<Record<string, string[]>>({})
  const [recurringSchedule, setRecurringSchedule] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [useRecurring, setUseRecurring] = useState(false)

  // Generate next 7 days
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
      })
    }
    return days
  }

  const days = getNext7Days()

  // Load existing availability on mount
  useEffect(() => {
    if (providerId) {
      loadAvailability()
    }
  }, [providerId])

  const loadAvailability = async () => {
    if (!providerId) return
    
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
      const next7Days = getNext7Days()
      const dates = next7Days.map(d => d.date)
      
      const response = await fetch(
        `${baseUrl}/api/availability?providerId=${providerId}&dates=${dates.join(',')}`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.availability) {
          const availabilityMap: Record<string, string[]> = {}
          data.availability.forEach((avail: { date: string; time_slots: string[] }) => {
            availabilityMap[avail.date] = avail.time_slots || []
          })
          setAvailability(availabilityMap)
        }
      }
    } catch (error) {
      console.error('Error loading availability:', error)
    } finally {
      setLoading(false)
    }
  }

  // Standard time slots
  const standardTimeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ]

  const toggleTimeSlot = (date: string, timeSlot: string) => {
    setAvailability(prev => {
      const dateSlots = prev[date] || []
      const isSelected = dateSlots.includes(timeSlot)
      
      if (isSelected) {
        return {
          ...prev,
          [date]: dateSlots.filter(slot => slot !== timeSlot)
        }
      } else {
        return {
          ...prev,
          [date]: [...dateSlots, timeSlot].sort()
        }
      }
    })
  }

  const setAllDayAvailable = (date: string) => {
    setAvailability(prev => ({
      ...prev,
      [date]: [...standardTimeSlots]
    }))
  }

  const clearDay = (date: string) => {
    setAvailability(prev => {
      const newAvail = { ...prev }
      delete newAvail[date]
      return newAvail
    })
  }

  useEffect(() => {
    if (providerId) {
      loadAvailability()
    }
  }, [providerId])

  async function loadAvailability() {
    if (!providerId) return
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
      const res = await fetch(`${baseUrl}/api/availability?providerId=${providerId}`)
      if (res.ok) {
        const data = await res.json()
        // Load existing availability if available
        if (data.availability) {
          const availMap: Record<string, string[]> = {}
          data.availability.forEach((avail: any) => {
            availMap[avail.date] = avail.time_slots || []
          })
          setAvailability(availMap)
        }
      }
    } catch (error) {
      console.error('Error loading availability:', error)
    }
  }

  const saveAvailability = async () => {
    if (!providerId) return
    
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
      const response = await fetch(`${baseUrl}/api/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          availability: Object.entries(availability).map(([date, slots]) => ({
            date,
            time_slots: slots
          })),
          recurringSchedule: useRecurring ? Object.entries(recurringSchedule).map(([day, slots]) => ({
            day_of_week: parseInt(day),
            time_slots: slots
          })) : undefined
        })
      })

      if (response.ok) {
        alert('Availability updated successfully!')
        await loadAvailability()
      } else {
        alert('Failed to update availability')
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      alert('Error saving availability')
    } finally {
      setLoading(false)
    }
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayAbbrevs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const toggleRecurringSlot = (dayOfWeek: number, timeSlot: string) => {
    setRecurringSchedule(prev => {
      const daySlots = prev[dayOfWeek.toString()] || []
      const isSelected = daySlots.includes(timeSlot)
      
      if (isSelected) {
        return {
          ...prev,
          [dayOfWeek.toString()]: daySlots.filter(slot => slot !== timeSlot)
        }
      } else {
        return {
          ...prev,
          [dayOfWeek.toString()]: [...daySlots, timeSlot].sort()
        }
      }
    })
  }

  const setAllDayRecurring = (dayOfWeek: number) => {
    setRecurringSchedule(prev => ({
      ...prev,
      [dayOfWeek.toString()]: [...standardTimeSlots]
    }))
  }

  const clearRecurringDay = (dayOfWeek: number) => {
    setRecurringSchedule(prev => {
      const newSchedule = { ...prev }
      delete newSchedule[dayOfWeek.toString()]
      return newSchedule
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Manage Availability
        </CardTitle>
        <CardDescription>
          Set your availability for the next week or create a recurring schedule
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">
              <CalendarDays className="h-4 w-4 mr-2" />
              Next 7 Days
            </TabsTrigger>
            <TabsTrigger value="recurring">
              <Repeat className="h-4 w-4 mr-2" />
              Recurring Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-6">
            {days.map((day) => {
              const daySlots = availability[day.date] || []
              const isToday = day.date === new Date().toISOString().split('T')[0]
              
              return (
                <div key={day.date} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {day.dayName}, {day.month} {day.dayNumber}
                        {isToday && <Badge variant="secondary" className="text-xs">Today</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {daySlots.length} {daySlots.length === 1 ? 'slot' : 'slots'} available
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAllDayAvailable(day.date)}
                      >
                        All Day
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => clearDay(day.date)}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {standardTimeSlots.map((slot) => {
                      const isSelected = daySlots.includes(slot)
                      return (
                        <Button
                          key={slot}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleTimeSlot(day.date, slot)}
                          className="h-10"
                        >
                          {slot}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </TabsContent>

          <TabsContent value="recurring" className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="recurring-toggle" className="text-base font-medium">
                  Enable Recurring Schedule
                </Label>
                <p className="text-sm text-muted-foreground">
                  Set your weekly availability pattern that repeats automatically
                </p>
              </div>
              <Switch
                id="recurring-toggle"
                checked={useRecurring}
                onCheckedChange={setUseRecurring}
              />
            </div>

            {useRecurring && (
              <>
                {dayNames.map((dayName, dayOfWeek) => {
                  const daySlots = recurringSchedule[dayOfWeek.toString()] || []
                  
                  return (
                    <div key={dayOfWeek} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold">{dayName}</div>
                          <div className="text-sm text-muted-foreground">
                            {daySlots.length} {daySlots.length === 1 ? 'slot' : 'slots'} available
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAllDayRecurring(dayOfWeek)}
                          >
                            All Day
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => clearRecurringDay(dayOfWeek)}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {standardTimeSlots.map((slot) => {
                          const isSelected = daySlots.includes(slot)
                          return (
                            <Button
                              key={slot}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleRecurringSlot(dayOfWeek, slot)}
                              className="h-10"
                            >
                              {slot}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </TabsContent>
        </Tabs>
          
        <div className="flex justify-end gap-2 pt-4 border-t mt-6">
          <Button variant="outline" onClick={() => {
            setAvailability({})
            setRecurringSchedule({})
          }}>
            Clear All
          </Button>
          <Button onClick={saveAvailability} disabled={loading || !providerId}>
            {loading ? 'Saving...' : 'Save Availability'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

