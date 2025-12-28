"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Video, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function DocumentationPage() {
	const documentationSections = [
		{
			title: "User Guides",
			description: "End-user documentation and guides",
			icon: BookOpen,
			href: "/docs/user-guides",
		},
		{
			title: "API Documentation",
			description: "Complete API reference and examples",
			icon: FileText,
			href: "/docs/api",
		},
		{
			title: "Admin Handbook",
			description: "Administrator guide and best practices",
			icon: HelpCircle,
			href: "/docs/admin-handbook",
		},
		{
			title: "Video Tutorials",
			description: "Video guides and walkthroughs",
			icon: Video,
			href: "/docs/videos",
		},
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title="Documentation"
				subtitle="Access user guides, API documentation, and tutorials"
			/>

			<div className="grid gap-4 md:grid-cols-2">
				{documentationSections.map((section) => {
					const Icon = section.icon;
					return (
						<Card key={section.title}>
							<CardHeader>
								<div className="flex items-center gap-2">
									<Icon className="h-5 w-5" />
									<CardTitle>{section.title}</CardTitle>
								</div>
								<CardDescription>{section.description}</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild variant="outline" className="w-full">
									<Link href={section.href}>View Documentation</Link>
								</Button>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Quick Links</CardTitle>
					<CardDescription>Common documentation resources</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2">
					<Link href="/docs/getting-started" className="text-sm text-primary hover:underline block">
						Getting Started Guide
					</Link>
					<Link href="/docs/troubleshooting" className="text-sm text-primary hover:underline block">
						Troubleshooting Guide
					</Link>
					<Link href="/docs/faq" className="text-sm text-primary hover:underline block">
						Frequently Asked Questions
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}

