// Local-only dev server. Vercel never runs this file — it calls api/index.js
// directly as a serverless function. This file exists purely so you can still
// run `npm run dev:local` and hit http://localhost:4000 while developing,
// exactly like before, without duplicating any route/middleware logic.
import app from "./api/index.js";

const PORT = process.env.PORT || process.env.BACKEND_PORT || 4000;
app.listen(PORT, () => console.log(`SAHAY backend (local dev) listening on :${PORT}`));
