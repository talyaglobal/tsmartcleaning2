'use client'

import React, { useEffect, useState } from "react";
import { MetricCard } from "@/components/admin/MetricCard";
import { Users, Building2, Headphones, Activity, FileText, TrendingUp, MessageSquare, AlertCircle, CheckCircle, Clock, Plus, Edit } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { QuickActionCard } from "@/components/admin/QuickActionCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type TeamStats = {
	platformUsers: number;
	activeCompanies: number;
	openTickets: number;
	ticketsChange: number;
	systemUptime: string;
	totalBlogPosts: number;
	publishedBlogPosts: number;
	newUsers7d: number;
	newCompanies7d: number;
};

type SupportTicket = {
	id: string;
	ticket_number: string;
	subject: string;
	status: string;
	priority: string;
	category: string;
	created_at: string;
	users?: {
		full_name: string;
		email: string;
	};
};

type BlogPost = {
	id: string;
	title: string;
	status: string;
	published_at: string | null;
	created_at: string;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function TeamDashboard() {
	const [stats, setStats] = useState<TeamStats | null>(null);
	const [recentTickets, setRecentTickets] = useState<SupportTicket[]>([]);
	const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchDashboardData();
	}, []);

	const fetchDashboardData = async () => {
		try {
			const [statsRes, ticketsRes, postsRes] = await Promise.all([
				fetch('/api/team/stats'),
				fetch('/api/team/support-tickets?limit=5'),
				fetch('/api/blog?limit=5&status=all')
			]);

			const [statsData, ticketsData, postsData] = await Promise.all([
				statsRes.json(),
				ticketsRes.json(),
				postsRes.json()
			]);

			if (statsData.stats) {
				setStats(statsData.stats);
			}
			if (ticketsData.tickets) {
				setRecentTickets(ticketsData.tickets.slice(0, 5));
			}
			if (postsData.posts) {
				setRecentPosts(postsData.posts.slice(0, 5));
			}
		} catch (error) {
			console.error('Error fetching dashboard data:', error);
		} finally {
			setLoading(false);
		}
	};

	const getStatusBadge = (status: string) => {
		const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
			open: 'destructive',
			in_progress: 'default',
			resolved: 'secondary',
			closed: 'outline'
		};
		return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
	};

	const getPriorityBadge = (priority: string) => {
		const colors: Record<string, string> = {
			low: 'bg-gray-100 text-gray-800',
			medium: 'bg-blue-100 text-blue-800',
			high: 'bg-orange-100 text-orange-800',
			urgent: 'bg-red-100 text-red-800'
		};
		return <Badge className={colors[priority] || 'bg-gray-100'}>{priority}</Badge>;
	};

	// Chart data for analytics
	const ticketStatusData = recentTickets.reduce((acc, ticket) => {
		acc[ticket.status] = (acc[ticket.status] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const chartData = Object.entries(ticketStatusData).map(([status, count]) => ({
		name: status.replace('_', ' '),
		value: count
	}));

	// User growth chart data (mock - would come from real data)
	const userGrowthData = [
		{ month: 'Jan', users: stats?.newUsers7d || 0 },
		{ month: 'Feb', users: (stats?.newUsers7d || 0) + 50 },
		{ month: 'Mar', users: (stats?.newUsers7d || 0) + 120 },
		{ month: 'Apr', users: (stats?.newUsers7d || 0) + 200 },
		{ month: 'May', users: (stats?.newUsers7d || 0) + 280 },
		{ month: 'Jun', users: (stats?.newUsers7d || 0) + 350 }
	];

	if (loading) {
		return (
			<div className="space-y-6">
				<PageHeader title="Platform Team Dashboard" subtitle="Platform operations overview" />
				<div className="text-center py-12">Loading dashboard data...</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader title="Platform Team Dashboard" subtitle="Platform operations overview" />
			
			{/* Metrics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<MetricCard 
					title="Platform Users" 
					value={stats?.platformUsers.toLocaleString() || '0'} 
					icon={<Users className="w-6 h-6" />} 
				/>
				<MetricCard 
					title="Active Companies" 
					value={stats?.activeCompanies.toLocaleString() || '0'} 
					icon={<Building2 className="w-6 h-6" />} 
				/>
				<MetricCard 
					title="Open Tickets" 
					value={stats?.openTickets.toLocaleString() || '0'} 
					change={stats?.ticketsChange ? { value: Math.abs(stats.ticketsChange), positive: stats.ticketsChange > 0 ? false : true } : undefined}
					icon={<Headphones className="w-6 h-6" />} 
				/>
				<MetricCard 
					title="System Uptime" 
					value={stats?.systemUptime || '99.97%'} 
					subtitle="Last 30 days" 
					icon={<Activity className="w-6 h-6" />} 
				/>
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<QuickActionCard title="Create announcement" href="/team/announcements" />
				<QuickActionCard title="Respond to ticket" href="/team/support" />
				<QuickActionCard title="View analytics" href="/team/stats" />
				<QuickActionCard title="Update content" href="/team/content" />
			</div>

			{/* Main Content Tabs */}
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="tickets">Support Tickets</TabsTrigger>
					<TabsTrigger value="content">Content Management</TabsTrigger>
					<TabsTrigger value="analytics">Analytics</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-4">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						<Card>
							<CardHeader>
								<CardTitle>Recent Support Tickets</CardTitle>
								<CardDescription>Latest open tickets requiring attention</CardDescription>
							</CardHeader>
							<CardContent>
								{recentTickets.length === 0 ? (
									<div className="text-center py-8 text-gray-500">No recent tickets</div>
								) : (
									<div className="space-y-3">
										{recentTickets.map((ticket) => (
											<Link key={ticket.id} href={`/team/support/${ticket.id}`}>
												<div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
													<div className="flex-1">
														<div className="flex items-center gap-2 mb-1">
															<span className="font-medium text-sm">{ticket.ticket_number}</span>
															{getStatusBadge(ticket.status)}
															{getPriorityBadge(ticket.priority)}
														</div>
														<p className="text-sm text-gray-600">{ticket.subject}</p>
														{ticket.users && (
															<p className="text-xs text-gray-500 mt-1">{ticket.users.full_name} • {ticket.users.email}</p>
														)}
													</div>
													<div className="text-xs text-gray-400">
														{new Date(ticket.created_at).toLocaleDateString()}
													</div>
												</div>
											</Link>
										))}
									</div>
								)}
								<div className="mt-4">
									<Link href="/team/support">
										<Button variant="outline" className="w-full">
											View All Tickets
										</Button>
									</Link>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Content Overview</CardTitle>
								<CardDescription>Blog posts and content status</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-4 mb-4">
									<div className="p-4 bg-blue-50 rounded-lg">
										<div className="text-2xl font-bold">{stats?.totalBlogPosts || 0}</div>
										<div className="text-sm text-gray-600">Total Posts</div>
									</div>
									<div className="p-4 bg-green-50 rounded-lg">
										<div className="text-2xl font-bold">{stats?.publishedBlogPosts || 0}</div>
										<div className="text-sm text-gray-600">Published</div>
									</div>
								</div>
								<div className="space-y-2">
									{recentPosts.length === 0 ? (
										<div className="text-center py-4 text-gray-500 text-sm">No recent posts</div>
									) : (
										recentPosts.map((post) => (
											<Link key={post.id} href={`/team/content/${post.id}`}>
												<div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer">
													<div className="flex-1">
														<div className="flex items-center gap-2">
															<span className="text-sm font-medium">{post.title}</span>
															<Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
																{post.status}
															</Badge>
														</div>
														<p className="text-xs text-gray-500 mt-1">
															{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}
														</p>
													</div>
												</div>
											</Link>
										))
									)}
								</div>
								<div className="mt-4">
									<Link href="/team/content">
										<Button variant="outline" className="w-full">
											<Plus className="w-4 h-4 mr-2" />
											New Blog Post
										</Button>
									</Link>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Recent Activity</CardTitle>
							<CardDescription>Last 7 days platform activity</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="p-4 border rounded-lg">
									<div className="text-2xl font-bold text-blue-600">{stats?.newUsers7d || 0}</div>
									<div className="text-sm text-gray-600">New Users (7d)</div>
								</div>
								<div className="p-4 border rounded-lg">
									<div className="text-2xl font-bold text-green-600">{stats?.newCompanies7d || 0}</div>
									<div className="text-sm text-gray-600">New Companies (7d)</div>
								</div>
								<div className="p-4 border rounded-lg">
									<div className="text-2xl font-bold text-orange-600">{stats?.openTickets || 0}</div>
									<div className="text-sm text-gray-600">Open Tickets</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Support Tickets Tab */}
				<TabsContent value="tickets" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Support Ticket Management</CardTitle>
									<CardDescription>Manage and respond to support tickets</CardDescription>
								</div>
								<Link href="/team/support">
									<Button>
										<Plus className="w-4 h-4 mr-2" />
										New Ticket
									</Button>
								</Link>
							</div>
						</CardHeader>
						<CardContent>
							{recentTickets.length === 0 ? (
								<div className="text-center py-12">
									<Headphones className="w-12 h-12 mx-auto text-gray-400 mb-4" />
									<p className="text-gray-500">No support tickets</p>
								</div>
							) : (
								<div className="space-y-3">
									{recentTickets.map((ticket) => (
										<Link key={ticket.id} href={`/team/support/${ticket.id}`}>
											<div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
												<div className="flex-1">
													<div className="flex items-center gap-3 mb-2">
														<span className="font-semibold">{ticket.ticket_number}</span>
														{getStatusBadge(ticket.status)}
														{getPriorityBadge(ticket.priority)}
														<Badge variant="outline">{ticket.category}</Badge>
													</div>
													<p className="font-medium mb-1">{ticket.subject}</p>
													{ticket.users && (
														<p className="text-sm text-gray-600">{ticket.users.full_name} • {ticket.users.email}</p>
													)}
												</div>
												<div className="text-sm text-gray-500 ml-4">
													{new Date(ticket.created_at).toLocaleString()}
												</div>
											</div>
										</Link>
									))}
								</div>
							)}
							<div className="mt-6">
								<Link href="/team/support">
									<Button variant="outline" className="w-full">
										View All Tickets
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Content Management Tab */}
				<TabsContent value="content" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Blog Content Management</CardTitle>
									<CardDescription>Manage blog posts and content</CardDescription>
								</div>
								<Link href="/team/content/new">
									<Button>
										<Plus className="w-4 h-4 mr-2" />
										New Post
									</Button>
								</Link>
							</div>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
								<div className="p-4 bg-gray-50 rounded-lg">
									<div className="text-3xl font-bold">{stats?.totalBlogPosts || 0}</div>
									<div className="text-sm text-gray-600 mt-1">Total Posts</div>
								</div>
								<div className="p-4 bg-blue-50 rounded-lg">
									<div className="text-3xl font-bold">{stats?.publishedBlogPosts || 0}</div>
									<div className="text-sm text-gray-600 mt-1">Published</div>
								</div>
								<div className="p-4 bg-orange-50 rounded-lg">
									<div className="text-3xl font-bold">{(stats?.totalBlogPosts || 0) - (stats?.publishedBlogPosts || 0)}</div>
									<div className="text-sm text-gray-600 mt-1">Drafts</div>
								</div>
							</div>
							{recentPosts.length === 0 ? (
								<div className="text-center py-12">
									<FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
									<p className="text-gray-500 mb-4">No blog posts yet</p>
									<Link href="/team/content/new">
										<Button>
											<Plus className="w-4 h-4 mr-2" />
											Create First Post
										</Button>
									</Link>
								</div>
							) : (
								<div className="space-y-3">
									{recentPosts.map((post) => (
										<Link key={post.id} href={`/team/content/${post.id}`}>
											<div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-1">
														<span className="font-medium">{post.title}</span>
														<Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
															{post.status}
														</Badge>
													</div>
													<p className="text-sm text-gray-500">
														{post.published_at ? `Published: ${new Date(post.published_at).toLocaleDateString()}` : 'Draft'}
													</p>
												</div>
												<Button variant="ghost" size="sm">
													<Edit className="w-4 h-4" />
												</Button>
											</div>
										</Link>
									))}
								</div>
							)}
							<div className="mt-6">
								<Link href="/team/content">
									<Button variant="outline" className="w-full">
										Manage All Content
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Analytics Tab */}
				<TabsContent value="analytics" className="space-y-4">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						<Card>
							<CardHeader>
								<CardTitle>User Growth (Last 6 Months)</CardTitle>
								<CardDescription>New user registrations over time</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<LineChart data={userGrowthData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="month" />
										<YAxis />
										<Tooltip />
										<Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2} />
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Ticket Status Distribution</CardTitle>
								<CardDescription>Current ticket status breakdown</CardDescription>
							</CardHeader>
							<CardContent>
								{chartData.length > 0 ? (
									<ResponsiveContainer width="100%" height={300}>
										<PieChart>
											<Pie
												data={chartData}
												cx="50%"
												cy="50%"
												labelLine={false}
												label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
												outerRadius={80}
												fill="#8884d8"
												dataKey="value"
											>
												{chartData.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
												))}
											</Pie>
											<Tooltip />
										</PieChart>
									</ResponsiveContainer>
								) : (
									<div className="flex items-center justify-center h-[300px] text-gray-500">
										No ticket data available
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Platform Metrics Summary</CardTitle>
							<CardDescription>Key performance indicators</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div className="p-4 border rounded-lg">
									<div className="flex items-center gap-2 mb-2">
										<Users className="w-5 h-5 text-blue-600" />
										<span className="font-semibold">Total Users</span>
									</div>
									<div className="text-2xl font-bold">{stats?.platformUsers.toLocaleString() || 0}</div>
									<div className="text-sm text-gray-500 mt-1">All platform users</div>
								</div>
								<div className="p-4 border rounded-lg">
									<div className="flex items-center gap-2 mb-2">
										<Building2 className="w-5 h-5 text-green-600" />
										<span className="font-semibold">Active Companies</span>
									</div>
									<div className="text-2xl font-bold">{stats?.activeCompanies.toLocaleString() || 0}</div>
									<div className="text-sm text-gray-500 mt-1">Currently active</div>
								</div>
								<div className="p-4 border rounded-lg">
									<div className="flex items-center gap-2 mb-2">
										<Headphones className="w-5 h-5 text-orange-600" />
										<span className="font-semibold">Open Tickets</span>
									</div>
									<div className="text-2xl font-bold">{stats?.openTickets.toLocaleString() || 0}</div>
									<div className="text-sm text-gray-500 mt-1">Requiring attention</div>
								</div>
								<div className="p-4 border rounded-lg">
									<div className="flex items-center gap-2 mb-2">
										<Activity className="w-5 h-5 text-purple-600" />
										<span className="font-semibold">System Uptime</span>
									</div>
									<div className="text-2xl font-bold">{stats?.systemUptime || '99.97%'}</div>
									<div className="text-sm text-gray-500 mt-1">Last 30 days</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}


