import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
	CheckCircle2,
	Clock,
	FileCheck,
	Mail,
	MailCheck,
	Phone,
	ExternalLink,
	BookOpen,
	HelpCircle,
	LayoutDashboard,
	ArrowRight,
} from 'lucide-react'

export const metadata = {
	title: 'Application Submitted | tSmartCleaning',
}

export default function Page({ searchParams }: { searchParams?: { id?: string } }) {
	const id = searchParams?.id
	if (!id) return notFound()

	return (
		<div className="container max-w-4xl mx-auto py-12 px-4">
			<div className="text-center mb-8">
				<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
					<CheckCircle2 className="w-8 h-8 text-primary" />
				</div>
				<h1 className="text-4xl font-bold mb-3">Application Submitted Successfully!</h1>
				<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
					Thank you for applying to become a tSmartCleaning partner organization. We&apos;re excited about the
					possibility of working together to provide employment opportunities to those who need them most.
				</p>
			</div>

			<div className="grid gap-6 mb-8">
				{/* Application ID Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileCheck className="w-5 h-5" />
							Application Reference
						</CardTitle>
						<CardDescription>Save this ID for your records. You&apos;ll need it if you contact support.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-md font-mono text-sm">
							{id}
						</div>
					</CardContent>
				</Card>

				{/* Next Steps Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Clock className="w-5 h-5" />
							What Happens Next
						</CardTitle>
						<CardDescription>Here&apos;s what to expect during the review process</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex gap-4">
								<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
									1
								</div>
								<div className="flex-1">
									<h4 className="font-semibold mb-1">Verification (24-48 hours)</h4>
									<p className="text-sm text-muted-foreground">
										We will verify your organization&apos;s credentials and contact your references to confirm your
										partnership eligibility.
									</p>
								</div>
							</div>
							<div className="flex gap-4">
								<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
									2
								</div>
								<div className="flex-1">
									<h4 className="font-semibold mb-1">Background Check (2-3 days)</h4>
									<p className="text-sm text-muted-foreground">
										We will review your documentation, conduct organizational background checks, and verify your
										non-profit status.
									</p>
								</div>
							</div>
							<div className="flex gap-4">
								<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
									3
								</div>
								<div className="flex-1">
									<h4 className="font-semibold mb-1">Decision (3-5 business days)</h4>
									<p className="text-sm text-muted-foreground">
										You will receive an email notification with our decision and next steps if approved.
									</p>
								</div>
							</div>
							<div className="flex gap-4">
								<div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
									<CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
								</div>
								<div className="flex-1">
									<h4 className="font-semibold mb-1">If Approved</h4>
									<p className="text-sm text-muted-foreground">
										You&apos;ll receive immediate access to the partner portal, can schedule training sessions, and
										begin submitting candidates right away.
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Contact Information Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<HelpCircle className="w-5 h-5" />
							Need Help?
						</CardTitle>
						<CardDescription>Our partnership team is here to assist you</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-start gap-3">
								<Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
								<div>
									<p className="font-medium mb-1">Email Support</p>
									<a
										href="mailto:partnerships@tsmartcleaning.com"
										className="text-primary hover:underline text-sm"
									>
										partnerships@tsmartcleaning.com
									</a>
									<p className="text-xs text-muted-foreground mt-1">We typically respond within 24 hours</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
								<div>
									<p className="font-medium mb-1">Phone Support</p>
									<a href="tel:1-800-XXX-XXXX" className="text-primary hover:underline text-sm">
										1-800-XXX-XXXX
									</a>
									<p className="text-xs text-muted-foreground mt-1">Mon-Fri, 8am-5pm EST</p>
								</div>
							</div>
							<div className="pt-2 border-t">
								<p className="text-sm text-muted-foreground">
									When contacting support, please reference your Application ID: <strong>{id}</strong>
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Dashboard Link Card */}
				<Card className="border-primary/20 bg-primary/5">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<LayoutDashboard className="w-5 h-5" />
							Access Your Dashboard
						</CardTitle>
						<CardDescription>
							Once approved, you&apos;ll have full access to the partner dashboard to manage candidates and track
							placements.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href="/agency/dashboard">
							<Button size="lg" className="w-full sm:w-auto">
								Go to Dashboard
								<ArrowRight className="ml-2 w-4 h-4" />
							</Button>
						</Link>
						<p className="text-xs text-muted-foreground mt-3">
							Note: Dashboard access will be available after your application is approved.
						</p>
					</CardContent>
				</Card>

				{/* Resource Links Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BookOpen className="w-5 h-5" />
							Helpful Resources
						</CardTitle>
						<CardDescription>Learn more about our partnership program and platform</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-3 sm:grid-cols-2">
							<Link
								href="/ngo"
								className="flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors group"
							>
								<BookOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
								<div className="flex-1">
									<p className="font-medium text-sm">Partnership Overview</p>
									<p className="text-xs text-muted-foreground">Learn about our partnership program</p>
								</div>
								<ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
							</Link>
							<Link
								href="/contact"
								className="flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors group"
							>
								<HelpCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
								<div className="flex-1">
									<p className="font-medium text-sm">Contact Support</p>
									<p className="text-xs text-muted-foreground">Get answers to your questions</p>
								</div>
								<ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
							</Link>
							<Link
								href="/about"
								className="flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors group"
							>
								<BookOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
								<div className="flex-1">
									<p className="font-medium text-sm">About tSmartCleaning</p>
									<p className="text-xs text-muted-foreground">Our mission and values</p>
								</div>
								<ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
							</Link>
							<Link
								href="/blog"
								className="flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors group"
							>
								<BookOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
								<div className="flex-1">
									<p className="font-medium text-sm">Blog & Updates</p>
									<p className="text-xs text-muted-foreground">Latest news and insights</p>
								</div>
								<ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Email Confirmation Notice */}
			<div className="mt-8 p-4 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
				<div className="flex gap-3">
					<MailCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
					<div>
						<p className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-1">
							Check Your Email
						</p>
						<p className="text-sm text-blue-800 dark:text-blue-200">
							We&apos;ve sent a confirmation email with your application details and next steps. Please check your
							inbox (and spam folder) for important updates.
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}


