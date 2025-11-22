"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Save, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type LevelConfig = {
	id: string;
	name: string;
	minPoints: number;
	maxPoints: number | null;
	rewards: {
		premiumFeatures: boolean;
		prioritySupport: boolean;
		exclusiveBadges: string[];
		profileHighlight: boolean;
		leaderboardRecognition: boolean;
	};
};

type LevelsConfig = {
	companyLevels: LevelConfig[];
	cleanerLevels: LevelConfig[];
};

type LevelConfigurationProps = {
	config: LevelsConfig;
	onSave: (config: LevelsConfig) => void;
	saving: boolean;
};

export function LevelConfiguration({ config, onSave, saving }: LevelConfigurationProps) {
	const [localConfig, setLocalConfig] = useState<LevelsConfig>(config);
	const [editingLevel, setEditingLevel] = useState<string | null>(null);

	const updateLevel = (
		userType: "company" | "cleaner",
		levelId: string,
		updates: Partial<LevelConfig>
	) => {
		setLocalConfig((prev) => {
			const key = userType === "company" ? "companyLevels" : "cleanerLevels";
			return {
				...prev,
				[key]: prev[key].map((level) =>
					level.id === levelId ? { ...level, ...updates } : level
				),
			};
		});
	};

	const updateReward = (
		userType: "company" | "cleaner",
		levelId: string,
		rewardKey: keyof LevelConfig["rewards"],
		value: boolean | string[]
	) => {
		setLocalConfig((prev) => {
			const key = userType === "company" ? "companyLevels" : "cleanerLevels";
			return {
				...prev,
				[key]: prev[key].map((level) =>
					level.id === levelId
						? {
								...level,
								rewards: { ...level.rewards, [rewardKey]: value },
						  }
						: level
				),
			};
		});
	};

	const addBadge = (userType: "company" | "cleaner", levelId: string, badge: string) => {
		const level = userType === "company"
			? localConfig.companyLevels.find((l) => l.id === levelId)
			: localConfig.cleanerLevels.find((l) => l.id === levelId);
		
		if (level && badge.trim()) {
			updateReward(userType, levelId, "exclusiveBadges", [
				...level.rewards.exclusiveBadges,
				badge.trim(),
			]);
		}
	};

	const removeBadge = (userType: "company" | "cleaner", levelId: string, badgeIndex: number) => {
		const level = userType === "company"
			? localConfig.companyLevels.find((l) => l.id === levelId)
			: localConfig.cleanerLevels.find((l) => l.id === levelId);
		
		if (level) {
			updateReward(userType, levelId, "exclusiveBadges", 
				level.rewards.exclusiveBadges.filter((_, i) => i !== badgeIndex)
			);
		}
	};

	const LevelCard = ({
		level,
		userType,
	}: {
		level: LevelConfig;
		userType: "company" | "cleaner";
	}) => {
		const [newBadge, setNewBadge] = useState("");

		return (
			<Card className="relative">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg">{level.name}</CardTitle>
						<Badge variant="outline" className="text-xs">
							{level.minPoints} - {level.maxPoints ?? "∞"} points
						</Badge>
					</div>
					<CardDescription>
						{level.maxPoints !== null
							? `${level.minPoints} to ${level.maxPoints} points`
							: `${level.minPoints}+ points`}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Point Thresholds */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label htmlFor={`${level.id}-min`}>Minimum Points</Label>
							<Input
								id={`${level.id}-min`}
								type="number"
								value={level.minPoints}
								onChange={(e) =>
									updateLevel(userType, level.id, {
										minPoints: parseInt(e.target.value) || 0,
									})
								}
								min="0"
							/>
						</div>
						<div>
							<Label htmlFor={`${level.id}-max`}>Maximum Points</Label>
							<Input
								id={`${level.id}-max`}
								type="number"
								value={level.maxPoints ?? ""}
								onChange={(e) =>
									updateLevel(userType, level.id, {
										maxPoints: e.target.value ? parseInt(e.target.value) : null,
									})
								}
								min="0"
								placeholder="No limit"
							/>
						</div>
					</div>

					{/* Rewards Section */}
					<div className="space-y-3 pt-4 border-t">
						<Label className="text-sm font-semibold">Level Rewards</Label>
						
						<div className="space-y-2">
							<div className="flex items-center space-x-2">
								<Checkbox
									id={`${level.id}-premium`}
									checked={level.rewards.premiumFeatures}
									onCheckedChange={(checked) =>
										updateReward(userType, level.id, "premiumFeatures", checked === true)
									}
								/>
								<Label htmlFor={`${level.id}-premium`} className="text-sm font-normal cursor-pointer">
									Premium features unlock
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id={`${level.id}-support`}
									checked={level.rewards.prioritySupport}
									onCheckedChange={(checked) =>
										updateReward(userType, level.id, "prioritySupport", checked === true)
									}
								/>
								<Label htmlFor={`${level.id}-support`} className="text-sm font-normal cursor-pointer">
									Priority support access
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id={`${level.id}-highlight`}
									checked={level.rewards.profileHighlight}
									onCheckedChange={(checked) =>
										updateReward(userType, level.id, "profileHighlight", checked === true)
									}
								/>
								<Label htmlFor={`${level.id}-highlight`} className="text-sm font-normal cursor-pointer">
									Profile highlights
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id={`${level.id}-leaderboard`}
									checked={level.rewards.leaderboardRecognition}
									onCheckedChange={(checked) =>
										updateReward(userType, level.id, "leaderboardRecognition", checked === true)
									}
								/>
								<Label htmlFor={`${level.id}-leaderboard`} className="text-sm font-normal cursor-pointer">
									Leaderboard recognition
								</Label>
							</div>
						</div>

						{/* Exclusive Badges */}
						<div className="space-y-2 pt-2">
							<Label className="text-sm font-semibold">Exclusive Badges</Label>
							<div className="flex flex-wrap gap-2">
								{level.rewards.exclusiveBadges.map((badge, idx) => (
									<Badge key={idx} variant="secondary" className="flex items-center gap-1">
										{badge}
										<button
											type="button"
											onClick={() => removeBadge(userType, level.id, idx)}
											className="ml-1 hover:text-destructive"
										>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								))}
							</div>
							<div className="flex gap-2">
								<Input
									placeholder="Add badge name"
									value={newBadge}
									onChange={(e) => setNewBadge(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											addBadge(userType, level.id, newBadge);
											setNewBadge("");
										}
									}}
									className="flex-1"
								/>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => {
										addBadge(userType, level.id, newBadge);
										setNewBadge("");
									}}
								>
									<Plus className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	};

	return (
		<div className="space-y-6">
			{/* Company Levels Section */}
			<div>
				<div className="flex items-center gap-2 mb-4">
					<Building2 className="h-5 w-5 text-slate-600" />
					<h2 className="text-xl font-semibold">Company Levels</h2>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{localConfig.companyLevels.map((level) => (
						<LevelCard key={level.id} level={level} userType="company" />
					))}
				</div>
			</div>

			{/* Cleaner Levels Section */}
			<div>
				<div className="flex items-center gap-2 mb-4">
					<User className="h-5 w-5 text-slate-600" />
					<h2 className="text-xl font-semibold">Cleaner Levels</h2>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{localConfig.cleanerLevels.map((level) => (
						<LevelCard key={level.id} level={level} userType="cleaner" />
					))}
				</div>
			</div>

			{/* Save Button */}
			<div className="flex justify-end pt-4 border-t">
				<Button onClick={() => onSave(localConfig)} disabled={saving}>
					<Save className="h-4 w-4 mr-2" />
					{saving ? "Saving..." : "Save Configuration"}
				</Button>
			</div>
		</div>
	);
}

