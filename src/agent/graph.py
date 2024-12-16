"""Define a simple chatbot agent.

This agent returns a predefined response without using an actual LLM.
"""

from typing import Any

from langchain.chat_models import init_chat_model
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph
from langgraph.types import Command
from pydantic import BaseModel

from agent.configuration import Configuration
from agent.state import State

model = init_chat_model()


async def chatbot(state: State, config: RunnableConfig) -> Command:
    """Each node does work."""
    configuration = Configuration.from_runnable_config(config)
    response = await model.ainvoke(
        state.messages,
        {
            "configurable": {
                **(config.get("configurable") or {}),
                "model": configuration.model,
            }
        },
    )
    route = "generate_title" if len(state.messages) <= 1 else []

    return Command(update={"messages": response}, goto=route)


class Title(BaseModel):
    """Generate a concise, fitting title for this conversation."""

    title: str
    description: str


async def generate_title(state: State, config: RunnableConfig) -> dict[str, Any]:
    """Generate a concise, fitting title for this conversation."""
    configuration = Configuration.from_runnable_config(config)
    response = await model.with_structured_output(Title).ainvoke(
        [
            {
                "role": "system",
                "content": "Generate a disting, concise, fitting title for this conversation.",
            },
            *state.messages[:-1],
        ],
        {
            "configurable": {
                **(config.get("configurable") or {}),
                "model": configuration.model,
            }
        },
    )
    return {"title": response.title, "description": response.description}


# Define a new graph
builder = (
    StateGraph(State, config_schema=Configuration)
    .add_node(chatbot)
    .add_node(generate_title)
    .add_edge("__start__", "chatbot")
)
graph = builder.compile()
graph.name = "My Chatbot"  # This defines the custom name in LangSmith
