from pydantic import BaseModel


class RequestCounter(BaseModel):
    request_id: int


class ResponeCounter(RequestCounter):
    last_counter: int


