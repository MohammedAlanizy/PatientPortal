from enum import Enum

class Role(str, Enum):
    ADMIN = "admin"
    VERIFIER = "verifier"
    INSERTER = "inserter"
