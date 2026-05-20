class ReleaslyError(Exception):
    pass


class AuthenticationError(ReleaslyError):
    """Integration credential rejected (401)."""


class IntegrationUnavailableError(ReleaslyError):
    """Integration source unreachable (timeout, network error)."""


class ProjectNotFoundError(ReleaslyError):
    """Project ID not found in database."""
