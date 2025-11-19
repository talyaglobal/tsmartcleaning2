'use client'

import { useState } from 'react'
import Link from "next/link"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, Mail, CreditCard, Plug, Save } from 'lucide-react'

export default function SettingsPage() {
	const [activeTab, setActiveTab] = useState<'general' | 'email' | 'payment' | 'integrations'>('general')
	const [saving, setSaving] = useState(false)

	const handleSave = async () => {
		setSaving(true)
		// Simulate save
		await new Promise((resolve) => setTimeout(resolve, 1000))
		setSaving(false)
	}

	return (
		<>
			<PageHeader
				title="System Settings"
				subtitle="Configure general, email, payment, and integration settings."
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Settings</span>
					</div>
				}
				tabs={
					<div className="flex gap-1 border-b border-slate-200">
						<button
							onClick={() => setActiveTab('general')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'general'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							<Settings className="h-4 w-4 inline mr-2" />
							General
						</button>
						<button
							onClick={() => setActiveTab('email')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'email'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							<Mail className="h-4 w-4 inline mr-2" />
							Email
						</button>
						<button
							onClick={() => setActiveTab('payment')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'payment'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							<CreditCard className="h-4 w-4 inline mr-2" />
							Payment
						</button>
						<button
							onClick={() => setActiveTab('integrations')}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === 'integrations'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-600 hover:text-slate-900'
							}`}
						>
							<Plug className="h-4 w-4 inline mr-2" />
							Integrations
						</button>
					</div>
				}
				actions={
					<Button onClick={handleSave} disabled={saving}>
						<Save className="h-4 w-4 mr-2" />
						{saving ? 'Saving...' : 'Save Changes'}
					</Button>
				}
			/>

			<div className="max-w-3xl">
				{activeTab === 'general' && (
					<div className="space-y-6">
						<div className="bg-white rounded-lg border border-slate-200 p-6">
							<h3 className="text-lg font-semibold mb-4">General Settings</h3>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">
										Site Name
									</label>
									<Input placeholder="tSmart Cleaning" />
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">
										Site URL
									</label>
									<Input placeholder="https://tsmartcleaning.com" />
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">
										Support Email
									</label>
									<Input type="email" placeholder="support@tsmartcleaning.com" />
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">
										Support Phone
									</label>
									<Input type="tel" placeholder="+1 (555) 123-4567" />
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === 'email' && (
					<div className="space-y-6">
						<div className="bg-white rounded-lg border border-slate-200 p-6">
							<h3 className="text-lg font-semibold mb-4">Email Settings</h3>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">
										SMTP Host
									</label>
									<Input placeholder="smtp.example.com" />
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">
										SMTP Port
									</label>
									<Input type="number" placeholder="587" />
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">
										SMTP Username
									</label>
									<Input placeholder="username" />
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">
										SMTP Password
									</label>
									<Input type="password" placeholder="••••••••" />
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">
										From Email
									</label>
									<Input type="email" placeholder="noreply@tsmartcleaning.com" />
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">
										From Name
									</label>
									<Input placeholder="tSmart Cleaning" />
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === 'payment' && (
					<div className="space-y-6">
						<div className="bg-white rounded-lg border border-slate-200 p-6">
							<h3 className="text-lg font-semibold mb-4">Payment Settings</h3>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">
										Stripe Publishable Key
									</label>
									<Input placeholder="pk_test_..." />
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">
										Stripe Secret Key
									</label>
									<Input type="password" placeholder="sk_test_..." />
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">
										Default Currency
									</label>
									<select className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
										<option value="USD">USD - US Dollar</option>
										<option value="EUR">EUR - Euro</option>
										<option value="GBP">GBP - British Pound</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">
										Platform Fee (%)
									</label>
									<Input type="number" placeholder="10" />
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === 'integrations' && (
					<div className="space-y-6">
						<div className="bg-white rounded-lg border border-slate-200 p-6">
							<h3 className="text-lg font-semibold mb-4">Integration Settings</h3>
							<div className="space-y-4">
								<div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
									<div>
										<p className="font-medium">WhatsApp Integration</p>
										<p className="text-sm text-slate-500">Connect WhatsApp for messaging</p>
									</div>
									<Button variant="outline" size="sm">
										Configure
									</Button>
								</div>
								<div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
									<div>
										<p className="font-medium">Google Analytics</p>
										<p className="text-sm text-slate-500">Track website analytics</p>
									</div>
									<Button variant="outline" size="sm">
										Configure
									</Button>
								</div>
								<div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
									<div>
										<p className="font-medium">Stripe Webhooks</p>
										<p className="text-sm text-slate-500">Payment event notifications</p>
									</div>
									<Button variant="outline" size="sm">
										Configure
									</Button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	)
}
