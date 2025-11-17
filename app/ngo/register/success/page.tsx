import React from 'react'
import { notFound } from 'next/navigation'

export const metadata = {
	title: 'Application Submitted | tSmartCleaning',
}

export default function Page({ searchParams }: { searchParams?: { id?: string } }) {
	const id = searchParams?.id
	if (!id) return notFound()

	return (
		<div className="container max-w-3xl mx-auto py-12">
			<h1 className="text-3xl font-bold">Application Submitted Successfully!</h1>
			<div className="mt-4 space-y-4">
				<p>
					Thank you for applying to become a tSmartCleaning partner organization. We&apos;re excited about the
					possibility of working together to provide employment opportunities to those who need them most.
				</p>
				<div className="rounded-md border p-4 bg-muted/30">
					<p className="font-medium">Application ID:</p>
					<p className="text-sm text-muted-foreground">{id}</p>
				</div>
				<div className="space-y-2">
					<p className="font-medium">What Happens Next:</p>
					<ol className="list-disc pl-6 space-y-1">
						<li>Verification (24-48 hours): We will verify your credentials and contact your references</li>
						<li>Background Check (2-3 days): We will review your documentation and conduct checks</li>
						<li>Decision (3-5 business days): You will receive an email with our decision</li>
						<li>If Approved: Immediate access to partner portal and training session scheduling</li>
					</ol>
				</div>
				<div className="rounded-md border p-4">
					<p className="font-medium">Questions?</p>
					<p>Contact: partnerships@tsmartcleaning.com</p>
					<p>Phone: 1-800-XXX-XXXX</p>
				</div>
			</div>
		</div>
	)
}


