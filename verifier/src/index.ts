import express from "express";

const app = express();
const port = parseInt(process.env.VERIFIER_PORT || "3001");

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "verifier",
  });
});

// Start server
app.listen(port, () => {
  console.log(`Verifier service started on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down verifier...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down verifier...");
  process.exit(0);
});
