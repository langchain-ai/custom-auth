import pytest
from agent import graph
from langsmith import unit


@pytest.mark.asyncio
@unit
async def test_agent_simple_passthrough() -> None:
    res = await graph.ainvoke({"changeme": "some_val"})
    assert res is not None
