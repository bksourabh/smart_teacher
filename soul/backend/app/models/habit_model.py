import math
from datetime import datetime

from sqlalchemy import String, Float, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.database import Base


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(50), index=True)
    keywords: Mapped[str] = mapped_column(Text, default="")  # comma-separated
    base_weight: Mapped[float] = mapped_column(Float, default=1.0)
    repetition_count: Mapped[int] = mapped_column(Integer, default=1)
    valence: Mapped[float] = mapped_column(Float, default=0.0)  # -1 to +1
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def effective_weight(self) -> float:
        return self.base_weight * math.log2(self.repetition_count + 1)
