"""Define the state structures for the agent."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated

from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages


@dataclass
class State:
    """Defines the input state for the agent, representing a narrower interface to the outside world.

    This class is used to define the initial state and structure of incoming data.
    See: https://langchain-ai.github.io/langgraph/concepts/low_level/#state
    for more information.
    """

    messages: Annotated[list[AnyMessage], add_messages]
    title: str | None = None
    description: str | None = None
