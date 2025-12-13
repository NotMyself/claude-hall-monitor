# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### Preferred Method: GitHub Security Advisories

1. Go to the [Security tab](../../security/advisories) of this repository
2. Click "Report a vulnerability"
3. Provide a detailed description of the vulnerability

### Alternative: Email

If you prefer email, contact: bobby@notmyself.io

**Subject line:** `[SECURITY] Claude Code Bun Hooks Vulnerability`

**Please include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

### Do NOT

- **DO NOT** create a public GitHub issue for security vulnerabilities
- **DO NOT** disclose the vulnerability publicly before it's been addressed

## Response Timeline

| Stage | Timeline |
|-------|----------|
| Acknowledgment | Within 48 hours |
| Assessment | Within 7 days |
| Fix (Critical) | 1-7 days |
| Fix (High) | 7-30 days |
| Fix (Medium/Low) | 30-90 days |

## Security Considerations

### What This Project Does

This project implements Claude Code hooks that:
- Execute scripts when Claude Code events occur
- Read/write to local log files
- Run a local HTTP server (localhost only)
- Process JSON data from stdin

### Security Features

- **Local-only server**: Claude Hall Monitor binds to localhost (127.0.0.1) by default
- **No external network calls**: Hooks don't make outbound network requests
- **Input validation**: JSON input is validated before processing
- **No credential storage**: The project doesn't store or manage credentials
- **Fail-fast operation**: Errors are logged and execution stops safely

### Security Limitations

Users should be aware:
- Hook scripts execute with the same permissions as the user running Claude Code
- The viewer server is accessible on the local network if bound to 0.0.0.0
- Log files may contain sensitive information from Claude Code sessions

### Areas for Security Review

Security researchers are encouraged to investigate:
- Input validation in hook handlers
- Path traversal in file operations
- Command injection possibilities
- Log file content security
- Server-Sent Events (SSE) implementation

## Recognition

Security researchers who report valid vulnerabilities will be credited in our security advisories (unless anonymity is requested).

## Questions?

For non-sensitive security questions, feel free to open a GitHub Discussion.
