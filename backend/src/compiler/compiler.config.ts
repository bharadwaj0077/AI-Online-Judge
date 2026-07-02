import path from "path";

// Establish a dedicated folder named 'temp_submissions' right inside your project directory root
export const WORKSPACE_DIR = path.join(process.cwd(), "temp_submissions");

// Standard configuration constraints for our container micro-sandboxes
export const SANDBOX_LIMITS = {
  MEMORY: "256m",       // Maximum allowable RAM allocation per container run
  CPUS: "0.5",          // Restrict execution to half of a single hardware CPU core thread
  NETWORK: "none",      // Sever all inbound and outbound network socket connections completely
};