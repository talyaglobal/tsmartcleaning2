"use client";

import React, { useState, useEffect } from "react";
import { MetricCard } from "@/components/admin/MetricCard";
import { PageHeader } from "@/components/admin/PageHeader";
import { QuickActionCard } from "@/components/admin/QuickActionCard";
import { DataTable, Column } from "@/components/admin/DataTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
	Users, 
	ClipboardCheck, 
	CheckCircle, 
	Award, 
	Calendar, 
	Clock, 
	MapPin, 
	UserPlus,
	TrendingUp,
	TrendingDown,
	Star,
	Phone,
	Mail,
	X,
	Trash2,
	RefreshCw,
	Download,
	FileText,
	AlertCircle,
	CheckCircle2
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";

type TeamMember = {
	id: string;
	name: string;
	email: string;
	phone: string;
	status: "active" | "on_leave" | "unavailable";
	rating: number;
	jobsCompleted: number;
	lastActive: string;
};

type Job = {
	id: string;
	customerName: string;
	address: string;
	service: string;
	date: string;
	time: string;
	status: "scheduled" | "in_progress" | "completed" | "cancelled";
	assignedTo?: string;
	duration: number;
	amount: number;
};

type ScheduleItem = {
	id: string;
	date: string;
	time: string;
	jobId: string;
	customerName: string;
	assignedMembers: string[];
	status: string;
};

type PerformanceMetric = {
	memberId: string;
	memberName: string;
	jobsCompleted: number;
	completionRate: number;
	averageRating: number;
	hoursWorked: number;
	onTimeRate: number;
};

