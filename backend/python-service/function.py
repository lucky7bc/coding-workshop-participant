# AWS Lambda entrypoint. Lambda configures the handler as `function.handler` 
# in the SAM template.
from mangum import Mangum

from app.main import app

handler = Mangum(app)

# Local testing convenience — mirrors the _examples/python-service pattern
# of a __main__ block, though for an ASGI app the real local dev loop is
# still `python -m app.main` (uvicorn), not invoking this handler directly.
if __name__ == "__main__":
    print("This is the Lambda entrypoint. For local dev, run: python -m app.main")
