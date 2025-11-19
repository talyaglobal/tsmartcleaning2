'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Job {
  id: string
  service: string
  customerId: string
  date: string
  time: string
  location: string
  status: string
  earnings: number
}

interface UpcomingJobsCalendarProps {
  jobs: Job[]
  providerId?: string | null
}

export function UpcomingJobsCalendar({ jobs, providerId }: UpcomingJobsCalendarProps) {
  // Group jobs by date
  const jobsByDate = jobs.reduce((acc, job) => {
    const date = job.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(job)
    return acc
  }, {} as Record<string, Job[]>)

  // Get next 7 days
  const getNext7Days = () => {
    const days = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: i === 0,
        jobs: jobsByDate[dateStr] || []
      })
    }
    return days
  }

  const calendarDays = getNext7Days()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Jobs Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {calendarDays.map((day) => (
            <div
              key={day.date}
              className={`border rounded-lg p-4 ${
                day.isToday ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">
                    {day.dayName}, {day.month} {day.dayNumber}
                  </div>
                  {day.isToday && (
                    <Badge variant="secondary" className="text-xs">Today</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {day.jobs.length} {day.jobs.length === 1 ? 'job' : 'jobs'}
                </div>
              </div>
              
              {day.jobs.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  No jobs scheduled
                </div>
              ) : (
                <div className="space-y-3">
                  {day.jobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-background border rounded-md p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{job.service}</div>
                        <Badge
                          variant={job.status === 'confirmed' ? 'secondary' : 'outline'}
                        >
                          {job.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>{job.time || 'Time TBD'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{job.location}</span>
                        </div>
                        <div className="text-green-600 font-semibold">
                          ${job.earnings.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Link href={`/provider/bookings?bookingId=${job.id}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {jobs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No upcoming jobs scheduled</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

