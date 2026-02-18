from datetime import datetime

from sqlalchemy import String, Float, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.database import Base


class Learning(Base):
    __tablename__ = "learnings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    trigger_summary: Mapped[str] = mapped_column(Text, default="")
    question_context: Mapped[str] = mapped_column(Text, default="")
    guidance: Mapped[str] = mapped_column(Text, default="")
    application_note: Mapped[str] = mapped_column(Text, default="")
    modules_informed: Mapped[str] = mapped_column(String(100), default="all")
    keywords: Mapped[str] = mapped_column(Text, default="")
    confidence_boost: Mapped[float] = mapped_column(Float, default=0.5)
    times_applied: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
