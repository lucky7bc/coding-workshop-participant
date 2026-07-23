# Custom exception class for application-specific errors.
# This will be used to raise errors with specific HTTP status codes 
#and messages in the FastAPI application.
class AppError(Exception):
    # Initialize the AppError with a status code and message.
    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message
