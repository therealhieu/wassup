import chokidar from "chokidar";
import { spawn } from "child_process";
import { Logger } from "tslog";

const log = new Logger();

let devProcess: ReturnType<typeof spawn> | null = null;

function startDev() {
	if (devProcess) {
		log.info("Restarting dev server...");
		devProcess.kill();
	}

	devProcess = spawn("bun", ["run", "dev"], {
		stdio: "inherit",
		shell: true,
	});

	devProcess.on("error", (error) => {
		log.error("Failed to start dev server:", error);
	});
}

// Start the dev server initially
startDev();

// Watch the config file
chokidar
	.watch("configs/wassup.yml", {
		persistent: true,
		ignoreInitial: true,
	})
	.on("change", (path) => {
		log.info(`Config file changed: ${path}`);
		startDev();
	});

// Handle process termination
process.on("SIGINT", () => {
	if (devProcess) {
		devProcess.kill();
	}
	process.exit();
});
