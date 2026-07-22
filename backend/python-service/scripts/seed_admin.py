# One-time bootstrap: POST /api/auth/register requires an existing admin,
# so the very first admin account can't come through the API. Run this once
# against a fresh DB, then use /api/auth/login + /api/auth/register
# normally from then on.
#
# Usage:
#   python scripts/seed_admin.py admin@example.com "some-strong-password"
# or set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in .env and run with no args.
#
# Calls AuthService.register directly rather than hitting the HTTP route —
# the admin-only gate lives in the route dependency, not the service, so
# there's no circular "need an admin to create an admin" problem here.

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import connect_db  # noqa: E402
from app.core.errors import AppError  # noqa: E402
from app.services.auth_service import AuthService  # noqa: E402


async def main():
    email = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("SEED_ADMIN_EMAIL")
    password = sys.argv[2] if len(sys.argv) > 2 else os.environ.get("SEED_ADMIN_PASSWORD")

    if not email or not password:
        print("Usage: python scripts/seed_admin.py <email> <password>")
        print("  (or set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in .env)")
        sys.exit(1)

    await connect_db()

    try:
        admin = await AuthService.register(email, password, "admin")
        print(f"Admin created: {admin}")
    except AppError as err:
        # Most common case on a re-run: "Email already in use" (409) — not
        # a crash, just means seeding already happened.
        print(f"Failed to seed admin: {err.message}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
