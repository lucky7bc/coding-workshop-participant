class AppError(Exception):
    """Direct analog of the Node backend's AppError: a business-logic error
    carrying its own HTTP status code, caught by a single exception handler
    (see main.py) instead of every route handling status codes itself."""

    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message
