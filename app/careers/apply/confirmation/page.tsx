'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CheckCircle2, Mail, FileText, Home, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateBreadcrumbSchema } from '@/lib/seo'

export default function ApplicationConfirmationPage() {
  const searchParams = useSearchParams()
  const applicationId = searchParams.get('applicationId')

  return (
    <div className="min-h-screen py-12 md:py-20 bg-gradient-to-b from-primary/5 to-background">
      <JsonLd
        data={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Careers', url: '/careers' },
          { name: 'Apply', url: '/careers/apply' },
          { name: 'Confirmation', url: '/careers/apply/confirmation' },
        ])}
      />

      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="pt-12 pb-8">
            <div className="text-center space-y-6">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
              </div>

              {/* Success Message */}
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold">Application Submitted!</h1>
                <p className="text-lg text-muted-foreground">
                  Thank you for your interest in joining our team.
                </p>
              </div>

              {/* Application ID */}
              {applicationId && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Application ID</p>
                  <p className="font-mono text-sm font-semibold">{applicationId}</p>
                </div>
              )}

              {/* What Happens Next */}
              <div className="text-left space-y-4 pt-6 border-t">
                <h2 className="text-xl font-semibold">What Happens Next?</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-semibold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Confirmation Email</p>
                      <p className="text-sm text-muted-foreground">
                        You'll receive a confirmation email shortly with your application details.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-semibold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Review Process</p>
                      <p className="text-sm text-muted-foreground">
                        Our hiring team will review your application within 5-7 business days.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-semibold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Next Steps</p>
                      <p className="text-sm text-muted-foreground">
                        If your profile matches our requirements, we'll reach out to schedule an interview.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Track Application */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-left">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Track Your Application</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Want to check the status of your application? Use your email address to track it anytime.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/careers/application-tracker">
                        Track Application Status
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button asChild variant="outline">
                  <Link href="/careers">
                    <FileText className="h-4 w-4 mr-2" />
                    View Other Positions
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Return Home
                  </Link>
                </Button>
              </div>

              {/* Contact Info */}
              <div className="pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Have questions?{' '}
                  <Link href="/contact" className="text-primary hover:underline font-medium">
                    Contact our team
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

