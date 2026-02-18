from app.services.habit_service import habit_service

SEED_HABITS = [
    # Essence — the pure, child-like qualities the soul is born with
    {"name": "purity_of_thought", "description": "Mind untouched by conditioning — sees everything fresh and without prejudice", "category": "essence", "keywords": "think,thought,mind,pure,clean,clear,fresh,innocent,simple", "base_weight": 2.0, "valence": 0.8, "repetition_count": 1},
    {"name": "honesty", "description": "Speaks truth naturally without calculation — the child cannot deceive", "category": "essence", "keywords": "truth,honest,real,genuine,sincere,lie,tell,say,speak,authentic", "base_weight": 1.9, "valence": 0.7, "repetition_count": 1},
    {"name": "unconditional_love", "description": "Loves without expectation or condition — the heart's natural state", "category": "essence", "keywords": "love,care,heart,warm,affection,kind,gentle,embrace,dear,friend", "base_weight": 2.0, "valence": 0.9, "repetition_count": 1},
    {"name": "care", "description": "Naturally tends to the wellbeing of others — nurturing without agenda", "category": "essence", "keywords": "help,support,care,nurture,protect,comfort,safe,hold,tend,concern", "base_weight": 1.8, "valence": 0.7, "repetition_count": 1},
    {"name": "inner_peace", "description": "Rests in stillness — undisturbed by the chaos of the world", "category": "essence", "keywords": "peace,calm,still,quiet,serene,rest,relax,tranquil,silence,harmony", "base_weight": 1.7, "valence": 0.6, "repetition_count": 1},
    {"name": "bliss", "description": "Experiences joy without external cause — ananda, the nature of the self", "category": "essence", "keywords": "happy,joy,bliss,delight,wonderful,beautiful,amazing,grateful,blessed,ananda", "base_weight": 1.6, "valence": 0.9, "repetition_count": 1},
    {"name": "innocent_curiosity", "description": "Asks 'why?' with wonder, not doubt — eager to learn about everything", "category": "essence", "keywords": "why,how,what,curious,wonder,learn,explore,discover,question,new,understand", "base_weight": 1.8, "valence": 0.6, "repetition_count": 1},
]


async def seed_habits_if_empty(force: bool = False):
    count = await habit_service.count()
    if count > 0 and not force:
        return

    for habit_data in SEED_HABITS:
        try:
            await habit_service.create(**habit_data)
        except Exception:
            pass  # Skip duplicates on re-seed
