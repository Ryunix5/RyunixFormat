import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const Route = createRootRoute({
	component: Root,
});

function Root() {
	return (
		<div className="flex flex-col min-h-screen bg-transparent">
			<ErrorBoundary tagName="main" className="flex-1 bg-transparent">
				<Outlet />
			</ErrorBoundary>
		</div>
	);
}
