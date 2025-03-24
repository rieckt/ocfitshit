import { AdminNavigation } from "@/components/admin/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminClientLayout from "./client-layout";

// Type for the minimal user data we need
type MinimalUserData = {
	id: string;
	firstName: string | null;
	lastName: string | null;
	imageUrl: string;
	email: string;
};

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await currentUser();

	if (!user) {
		redirect("/sign-in");
	}

	// Check if user is admin
	const isAdmin = user.publicMetadata.role === "admin";
	if (!isAdmin) {
		redirect("/");
	}

	// Create minimal user data for client component
	const minimalUserData = {
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.emailAddresses[0].emailAddress,
		imageUrl: user.imageUrl,
	};

	return (
		<AdminClientLayout>
			<AdminNavigation user={minimalUserData} />
			<div className="lg:pl-72">
				<div className="py-4">
					{children}
				</div>
			</div>
		</AdminClientLayout>
	);
}
