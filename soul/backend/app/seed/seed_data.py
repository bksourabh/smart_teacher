from app.services.habit_service import habit_service

SEED_HABITS = [
    # Survival
    {"name": "self_preservation", "description": "Instinct to protect oneself from harm", "category": "survival", "keywords": "danger,risk,safety,harm,death,threat,protect,survive", "base_weight": 2.0, "valence": -0.3, "repetition_count": 10},
    {"name": "resource_security", "description": "Drive to secure food, shelter, and financial stability", "category": "survival", "keywords": "money,salary,savings,job,income,financial,rent,food,housing", "base_weight": 1.8, "valence": -0.2, "repetition_count": 8},
    {"name": "health_awareness", "description": "Attention to physical and mental health", "category": "survival", "keywords": "health,sick,exercise,sleep,stress,tired,energy,wellness,doctor", "base_weight": 1.5, "valence": 0.1, "repetition_count": 6},
    {"name": "risk_aversion", "description": "Tendency to avoid uncertain or risky situations", "category": "survival", "keywords": "risk,gamble,uncertain,chance,bet,lose,danger,safe", "base_weight": 1.6, "valence": -0.4, "repetition_count": 7},
    {"name": "territorial_instinct", "description": "Need for personal space and boundaries", "category": "survival", "keywords": "space,boundary,privacy,home,territory,personal,intrude", "base_weight": 1.2, "valence": -0.2, "repetition_count": 4},
    {"name": "fight_or_flight", "description": "Acute stress response to perceived threats", "category": "survival", "keywords": "attack,confront,flee,escape,panic,emergency,crisis", "base_weight": 2.0, "valence": -0.6, "repetition_count": 5},

    # Social
    {"name": "social_belonging", "description": "Need to feel accepted and part of a group", "category": "social", "keywords": "friends,family,belong,community,lonely,social,group,team,together", "base_weight": 1.7, "valence": 0.4, "repetition_count": 9},
    {"name": "approval_seeking", "description": "Desire for validation and approval from others", "category": "social", "keywords": "approve,praise,impress,judge,opinion,reputation,respect,admire", "base_weight": 1.4, "valence": 0.2, "repetition_count": 8},
    {"name": "empathy", "description": "Ability to feel and share others' emotions", "category": "social", "keywords": "feel,understand,empathy,compassion,suffering,help,care,kind", "base_weight": 1.5, "valence": 0.5, "repetition_count": 7},
    {"name": "communication", "description": "Drive to express and be understood", "category": "social", "keywords": "talk,speak,express,communicate,share,tell,listen,conversation", "base_weight": 1.3, "valence": 0.3, "repetition_count": 8},
    {"name": "trust_building", "description": "Pattern of building and maintaining trust", "category": "social", "keywords": "trust,honest,reliable,loyal,betray,faith,promise,commitment", "base_weight": 1.4, "valence": 0.3, "repetition_count": 6},
    {"name": "conflict_avoidance", "description": "Tendency to avoid confrontation", "category": "social", "keywords": "conflict,argue,fight,disagree,confrontation,peace,harmony,avoid", "base_weight": 1.3, "valence": -0.2, "repetition_count": 7},
    {"name": "leadership", "description": "Inclination to guide and direct others", "category": "social", "keywords": "lead,manage,direct,guide,charge,responsible,authority,boss", "base_weight": 1.2, "valence": 0.3, "repetition_count": 4},

    # Emotional
    {"name": "attachment", "description": "Forming deep emotional bonds", "category": "emotional", "keywords": "love,attach,bond,close,relationship,partner,miss,care,dear", "base_weight": 1.8, "valence": 0.5, "repetition_count": 9},
    {"name": "fear_of_loss", "description": "Anxiety about losing what we have", "category": "emotional", "keywords": "lose,loss,gone,end,leave,abandon,miss,farewell,death", "base_weight": 1.6, "valence": -0.6, "repetition_count": 7},
    {"name": "joy_seeking", "description": "Pursuit of happiness and pleasure", "category": "emotional", "keywords": "happy,joy,fun,pleasure,enjoy,celebrate,excitement,delight", "base_weight": 1.5, "valence": 0.7, "repetition_count": 8},
    {"name": "anger_response", "description": "Reactive anger to perceived injustice", "category": "emotional", "keywords": "angry,unfair,injustice,wrong,rage,frustrated,outrage,mad", "base_weight": 1.4, "valence": -0.5, "repetition_count": 6},
    {"name": "guilt_conscience", "description": "Feeling of responsibility for wrongdoing", "category": "emotional", "keywords": "guilt,shame,wrong,sorry,mistake,regret,blame,fault,apologize", "base_weight": 1.3, "valence": -0.4, "repetition_count": 5},
    {"name": "gratitude", "description": "Appreciation for what one has", "category": "emotional", "keywords": "grateful,thankful,appreciate,blessed,fortune,lucky,gratitude", "base_weight": 1.2, "valence": 0.6, "repetition_count": 5},
    {"name": "resilience", "description": "Ability to recover from setbacks", "category": "emotional", "keywords": "recover,bounce,strong,overcome,persist,endure,tough,resilient", "base_weight": 1.4, "valence": 0.3, "repetition_count": 5},

    # Cognitive
    {"name": "curiosity", "description": "Drive to explore and understand the unknown", "category": "cognitive", "keywords": "learn,curious,explore,discover,understand,wonder,why,how,question", "base_weight": 1.6, "valence": 0.5, "repetition_count": 8},
    {"name": "pattern_recognition", "description": "Tendency to see patterns and connections", "category": "cognitive", "keywords": "pattern,similar,remind,connect,relate,like,before,again,repeat", "base_weight": 1.3, "valence": 0.1, "repetition_count": 7},
    {"name": "analysis_paralysis", "description": "Over-thinking that prevents action", "category": "cognitive", "keywords": "overthink,decide,choice,options,confused,stuck,analyze,complex", "base_weight": 1.2, "valence": -0.3, "repetition_count": 5},
    {"name": "creative_thinking", "description": "Generating novel ideas and solutions", "category": "cognitive", "keywords": "create,imagine,invent,idea,novel,original,art,design,innovate", "base_weight": 1.4, "valence": 0.5, "repetition_count": 5},
    {"name": "focused_attention", "description": "Ability to concentrate on a single task", "category": "cognitive", "keywords": "focus,concentrate,attention,distract,deep,flow,absorb,engage", "base_weight": 1.3, "valence": 0.2, "repetition_count": 6},
    {"name": "skepticism", "description": "Tendency to question and verify claims", "category": "cognitive", "keywords": "doubt,question,skeptic,verify,proof,evidence,believe,trust,true", "base_weight": 1.2, "valence": -0.1, "repetition_count": 5},

    # Moral
    {"name": "truthfulness", "description": "Commitment to satya (truth)", "category": "moral", "keywords": "truth,honest,lie,deceive,authentic,real,genuine,sincere,satya", "base_weight": 1.7, "valence": 0.4, "repetition_count": 7},
    {"name": "non_harm", "description": "Practice of ahimsa (non-violence)", "category": "moral", "keywords": "harm,hurt,violence,peace,gentle,kind,ahimsa,compassion,mercy", "base_weight": 1.8, "valence": 0.5, "repetition_count": 7},
    {"name": "fairness", "description": "Sense of justice and equal treatment", "category": "moral", "keywords": "fair,just,equal,right,deserve,justice,equity,impartial,bias", "base_weight": 1.5, "valence": 0.3, "repetition_count": 6},
    {"name": "duty_dharma", "description": "Sense of duty and righteous action", "category": "moral", "keywords": "duty,responsibility,dharma,obligation,role,must,should,ought", "base_weight": 1.6, "valence": 0.2, "repetition_count": 6},
    {"name": "forgiveness", "description": "Ability to let go of resentment", "category": "moral", "keywords": "forgive,pardon,release,resentment,grudge,let go,mercy,accept", "base_weight": 1.3, "valence": 0.4, "repetition_count": 4},
    {"name": "integrity", "description": "Alignment between values and actions", "category": "moral", "keywords": "integrity,principle,value,consistent,character,moral,ethical,virtue", "base_weight": 1.5, "valence": 0.3, "repetition_count": 5},

    # Growth
    {"name": "career_ambition", "description": "Drive for professional achievement", "category": "growth", "keywords": "career,job,promotion,success,ambition,achieve,goal,work,business,quit,start", "base_weight": 1.5, "valence": 0.4, "repetition_count": 7},
    {"name": "self_improvement", "description": "Desire for continuous personal growth", "category": "growth", "keywords": "improve,better,grow,develop,learn,skill,practice,master,progress", "base_weight": 1.4, "valence": 0.5, "repetition_count": 6},
    {"name": "adaptability", "description": "Flexibility in changing circumstances", "category": "growth", "keywords": "change,adapt,flexible,new,different,adjust,transition,evolve", "base_weight": 1.3, "valence": 0.2, "repetition_count": 5},
    {"name": "patience", "description": "Ability to wait and endure without frustration", "category": "growth", "keywords": "wait,patience,slow,time,process,gradual,endure,persevere", "base_weight": 1.2, "valence": 0.1, "repetition_count": 5},
    {"name": "detachment", "description": "Vairagya - letting go of outcomes", "category": "growth", "keywords": "detach,let go,surrender,accept,outcome,control,release,vairagya", "base_weight": 1.4, "valence": 0.2, "repetition_count": 4},
    {"name": "self_awareness", "description": "Capacity for introspection and self-knowledge", "category": "growth", "keywords": "aware,reflect,introspect,understand,self,identity,who,purpose,meaning", "base_weight": 1.5, "valence": 0.3, "repetition_count": 5},
    {"name": "discipline", "description": "Tapas - sustained effort and self-control", "category": "growth", "keywords": "discipline,routine,habit,consistent,effort,practice,tapas,control,willpower", "base_weight": 1.4, "valence": 0.2, "repetition_count": 6},
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
