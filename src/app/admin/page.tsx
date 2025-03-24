import AdminAccessCheck from "@/components/AdminAccessCheck";
import AdminUserManagementWrapper from "@/components/AdminUserManagementWrapper";
import { currentUser } from "@clerk/nextjs/server";
import { Toaster } from "sonner";

export default async function AdminPage() {
	// Get the user details for displaying name
	const user = await currentUser();

	return (
		<>
			<Toaster position="top-center" />
			<AdminAccessCheck>
				<div className="p-8">
					<div className="mt-8">
						<AdminUserManagementWrapper />
					</div>
				</div>
			</AdminAccessCheck>
		</>
	);
}
