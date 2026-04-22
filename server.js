app.get("/", (_req, res) => {
  res.send("OK");
});

app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});
