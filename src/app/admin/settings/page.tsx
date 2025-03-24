import AdminAccessCheck from "@/components/AdminAccessCheck";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
	return (
		<AdminAccessCheck>
			<div className="space-y-6 p-6 lg:px-8">
				<div className="flex items-center gap-2">
					<Settings className="h-8 w-8 text-primary" />
					<div>
						<h1 className="text-2xl font-semibold">Admin Settings</h1>
						<p className="text-sm text-muted-foreground">
							Configure system-wide settings and preferences
						</p>
					</div>
				</div>

				<div className="grid gap-6">
					{/* General Settings */}
					<Card>
						<CardHeader>
							<CardTitle>General Settings</CardTitle>
							<CardDescription>
								Basic configuration for the fitness competition platform
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="siteName">Platform Name</Label>
								<Input
									id="siteName"
									defaultValue="OCFitShit"
									className="max-w-md"
								/>
								<p className="text-sm text-muted-foreground">
									The name displayed throughout the platform
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="timezone">Default Timezone</Label>
								<Select defaultValue="UTC">
									<SelectTrigger className="max-w-md">
										<SelectValue placeholder="Select timezone" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="UTC">UTC</SelectItem>
										<SelectItem value="EST">Eastern Time</SelectItem>
										<SelectItem value="PST">Pacific Time</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-sm text-muted-foreground">
									System-wide timezone for dates and times
								</p>
							</div>
							<div className="flex items-center justify-between rounded-lg border p-4">
								<div className="space-y-0.5">
									<Label>Maintenance Mode</Label>
									<p className="text-sm text-muted-foreground">
										Temporarily disable access to the platform
									</p>
								</div>
								<Switch />
							</div>
						</CardContent>
					</Card>

					{/* Competition Settings */}
					<Card>
						<CardHeader>
							<CardTitle>Competition Settings</CardTitle>
							<CardDescription>
								Configure default settings for competitions and challenges
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="defaultPoints">Default Points per Exercise</Label>
								<Input
									id="defaultPoints"
									type="number"
									defaultValue="10"
									className="max-w-md"
								/>
								<p className="text-sm text-muted-foreground">
									Base points awarded for completing exercises
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="minTeamSize">Minimum Team Size</Label>
								<Input
									id="minTeamSize"
									type="number"
									defaultValue="2"
									className="max-w-md"
								/>
								<p className="text-sm text-muted-foreground">
									Minimum number of members required per team
								</p>
							</div>
							<div className="flex items-center justify-between rounded-lg border p-4">
								<div className="space-y-0.5">
									<Label>Allow Team Challenges</Label>
									<p className="text-sm text-muted-foreground">
										Enable team-based competition features
									</p>
								</div>
								<Switch defaultChecked />
							</div>
						</CardContent>
					</Card>

					{/* Notification Settings */}
					<Card>
						<CardHeader>
							<CardTitle>Notification Settings</CardTitle>
							<CardDescription>
								Configure system notifications and alerts
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex items-center justify-between rounded-lg border p-4">
								<div className="space-y-0.5">
									<Label>Email Notifications</Label>
									<p className="text-sm text-muted-foreground">
										Send email notifications for important events
									</p>
								</div>
								<Switch defaultChecked />
							</div>
							<div className="flex items-center justify-between rounded-lg border p-4">
								<div className="space-y-0.5">
									<Label>Challenge Reminders</Label>
									<p className="text-sm text-muted-foreground">
										Send reminders for upcoming and ongoing challenges
									</p>
								</div>
								<Switch defaultChecked />
							</div>
							<div className="flex items-center justify-between rounded-lg border p-4">
								<div className="space-y-0.5">
									<Label>Achievement Notifications</Label>
									<p className="text-sm text-muted-foreground">
										Notify users when they earn achievements or level up
									</p>
								</div>
								<Switch defaultChecked />
							</div>
						</CardContent>
					</Card>

					{/* Advanced Settings */}
					<Card>
						<CardHeader>
							<CardTitle>Advanced Settings</CardTitle>
							<CardDescription>
								Configure technical and system settings
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="apiKey">API Key</Label>
								<div className="flex max-w-md gap-2">
									<Input
										id="apiKey"
										type="password"
										value="************************"
										readOnly
									/>
									<Button variant="outline">Regenerate</Button>
								</div>
								<p className="text-sm text-muted-foreground">
									API key for external integrations
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="logLevel">Log Level</Label>
								<Select defaultValue="info">
									<SelectTrigger className="max-w-md">
										<SelectValue placeholder="Select log level" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="error">Error</SelectItem>
										<SelectItem value="warn">Warning</SelectItem>
										<SelectItem value="info">Info</SelectItem>
										<SelectItem value="debug">Debug</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-sm text-muted-foreground">
									System logging verbosity level
								</p>
							</div>
							<div className="flex items-center justify-between rounded-lg border p-4">
								<div className="space-y-0.5">
									<Label>Debug Mode</Label>
									<p className="text-sm text-muted-foreground">
										Enable detailed error messages and logging
									</p>
								</div>
								<Switch />
							</div>
						</CardContent>
					</Card>

					<div className="flex justify-end gap-4">
						<Button variant="outline">Reset to Defaults</Button>
						<Button>Save Changes</Button>
					</div>
				</div>
			</div>
		</AdminAccessCheck>
	);
}
