# Backend review notes

- Fixed authentication password handling: login no longer trims or rewrites password characters. Phone-number normalization remains separate.
- The original TypeScript build completed successfully before this change. A repeat build after the change stalled in this environment, so the final build status could not be re-confirmed.
- The source archive contained a `.env` file and generated/dependency directories. They are intentionally excluded from this cleaned archive to avoid distributing secrets and bulky generated files.
- To verify locally: `npm ci` then `npm run build`.
