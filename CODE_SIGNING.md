# Code Signing Policy

This document describes the code signing policy for AoE4 Overlay.

## Overview

AoE4 Overlay Windows binaries are digitally signed to ensure authenticity and integrity. This helps protect users from tampered or malicious versions of the software.

## Signing Process

All Windows releases are signed using a certificate provided by [SignPath Foundation](https://signpath.org).

### Build Verification

- All signed binaries are built directly from this public GitHub repository
- Builds are performed using GitHub Actions on GitHub-hosted runners
- The signing process verifies that binaries match the source code in this repository

## Team Members

| Role | GitHub Username |
|------|-----------------|
| Owner/Maintainer | [@georgepwall1991](https://github.com/georgepwall1991) |

## Signing Authority

Only the following team members are authorized to approve signing requests:

- George Wall ([@georgepwall1991](https://github.com/georgepwall1991)) - Owner

## Security Practices

- Multi-factor authentication (MFA) is required for all team members
- Only tagged releases are signed
- All commits are made through pull requests or direct pushes by authorized maintainers

## Verification

You can verify the signature of any Windows binary by:

1. Right-click the `.exe` or `.msi` file
2. Select "Properties"
3. Go to the "Digital Signatures" tab
4. The signature should show "SignPath Foundation" as the signer

## Attribution

Free code signing provided by [SignPath.io](https://signpath.io), certificate by [SignPath Foundation](https://signpath.org).

## Contact

For security concerns or questions about code signing, please [open an issue](https://github.com/georgepwall1991/AOEOverlay/issues) on GitHub.
