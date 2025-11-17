"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

export default function SupportImmigrantWomenPage() {
  return (
    <div className="min-h-screen">

      <main>
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Support Immigrant Women</p>
            <h1 className="text-3xl md:text-5xl font-bold mt-2">Dual Value Proposition</h1>
            <p className="text-muted-foreground text-lg mt-4">
              Creating value for both sides of the marketplace
            </p>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">For Cleaning Companies</p>
                  <h2 className="text-2xl font-semibold mt-1">Access reliable labor and streamline operations</h2>
                </div>
                <ul className="space-y-4">
                  <ValueItem title="Reliable Labor Access" desc="Pre-vetted, motivated immigrant women workers ready to start immediately" />
                  <ValueItem title="All-in-One Operations" desc="Replace 3-5 software tools with one integrated Super App (save $200-500/month)" />
                  <ValueItem title="Reduced Turnover" desc="Cultural matching and support reduce the 75% industry turnover rate" />
                  <ValueItem title="Scalability" desc="Grow your business without worrying about labor supply constraints" />
                </ul>
              </Card>
              <Card className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">For Immigrant Women Cleaners</p>
                  <h2 className="text-2xl font-semibold mt-1">Work with dignity, grow with support</h2>
                </div>
                <ul className="space-y-4">
                  <ValueItem title="Direct Job Access" desc="Verified, well-paying jobs without exploitation or middlemen" />
                  <ValueItem title="Professional Development" desc="In-app training, certification courses, and career advancement opportunities" />
                  <ValueItem title="Supportive Community" desc="Culturally sensitive environment with multi-lingual support and peer connections" />
                  <ValueItem title="Financial Services" desc="Future access to micro-loans, remittance services, and financial literacy tools" />
                </ul>
              </Card>
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="text-black" asChild>
                <Link href="/contact">For Companies</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/provider-signup">For Cleaners</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function ValueItem({ title, desc }: { title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
    </li>
  )
}


