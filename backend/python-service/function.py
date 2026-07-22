# AWS Lambda entrypoint. Per the workshop's Lambda config (lambda.tf), the
# expected handler is "function.handler" — a bare Lambda handler, not an
# ASGI server. Mangum bridges that gap: it adapts our existing FastAPI app
# (unchanged) to the Lambda Function URL event format this project's
# infrastructure uses (`create_lambda_function_url = true` in lambda.tf).
#
# Verified before writing this: Mangum explicitly lists "Function URL" as a
# supported event source (not just API Gateway), and its FastAPI
# integration is exactly this — no framework changes needed elsewhere in
# app/.
from mangum import Mangum

from app.main import app

handler = Mangum(app)

# Local testing convenience — mirrors the _examples/python-service pattern
# of a __main__ block, though for an ASGI app the real local dev loop is
# still `python -m app.main` (uvicorn), not invoking this handler directly.
if __name__ == "__main__":
    print("This is the Lambda entrypoint. For local dev, run: python -m app.main")
