# MCP Docker Networking

The Playwright MCP server runs inside a Docker container. When navigating to services running on the Windows host machine:

- Use `host.docker.internal` instead of `localhost`
- Example: `http://host.docker.internal:3456` not `http://localhost:3456`

This applies to all browser navigation targeting local development servers.
