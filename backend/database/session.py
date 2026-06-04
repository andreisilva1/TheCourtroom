import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlmodel import SQLModel

_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./argumentai.db")

engine = create_async_engine(
    _DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in _DATABASE_URL else {},
)

_SessionFactory = async_sessionmaker(engine, expire_on_commit=False)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session():
    async with _SessionFactory() as session:
        yield session
