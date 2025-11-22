import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Users, TrendingUp, Zap, ArrowRight, Shield, Clock, DollarSign, Star, MapPin, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateBreadcrumbSchema, generateServiceSchema } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'For Cleaning Companies — Access Reliable Labor & Streamline Operations',
  description: 'Access reliable labor and streamline operations with our comprehensive platform designed specifically for cleaning businesses. Recruit, manage, and scale all in one app.',
  path: '/cleaning-companies',
  keywords: ['cleaning companies', 'cleaning business platform', 'labor management', 'cleaning company software', 'cleaning operations', 'cleaning business tools'],
})

export default function CleaningCompaniesPage() {
  return (
    <>
      <JsonLd
        data={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'For Cleaning Companies', url: '/cleaning-companies' },
          ]),
          generateServiceSchema({
            name: 'Cleaning Company Platform',
            description: 'Comprehensive platform for cleaning companies to access reliable labor, streamline operations, and scale their business.',
            serviceType: 'Business Management Platform',
          }),
        ]}
      />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            For Cleaning Companies
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Access reliable labor and streamline operations with our comprehensive platform designed specifically for cleaning businesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 py-3">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3">
              Schedule Demo
            </Button>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Reliable Labor Access</h3>
              <p className="text-gray-600 text-sm">Pre-vetted, motivated immigrant women workers ready to start immediately</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">All-in-One Operations</h3>
              <p className="text-gray-600 text-sm">Replace 3-5 software tools with one integrated Super App (save $200-500/month)</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Reduced Turnover</h3>
              <p className="text-gray-600 text-sm">Cultural matching and support reduce the 75% industry turnover rate</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Scalability</h3>
              <p className="text-gray-600 text-sm">Grow your business without worrying about labor supply constraints</p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Sections */}
        <div className="space-y-16 mb-16">
          {/* Labor Access Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Access Quality Workers Instantly</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Pre-screened Professionals</h3>
                    <p className="text-gray-600">All workers undergo thorough background checks and skill assessments</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Available When You Need</h3>
                    <p className="text-gray-600">Fill last-minute cancellations and scale up for busy seasons</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Cultural Compatibility</h3>
                    <p className="text-gray-600">Match workers with your company culture and values</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Worker Pool Statistics</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-blue-100">Vetted Workers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">24hr</div>
                  <div className="text-blue-100">Avg Response Time</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">4.8★</div>
                  <div className="text-blue-100">Average Rating</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">25%</div>
                  <div className="text-blue-100">Turnover Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Operations Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Replace Multiple Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="line-through text-gray-500">Scheduling Software</span>
                      <Badge variant="outline" className="ml-auto">$50/mo</Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="line-through text-gray-500">Staff Management</span>
                      <Badge variant="outline" className="ml-auto">$80/mo</Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="line-through text-gray-500">Customer CRM</span>
                      <Badge variant="outline" className="ml-auto">$100/mo</Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="line-through text-gray-500">Payment Processing</span>
                      <Badge variant="outline" className="ml-auto">$75/mo</Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="line-through text-gray-500">Communication Tools</span>
                      <Badge variant="outline" className="ml-auto">$45/mo</Badge>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border-2 border-green-200">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-700">TSmart Cleaning Super App</span>
                        <Badge className="ml-auto bg-green-600">$99/mo</Badge>
                      </div>
                      <div className="text-center mt-4 text-green-600 font-semibold">
                        Save $250+ per month
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold mb-6">Streamline Your Operations</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Automated Scheduling</h3>
                    <p className="text-gray-600">Smart scheduling that optimizes routes and maximizes efficiency</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Integrated Payments</h3>
                    <p className="text-gray-600">Handle invoicing, payments, and payroll all in one place</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Customer Management</h3>
                    <p className="text-gray-600">Track customer preferences, history, and feedback seamlessly</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Success Stories */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-12">Success Stories</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-green-600 mb-2">40%</div>
                  <div className="text-lg font-semibold mb-2">Cost Reduction</div>
                  <p className="text-gray-600 text-sm">"We cut our operational costs by 40% and increased our client capacity by 200%"</p>
                  <div className="mt-4 text-sm font-medium">- Miami Cleaning Co.</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-blue-600 mb-2">85%</div>
                  <div className="text-lg font-semibold mb-2">Less Turnover</div>
                  <p className="text-gray-600 text-sm">"Our staff turnover dropped from 75% to just 15% with better worker matching"</p>
                  <div className="mt-4 text-sm font-medium">- Elite Cleaners LLC</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-purple-600 mb-2">3x</div>
                  <div className="text-lg font-semibold mb-2">Business Growth</div>
                  <p className="text-gray-600 text-sm">"We tripled our business size in just 6 months with reliable staffing"</p>
                  <div className="mt-4 text-sm font-medium">- Sparkle Clean Services</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Cleaning Business?</h2>
          <p className="text-xl mb-8 text-blue-100">Join hundreds of cleaning companies already growing with TSmart Cleaning</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="px-8 py-3">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600">
              <Phone className="mr-2 h-5 w-5" />
              Call (555) 123-4567
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-blue-100 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>support@tsmartcleaning.com</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Available Nationwide</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}