export default function AmbassadorDashboard() {
	const { user } = useAuth();
	const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
	const [todayJobs, setTodayJobs] = useState<Job[]>([]);
	const [upcomingJobs, setUpcomingJobs] = useState<Job[]>([]);
	const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
	const [performance, setPerformance] = useState<PerformanceMetric[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
	const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
	const [newMemberEmail, setNewMemberEmail] = useState("");
	const [newMemberName, setNewMemberName] = useState("");
	const [newMemberPhone, setNewMemberPhone] = useState("");
	const [performancePeriod, setPerformancePeriod] = useState("30");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [autoRefresh, setAutoRefresh] = useState(false);
	const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
	const [exporting, setExporting] = useState(false);

	// Fetch all dashboard data
	useEffect(() => {
		if (user?.id) {
			fetchDashboardData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.id, selectedDate, performancePeriod]);

	// Auto-refresh functionality
	useEffect(() => {
		if (autoRefresh && user?.id) {
			const interval = setInterval(() => {
				fetchDashboardData();
			}, 30000); // Refresh every 30 seconds
			setRefreshInterval(interval);
			return () => {
				if (interval) clearInterval(interval);
			};
		} else if (refreshInterval) {
			clearInterval(refreshInterval);
			setRefreshInterval(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [autoRefresh, user?.id]);

	const fetchDashboardData = async () => {
		if (!user?.id) return;
		
		setLoading(true);
		setError(null);
		try {
			await Promise.all([
				fetchTeamMembers(),
				fetchJobs(),
				fetchPerformance(),
			]);
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
			setError("Failed to load dashboard data. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const fetchTeamMembers = async () => {
		if (!user?.id) return;
		
		try {
			const response = await fetch(`/api/ambassador/team?ambassadorId=${user.id}`);
			const data = await response.json();
			if (data.teamMembers) {
				setTeamMembers(data.teamMembers.map((m: any) => ({
					id: m.id,
					name: m.name,
					email: m.email,
					phone: m.phone || "",
					status: m.status || "active",
					rating: m.rating || 0,
					jobsCompleted: m.jobsCompleted || 0,
					lastActive: m.lastActive || "Never",
				})));
			}
		} catch (error) {
			console.error("Error fetching team members:", error);
		}
	};

	const fetchJobs = async () => {
		if (!user?.id) return;
		
		try {
			const today = new Date().toISOString().split('T')[0];
			
			// Fetch today's jobs
			const todayResponse = await fetch(`/api/ambassador/jobs?ambassadorId=${user.id}&date=${today}`);
			const todayData = await todayResponse.json();
			if (todayData.jobs) {
				setTodayJobs(todayData.jobs.map((j: any) => ({
					id: j.id,
					customerName: j.customerName,
					address: j.address,
					service: j.service,
					date: j.date,
					time: j.time,
					status: j.status === "in-progress" ? "in_progress" : j.status,
					assignedTo: j.assignedTo,
					duration: j.duration,
					amount: j.amount,
				})));
			}

			// Fetch upcoming jobs (next 7 days)
			const nextWeek = new Date();
			nextWeek.setDate(nextWeek.getDate() + 7);
			const upcomingResponse = await fetch(`/api/ambassador/jobs?ambassadorId=${user.id}&status=scheduled`);
			const upcomingData = await upcomingResponse.json();
			if (upcomingData.jobs) {
				const upcoming = upcomingData.jobs
					.filter((j: any) => j.date > today)
					.map((j: any) => ({
						id: j.id,
						customerName: j.customerName,
						address: j.address,
						service: j.service,
						date: j.date,
						time: j.time,
						status: j.status === "in-progress" ? "in_progress" : j.status,
						assignedTo: j.assignedTo,
						duration: j.duration,
						amount: j.amount,
					}));
				setUpcomingJobs(upcoming);
			}

			// Build schedule from jobs
			const allJobs = [...(todayData.jobs || []), ...(upcomingData.jobs || [])];
			const scheduleItems = allJobs
				.filter((j: any) => j.date === selectedDate)
				.map((j: any) => ({
					id: `s-${j.id}`,
					date: j.date,
					time: j.time,
					jobId: j.id,
					customerName: j.customerName,
					assignedMembers: j.assignedTo ? [j.assignedTo] : [],
					status: j.status === "in-progress" ? "in_progress" : j.status,
				}));
			setSchedule(scheduleItems);
		} catch (error) {
			console.error("Error fetching jobs:", error);
		}
	};

	const fetchPerformance = async () => {
		if (!user?.id) return;
		
		try {
			const response = await fetch(`/api/ambassador/performance?ambassadorId=${user.id}&period=${performancePeriod}`);
			const data = await response.json();
			if (data.performance) {
				setPerformance(data.performance);
			}
		} catch (error) {
			console.error("Error fetching performance:", error);
		}
	};

	const handleAssignJob = async (jobId: string, memberId: string) => {
		try {
			const response = await fetch(`/api/ambassador/jobs/${jobId}/assign`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ providerId: memberId || null }),
			});

			const data = await response.json();

			if (response.ok) {
				// Refresh jobs
				await fetchJobs();
				setSuccess("Job assigned successfully");
				setTimeout(() => setSuccess(null), 3000);
			} else {
				console.error("Failed to assign job:", data.error);
				setError(data.error || "Failed to assign job");
				setTimeout(() => setError(null), 5000);
			}
		} catch (error) {
			console.error("Error assigning job:", error);
			setError("An error occurred while assigning the job");
			setTimeout(() => setError(null), 5000);
		}
	};

	const handleUpdateJobStatus = async (jobId: string, status: Job["status"]) => {
		try {
			const response = await fetch(`/api/jobs/${jobId}/status`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status }),
			});

			const data = await response.json();

			if (response.ok) {
				await fetchJobs();
				setSuccess("Job status updated successfully");
				setTimeout(() => setSuccess(null), 3000);
			} else {
				console.error("Failed to update job status:", data.error);
				setError(data.error || "Failed to update job status");
				setTimeout(() => setError(null), 5000);
			}
		} catch (error) {
			console.error("Error updating job status:", error);
			setError("An error occurred while updating job status");
			setTimeout(() => setError(null), 5000);
		}
	};

	const handleAddTeamMember = async () => {
		if (!user?.id || !newMemberName || !newMemberEmail) {
			setError("Please fill in all required fields");
			setTimeout(() => setError(null), 3000);
			return;
		}

		try {
			const response = await fetch(`/api/ambassador/team`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ambassadorId: user.id,
					email: newMemberEmail,
					name: newMemberName,
					phone: newMemberPhone || null,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				// Refresh team members list
				await fetchTeamMembers();
				setAddMemberDialogOpen(false);
				setNewMemberEmail("");
				setNewMemberName("");
				setNewMemberPhone("");
				setSuccess("Team member added successfully!");
				setTimeout(() => setSuccess(null), 3000);
			} else {
				setError(data.error || "Failed to add team member");
				setTimeout(() => setError(null), 5000);
			}
		} catch (error) {
			console.error("Error adding team member:", error);
			setError("An error occurred while adding the team member");
			setTimeout(() => setError(null), 5000);
		}
	};

	const handleRemoveTeamMember = async (memberId: string) => {
		if (!user?.id) return;
		
		if (!confirm("Are you sure you want to remove this team member? They will no longer be able to receive job assignments.")) return;
		
		try {
			const response = await fetch(`/api/ambassador/team?memberId=${memberId}&ambassadorId=${user.id}`, {
				method: "DELETE",
			});

			const data = await response.json();

			if (response.ok) {
				// Refresh team members list
				await fetchTeamMembers();
				setSuccess("Team member removed successfully");
				setTimeout(() => setSuccess(null), 3000);
			} else {
				setError(data.error || "Failed to remove team member");
				setTimeout(() => setError(null), 5000);
			}
		} catch (error) {
			console.error("Error removing team member:", error);
			setError("An error occurred while removing the team member");
			setTimeout(() => setError(null), 5000);
		}
	};

	const handleExportData = async (format: 'csv' | 'json') => {
		if (!user?.id) return;
		
		setExporting(true);
		try {
			// Prepare data for export
			const exportData = {
				teamMembers: teamMembers.map(m => ({
					name: m.name,
					email: m.email,
					phone: m.phone,
					status: m.status,
					rating: m.rating,
					jobsCompleted: m.jobsCompleted,
					lastActive: m.lastActive,
				})),
				jobs: [...todayJobs, ...upcomingJobs].map(j => ({
					customerName: j.customerName,
					address: j.address,
					service: j.service,
					date: j.date,
					time: j.time,
					status: j.status,
					assignedTo: j.assignedTo,
					duration: j.duration,
					amount: j.amount,
				})),
				performance: performance.map(p => ({
					memberName: p.memberName,
					jobsCompleted: p.jobsCompleted,
					completionRate: p.completionRate,
					averageRating: p.averageRating,
					hoursWorked: p.hoursWorked,
					onTimeRate: p.onTimeRate,
				})),
				exportedAt: new Date().toISOString(),
			};

			if (format === 'json') {
				const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `ambassador-dashboard-${new Date().toISOString().split('T')[0]}.json`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			} else {
				// CSV export
				const csvRows: string[] = [];
				
				// Team Members CSV
				csvRows.push('Team Members');
				csvRows.push('Name,Email,Phone,Status,Rating,Jobs Completed,Last Active');
				teamMembers.forEach(m => {
					csvRows.push([
						m.name,
						m.email,
						m.phone || '',
						m.status,
						m.rating.toString(),
						m.jobsCompleted.toString(),
						m.lastActive,
					].join(','));
				});
				
				csvRows.push('');
				csvRows.push('Jobs');
				csvRows.push('Customer,Address,Service,Date,Time,Status,Assigned To,Duration,Amount');
				[...todayJobs, ...upcomingJobs].forEach(j => {
					csvRows.push([
						j.customerName,
						j.address,
						j.service,
						j.date,
						j.time,
						j.status,
						j.assignedTo || 'Unassigned',
						j.duration.toString(),
						j.amount.toString(),
					].join(','));
				});
				
				csvRows.push('');
				csvRows.push('Performance Metrics');
				csvRows.push('Member Name,Jobs Completed,Completion Rate,Average Rating,Hours Worked,On-Time Rate');
				performance.forEach(p => {
					csvRows.push([
						p.memberName,
						p.jobsCompleted.toString(),
						p.completionRate.toString(),
						p.averageRating.toString(),
						p.hoursWorked.toString(),
						p.onTimeRate.toString(),
					].join(','));
				});
				
				const csvContent = csvRows.join('\n');
				const blob = new Blob([csvContent], { type: 'text/csv' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `ambassador-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}
			
			setSuccess(`Data exported successfully as ${format.toUpperCase()}`);
			setTimeout(() => setSuccess(null), 3000);
		} catch (error) {
			console.error("Error exporting data:", error);
			setError("Failed to export data");
			setTimeout(() => setError(null), 5000);
		} finally {
			setExporting(false);
		}
	};

	const activeMembers = teamMembers.filter(m => m.status === "active").length;
	const todayJobsCount = todayJobs.length;
	const completedToday = todayJobs.filter(j => j.status === "completed").length;
	const completionRate = todayJobsCount > 0 ? Math.round((completedToday / todayJobsCount) * 100) : 0;
	const averageRating = teamMembers.length > 0 
		? (teamMembers.reduce((sum, m) => sum + m.rating, 0) / teamMembers.length).toFixed(1)
		: "0.0";

	const teamColumns: Column<TeamMember>[] = [
		{ 
			key: "name", 
			header: "Name",
			render: (row) => (
				<div>
					<div className="font-medium">{row.name}</div>
					<div className="text-xs text-slate-500">{row.email}</div>
					{row.phone && (
						<div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
							<Phone className="w-3 h-3" />
							{row.phone}
						</div>
					)}
				</div>
			)
		},
		{ 
			key: "status", 
			header: "Status",
			render: (row) => (
				<Badge variant={row.status === "active" ? "default" : "outline"}>
					{row.status.replace("_", " ")}
				</Badge>
			)
		},
		{ 
			key: "rating", 
			header: "Rating",
			render: (row) => (
				<div className="flex items-center gap-1">
					<Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
					<span>{row.rating > 0 ? row.rating.toFixed(1) : "N/A"}</span>
				</div>
			)
		},
		{ 
			key: "jobsCompleted", 
			header: "Jobs Completed" 
		},
		{ 
			key: "lastActive", 
			header: "Last Active" 
		},
		{
			key: "actions",
			header: "Actions",
			render: (row) => (
				<div className="flex gap-2">
					<Button 
						variant="outline" 
						size="sm" 
						onClick={() => handleRemoveTeamMember(row.id)}
						className="text-red-600 hover:text-red-700"
					>
						<Trash2 className="w-4 h-4" />
					</Button>
				</div>
			)
		}
	];

	const jobColumns: Column<Job>[] = [
		{ 
			key: "customerName", 
			header: "Customer",
			render: (row) => (
				<div>
					<div className="font-medium">{row.customerName}</div>
					<div className="text-xs text-slate-500 flex items-center gap-1">
						<MapPin className="w-3 h-3" />
						{row.address}
					</div>
				</div>
			)
		},
		{ 
			key: "service", 
			header: "Service" 
		},
		{ 
			key: "time", 
			header: "Time",
			render: (row) => (
				<div>
					<div className="font-medium">{row.time}</div>
					<div className="text-xs text-slate-500">{new Date(row.date).toLocaleDateString()}</div>
				</div>
			)
		},
		{ 
			key: "assignedTo", 
			header: "Assigned To",
			render: (row) => {
				if (!row.assignedTo) {
					return (
						<Select onValueChange={(value) => handleAssignJob(row.id, value)}>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Assign..." />
							</SelectTrigger>
							<SelectContent>
								{teamMembers.filter(m => m.status === "active").map(member => (
									<SelectItem key={member.id} value={member.id}>
										{member.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					);
				}
				const member = teamMembers.find(m => m.id === row.assignedTo);
				return member ? (
					<div className="flex items-center gap-2">
						<span>{member.name}</span>
						<Button 
							variant="ghost" 
							size="sm" 
							onClick={() => handleAssignJob(row.id, "")}
							className="h-6 px-2 text-xs"
						>
							Change
						</Button>
					</div>
				) : (
					<Select onValueChange={(value) => handleAssignJob(row.id, value)}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Unassigned" />
						</SelectTrigger>
						<SelectContent>
							{teamMembers.filter(m => m.status === "active").map(member => (
								<SelectItem key={member.id} value={member.id}>
									{member.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				);
			}
		},
		{ 
			key: "status", 
			header: "Status",
			render: (row) => {
				const statusColors: Record<string, string> = {
					scheduled: "bg-blue-100 text-blue-700",
					in_progress: "bg-yellow-100 text-yellow-700",
					completed: "bg-green-100 text-green-700",
					cancelled: "bg-red-100 text-red-700",
				};
				return (
					<Badge className={statusColors[row.status] || ""}>
						{row.status.replace("_", " ")}
					</Badge>
				);
			}
		},
		{
			key: "actions",
			header: "Actions",
			render: (row) => (
				<div className="flex gap-2">
					{row.status === "scheduled" && (
						<Button 
							variant="outline" 
							size="sm" 
							onClick={() => handleUpdateJobStatus(row.id, "in_progress")}
						>
							Start
						</Button>
					)}
					{row.status === "in_progress" && (
						<Button 
							variant="default" 
							size="sm" 
							onClick={() => handleUpdateJobStatus(row.id, "completed")}
						>
							Complete
						</Button>
					)}
				</div>
			)
		}
	];

	const performanceColumns: Column<PerformanceMetric>[] = [
		{ key: "memberName", header: "Team Member" },
		{ key: "jobsCompleted", header: "Jobs Completed" },
		{ 
			key: "completionRate", 
			header: "Completion Rate",
			render: (row) => (
				<div className="flex items-center gap-2">
					<span>{row.completionRate}%</span>
					{row.completionRate >= 95 ? (
						<TrendingUp className="w-4 h-4 text-green-500" />
					) : (
						<TrendingDown className="w-4 h-4 text-red-500" />
					)}
				</div>
			)
		},
		{ 
			key: "averageRating", 
			header: "Avg Rating",
			render: (row) => (
				<div className="flex items-center gap-1">
					<Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
					<span>{row.averageRating}</span>
				</div>
			)
		},
		{ key: "hoursWorked", header: "Hours Worked" },
		{ 
			key: "onTimeRate", 
			header: "On-Time Rate",
			render: (row) => `${row.onTimeRate}%`
		}
	];

	return (
		<div className="space-y-6">
			<PageHeader 
				title="Ambassador Dashboard" 
				subtitle="Manage your team, assign jobs, and track performance" 
			/>
			
			{/* Error and Success Messages */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			{success && (
				<Alert className="bg-green-50 border-green-200">
					<CheckCircle2 className="h-4 w-4 text-green-600" />
					<AlertDescription className="text-green-800">{success}</AlertDescription>
				</Alert>
			)}
			
			{/* Metrics */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<MetricCard 
					title="Team Members" 
					value={activeMembers} 
					subtitle={`${teamMembers.length} total`}
					icon={<Users className="w-6 h-6" />} 
				/>
				<MetricCard 
					title="Today's Jobs" 
					value={todayJobsCount} 
					icon={<ClipboardCheck className="w-6 h-6" />} 
				/>
				<MetricCard 
					title="Completion Rate" 
					value={`${completionRate}%`} 
					change={{ value: 1.3, positive: true }} 
					icon={<CheckCircle className="w-6 h-6" />} 
				/>
				<MetricCard 
					title="Team Rating" 
					value={averageRating} 
					subtitle="Out of 5" 
					icon={<Award className="w-6 h-6" />} 
				/>
			</div>

			{/* Quick Actions */}
			<div className="flex items-center justify-between flex-wrap gap-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
					<QuickActionCard title="Assign Job" href="/ambassador/jobs/today" icon={<ClipboardCheck className="w-5 h-5" />} />
					<QuickActionCard title="View Schedule" href="/ambassador/schedule" icon={<Calendar className="w-5 h-5" />} />
					<QuickActionCard title="Team Performance" href="/ambassador/performance" icon={<Award className="w-5 h-5" />} />
					<QuickActionCard title="Message Team" href="/ambassador/messages" icon={<Mail className="w-5 h-5" />} />
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setAutoRefresh(!autoRefresh)}
						className={autoRefresh ? "bg-blue-50" : ""}
					>
						<RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
						{autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => fetchDashboardData()}
						disabled={loading}
					>
						<RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
						Refresh
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleExportData('csv')}
						disabled={exporting}
					>
						<Download className="w-4 h-4 mr-2" />
						Export CSV
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleExportData('json')}
						disabled={exporting}
					>
						<FileText className="w-4 h-4 mr-2" />
						Export JSON
					</Button>
				</div>
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
				{/* Team Management */}
				<Card>
					<CardHeader>
						<CardTitle>Team Management</CardTitle>
						<CardDescription>View and manage your team members</CardDescription>
					</CardHeader>
					<CardContent>
						<DataTable
							columns={teamColumns}
							data={teamMembers}
							getRowKey={(row) => row.id}
							loading={loading}
							density="compact"
							emptyState="No team members found"
						/>
						<div className="mt-4">
							<Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
								<DialogTrigger asChild>
									<Button variant="outline" className="w-full">
										<UserPlus className="w-4 h-4 mr-2" />
										Add Team Member
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Add Team Member</DialogTitle>
										<DialogDescription>
											Add a new cleaner to your team. They will receive an invitation to join.
										</DialogDescription>
									</DialogHeader>
									<div className="space-y-4 py-4">
										<div className="space-y-2">
											<Label htmlFor="member-name">Full Name</Label>
											<Input
												id="member-name"
												placeholder="John Doe"
												value={newMemberName}
												onChange={(e) => setNewMemberName(e.target.value)}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="member-email">Email</Label>
											<Input
												id="member-email"
												type="email"
												placeholder="john@example.com"
												value={newMemberEmail}
												onChange={(e) => setNewMemberEmail(e.target.value)}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="member-phone">Phone (Optional)</Label>
											<Input
												id="member-phone"
												type="tel"
												placeholder="+1-555-0100"
												value={newMemberPhone}
												onChange={(e) => setNewMemberPhone(e.target.value)}
											/>
										</div>
									</div>
									<DialogFooter>
										<Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
											Cancel
										</Button>
										<Button onClick={handleAddTeamMember} disabled={!newMemberName || !newMemberEmail}>
											Add Member
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</CardContent>
				</Card>

				{/* Job Assignment */}
				<Card>
					<CardHeader>
						<CardTitle>Today's Jobs</CardTitle>
						<CardDescription>Assign and manage today's cleaning jobs</CardDescription>
					</CardHeader>
					<CardContent>
						<DataTable
							columns={jobColumns}
							data={todayJobs}
							getRowKey={(row) => row.id}
							loading={loading}
							density="compact"
							emptyState="No jobs scheduled for today"
						/>
					</CardContent>
				</Card>
			</div>

			{/* Schedule Management */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Schedule Management</CardTitle>
							<CardDescription>View and manage upcoming jobs</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<input
								type="date"
								value={selectedDate}
								onChange={(e) => setSelectedDate(e.target.value)}
								className="px-3 py-2 border rounded-md text-sm"
							/>
							<Button 
								variant="outline" 
								size="sm"
								onClick={() => fetchJobs()}
							>
								<RefreshCw className="w-4 h-4 mr-2" />
								Refresh
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="text-center py-8 text-slate-500">Loading schedule...</div>
					) : schedule.length === 0 ? (
						<div className="text-center py-8 text-slate-500">
							<Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
							<p>No jobs scheduled for this date</p>
						</div>
					) : (
						<div className="space-y-4">
							{schedule.map((item) => {
								const job = todayJobs.find(j => j.id === item.jobId) || upcomingJobs.find(j => j.id === item.jobId);
								if (!job) return null;
								return (
									<div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
										<div className="flex-1">
											<div className="flex items-center gap-3">
												<Clock className="w-4 h-4 text-slate-500" />
												<span className="font-medium">{item.time}</span>
												<Badge variant={item.status === "in_progress" ? "default" : "outline"}>
													{item.status.replace("_", " ")}
												</Badge>
											</div>
											<div className="mt-2">
												<div className="font-medium">{item.customerName}</div>
												<div className="text-sm text-slate-500">{job.service} • {job.duration}h • ${job.amount}</div>
											</div>
											<div className="mt-2 flex items-center gap-2">
												<Users className="w-4 h-4 text-slate-500" />
												<span className="text-sm text-slate-600">
													{item.assignedMembers.length > 0
														? item.assignedMembers.map(id => {
																const member = teamMembers.find(m => m.id === id);
																return member?.name;
															}).join(", ")
														: "Unassigned"}
												</span>
											</div>
										</div>
										<div className="flex gap-2">
											{!job.assignedTo ? (
												<Select onValueChange={(value) => handleAssignJob(job.id, value)}>
													<SelectTrigger className="w-40">
														<SelectValue placeholder="Assign..." />
													</SelectTrigger>
													<SelectContent>
														{teamMembers.filter(m => m.status === "active").map(member => (
															<SelectItem key={member.id} value={member.id}>
																{member.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											) : (
												<Button 
													variant="outline" 
													size="sm" 
													onClick={() => handleAssignJob(job.id, "")}
												>
													Reassign
												</Button>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Team Performance Metrics */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Team Performance Metrics</CardTitle>
							<CardDescription>Track individual and team performance</CardDescription>
						</div>
						<Select value={performancePeriod} onValueChange={(value) => {
							setPerformancePeriod(value);
							fetchPerformance();
						}}>
							<SelectTrigger className="w-32">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="7">Last 7 days</SelectItem>
								<SelectItem value="30">Last 30 days</SelectItem>
								<SelectItem value="90">Last 90 days</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="table" className="w-full">
						<TabsList>
							<TabsTrigger value="table">Table View</TabsTrigger>
							<TabsTrigger value="charts">Charts</TabsTrigger>
						</TabsList>
						<TabsContent value="table" className="mt-4">
							<DataTable
								columns={performanceColumns}
								data={performance}
								getRowKey={(row) => row.memberId}
								loading={loading}
								density="comfortable"
								emptyState="No performance data available"
							/>
						</TabsContent>
						<TabsContent value="charts" className="mt-4">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{/* Jobs Completed Chart */}
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Jobs Completed</CardTitle>
									</CardHeader>
									<CardContent>
										{performance.length > 0 ? (
											<ResponsiveContainer width="100%" height={300}>
												<BarChart data={performance}>
													<CartesianGrid strokeDasharray="3 3" />
													<XAxis dataKey="memberName" angle={-45} textAnchor="end" height={100} />
													<YAxis />
													<Tooltip />
													<Bar dataKey="jobsCompleted" fill="#3b82f6" />
												</BarChart>
											</ResponsiveContainer>
										) : (
											<div className="flex items-center justify-center h-[300px] text-slate-500">
												No performance data available
											</div>
										)}
									</CardContent>
								</Card>
								
								{/* Completion Rate Chart */}
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Completion Rate</CardTitle>
									</CardHeader>
									<CardContent>
										{performance.length > 0 ? (
											<ResponsiveContainer width="100%" height={300}>
												<BarChart data={performance}>
													<CartesianGrid strokeDasharray="3 3" />
													<XAxis dataKey="memberName" angle={-45} textAnchor="end" height={100} />
													<YAxis domain={[0, 100]} />
													<Tooltip />
													<Bar dataKey="completionRate" fill="#10b981" />
												</BarChart>
											</ResponsiveContainer>
										) : (
											<div className="flex items-center justify-center h-[300px] text-slate-500">
												No performance data available
											</div>
										)}
									</CardContent>
								</Card>

								{/* Average Rating Chart */}
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Average Rating</CardTitle>
									</CardHeader>
									<CardContent>
										{performance.length > 0 ? (
											<ResponsiveContainer width="100%" height={300}>
												<BarChart data={performance}>
													<CartesianGrid strokeDasharray="3 3" />
													<XAxis dataKey="memberName" angle={-45} textAnchor="end" height={100} />
													<YAxis domain={[0, 5]} />
													<Tooltip />
													<Bar dataKey="averageRating" fill="#f59e0b" />
												</BarChart>
											</ResponsiveContainer>
										) : (
											<div className="flex items-center justify-center h-[300px] text-slate-500">
												No performance data available
											</div>
										)}
									</CardContent>
								</Card>

								{/* Hours Worked Chart */}
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Hours Worked</CardTitle>
									</CardHeader>
									<CardContent>
										{performance.length > 0 ? (
											<ResponsiveContainer width="100%" height={300}>
												<BarChart data={performance}>
													<CartesianGrid strokeDasharray="3 3" />
													<XAxis dataKey="memberName" angle={-45} textAnchor="end" height={100} />
													<YAxis />
													<Tooltip />
													<Bar dataKey="hoursWorked" fill="#8b5cf6" />
												</BarChart>
											</ResponsiveContainer>
										) : (
											<div className="flex items-center justify-center h-[300px] text-slate-500">
												No performance data available
											</div>
										)}
									</CardContent>
								</Card>
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}

