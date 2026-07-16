import { createFileRoute, Outlet } from "@tanstack/react-router";
import { OrgSettingsLayout } from "#/components/organizations/org-settings-layout";

export const Route = createFileRoute("/$org/settings")({
	component: SettingsLayout,
});

function SettingsLayout() {
	return (
		<OrgSettingsLayout>
			<Outlet />
		</OrgSettingsLayout>
	);
}
