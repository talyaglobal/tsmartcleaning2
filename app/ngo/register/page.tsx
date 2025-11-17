import React from 'react'
import NGORegistrationForm from '@/components/ngo/NGORegistrationForm'

export const metadata = {
	title: 'NGO/Agency Registration | tSmartCleaning',
}

export default function Page() {
	return (
		<div className="container max-w-4xl mx-auto py-10">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Partner with tSmartCleaning</h1>
				<p className="text-muted-foreground mt-2">
					Complete this application to become an approved NGO/agency partner. Sections 1–4 required.
				</p>
			</div>
			<NGORegistrationForm />
		</div>
	)
}


