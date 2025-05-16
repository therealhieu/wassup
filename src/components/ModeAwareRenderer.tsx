import { LocalModeContent } from "./LocalModeContent";
import { auth } from "@/auth";

export interface ModeAwareRendererProps {
	children: React.ReactNode;
}

export async function ModeAwareRenderer({ children }: ModeAwareRendererProps) {
	const session = await auth();

	if (!session) {
		return <LocalModeContent>{children}</LocalModeContent>;
	}

	return children;
}
