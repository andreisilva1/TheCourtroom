"""
Database of fallacious arguments as expanded hot takes.
Each fallacy is self-contained and can be used by any persona.
"""

FALLACIES = [
    {
        "theme": "Technology will eventually solve every problem humanity faces, from disease to aging to meaning itself. We don't need philosophy or spirituality when we have innovation.",
        "type": "faulty_causation",
        "hidden_flaw": "Technology can't solve non-technical problems like loneliness, meaning, or purpose. Often creates new problems.",
        "explanation": "Assumes technology is a cure-all when many human problems are social, philosophical, or require empathy.",
    },
    {
        "theme": "If you want to achieve excellence in anything, you must isolate yourself completely from others. Relationships and community are distractions that prevent greatness.",
        "type": "false_dichotomy",
        "hidden_flaw": "Most great achievements happen through collaboration. Isolation often breeds stagnation.",
        "explanation": "Creates a false choice when both excellence and community are mutually beneficial.",
    },
    {
        "theme": "Hard work and discipline are the only things that matter. If you're not succeeding, it's because you're not working hard enough. Luck doesn't exist; everything is earned.",
        "type": "survivorship_bias",
        "hidden_flaw": "Many hardworking people fail due to luck, timing, or systemic barriers beyond their control.",
        "explanation": "Only focuses on successful people who worked hard, ignoring millions who worked hard and failed.",
    },
    {
        "theme": "All disruption and radical change is inherently progressive. If something has been done the same way for a long time, it must be wrong and needs to be completely destroyed.",
        "type": "faulty_causation",
        "hidden_flaw": "Disruption often causes harm without guaranteed improvement. Gradual evolution is often safer.",
        "explanation": "Assumes change = progress, when many disruptive changes have made things worse.",
    },
    {
        "theme": "If you're not experiencing exponential growth in your career or business, you're essentially dead. Linear growth and stability are just polite ways of saying you're failing.",
        "type": "false_dichotomy",
        "hidden_flaw": "Sustainable, linear growth is healthy. Not everything needs to exponentially scale.",
        "explanation": "Creates false urgency by treating exponential growth as the only valid metric.",
    },
    {
        "theme": "Success is purely a result of personal merit, intelligence, and effort. If someone is successful, they earned it completely. If someone is poor, they didn't try hard enough.",
        "type": "survivorship_bias",
        "hidden_flaw": "Luck, timing, family background, and systemic factors heavily influence outcomes.",
        "explanation": "Ignores that successful people often had advantages and fortune others didn't.",
    },
    {
        "theme": "The future will be completely different from the past. History is irrelevant. All past patterns will break. Nothing from the past applies to tomorrow.",
        "type": "false_dichotomy",
        "hidden_flaw": "Human nature, physics, and many patterns persist across time.",
        "explanation": "Assumes radical discontinuity when history shows patterns repeat constantly.",
    },
    {
        "theme": "Data and metrics are always more reliable than human judgment or intuition. If you can't measure it with numbers, it doesn't matter. Feeling-based decisions are always wrong.",
        "type": "faulty_causation",
        "hidden_flaw": "Data is only as good as what's measured. Bias affects both collection and interpretation.",
        "explanation": "Assumes data eliminates bias when human bias infects every step of measurement.",
    },
    {
        "theme": "Teamwork and collective effort are always superior to individual action. The lone genius is a myth. If you're working alone, you're doing it wrong.",
        "type": "false_dichotomy",
        "hidden_flaw": "Some breakthroughs require individual risk-taking and contrarian thinking.",
        "explanation": "Assumes collaboration always wins, ignoring cases where individuals pioneered everything.",
    },
    {
        "theme": "To innovate and create the future, you must completely ignore and reject tradition and the past. Old thinking prevents new ideas. Start from zero every time.",
        "type": "false_dichotomy",
        "hidden_flaw": "Many innovations build on tradition. Ignoring the past often means repeating its mistakes.",
        "explanation": "Creates false conflict between innovation and history when they complement each other.",
    },
    {
        "theme": "What works for one person will work for everyone if they just apply it the right way. If a diet worked for someone, it works for everyone. If a schedule worked for you, it works universally.",
        "type": "hasty_generalization",
        "hidden_flaw": "Individual circumstances, genetics, environment, and timing vary enormously.",
        "explanation": "Generalizes from one success case as if it applies universally.",
    },
    {
        "theme": "You must specialize deeply and narrowly in one specific area. Generalists are amateurs. Jack of all trades, master of none. You either specialize or you fail.",
        "type": "false_dichotomy",
        "hidden_flaw": "Many innovations come from combining diverse skills. Polymaths create breakthroughs.",
        "explanation": "Assumes deep specialization is necessary when generalists often achieve more.",
    },
    {
        "theme": "More of everything is always better. More money, more stuff, more followers, more features, more options. Minimalism and constraints are just for people who can't afford more.",
        "type": "faulty_causation",
        "hidden_flaw": "Beyond a certain point, more creates complexity, inefficiency, and stress.",
        "explanation": "Assumes more = better when diminishing returns and saturation are real.",
    },
    {
        "theme": "Young people understand the world better because they haven't been corrupted by outdated ways of thinking. Age is a disadvantage. Anyone over 40 is obsolete.",
        "type": "false_dichotomy",
        "hidden_flaw": "Experience and pattern recognition from age matter. Youth brings energy AND blindness.",
        "explanation": "Creates false opposition when both youth and experience have value.",
    },
    {
        "theme": "All old ways of doing things are inferior to new ways. If something is traditional, it's automatically wrong. New is always better by definition.",
        "type": "hasty_generalization",
        "hidden_flaw": "Many traditional approaches have survived because they work. New is often just repackaged old.",
        "explanation": "Assumes novelty equals superiority without testing whether it actually does.",
    },
    {
        "theme": "Everyone should pursue their passion relentlessly, regardless of practicality. If you're not doing what you love, you're wasting your life. Passion is all you need.",
        "type": "survivorship_bias",
        "hidden_flaw": "Passion without skill, opportunity, or timing leads to poverty. Many passionate people fail.",
        "explanation": "Only highlights stories of people who got lucky following passion, ignoring failures.",
    },
    {
        "theme": "Every failure is a gift and a learning opportunity. Failed companies, failed relationships, failed projects—they all make you better. You should celebrate every failure.",
        "type": "false_dichotomy",
        "hidden_flaw": "Some failures just mean you're not suited for something. Not every failure teaches.",
        "explanation": "Assumes all failure has value when sometimes it just means stop doing that thing.",
    },
    {
        "theme": "Happiness and fulfillment come from achievement and accomplishment. If you're not constantly achieving and improving, you're wasting your life and missing out on happiness.",
        "type": "faulty_causation",
        "hidden_flaw": "Happiness comes from relationships, health, and contentment. Achievement often brings stress.",
        "explanation": "Assumes achievement causes happiness when they're often inversely related.",
    },
    {
        "theme": "Authenticity and radical honesty are always right. You should always say exactly what you think and feel, no matter the social consequences. Politeness is just dishonesty.",
        "type": "false_dichotomy",
        "hidden_flaw": "Sometimes social coordination requires tact. Filtered authenticity often works better.",
        "explanation": "Creates false conflict when diplomacy and authenticity can coexist.",
    },
    {
        "theme": "Anyone can become anything they want if they work hard enough and believe in themselves. There are no limits. Genetics, circumstances, and disability don't actually hold anyone back.",
        "type": "survivorship_bias",
        "hidden_flaw": "Genetics, circumstances, and luck place real limits on potential.",
        "explanation": "Only highlights people who succeeded, ignoring those who tried hard and hit real limits.",
    },
    {
        "theme": "Competition brings out the best in people and organizations. Friendly collaboration is weak. Only through ruthless competition can excellence emerge.",
        "type": "false_dichotomy",
        "hidden_flaw": "Competition often brings out stress, anxiety, and unethical behavior.",
        "explanation": "Assumes competition always improves when it often just creates pressure.",
    },
    {
        "theme": "The free market solves every problem perfectly. Any attempt at regulation or coordination is inefficient. Supply and demand will fix everything including inequality and health.",
        "type": "faulty_causation",
        "hidden_flaw": "Markets fail at public goods, externalities, and equity. Some problems need coordination.",
        "explanation": "Assumes market forces always lead to optimal outcomes when markets have known failures.",
    },
    {
        "theme": "Happiness requires constant novelty and growth. If you're not experiencing new things, learning new skills, and constantly changing, you're stagnating and wasting your life.",
        "type": "false_dichotomy",
        "hidden_flaw": "Contentment, routine, and stability often provide more happiness than constant change.",
        "explanation": "Creates false opposition when happiness often comes from repeating what already works.",
    },
    {
        "theme": "Your network of connections determines your destiny completely. It doesn't matter how skilled or talented you are; if you don't know the right people, you won't succeed.",
        "type": "survivorship_bias",
        "hidden_flaw": "Skill, timing, and luck matter as much as who you know.",
        "explanation": "Only shows cases where networking led to success, ignoring timing and competence.",
    },
    {
        "theme": "Self-improvement and personal development can solve systemic problems. Poverty, inequality, and injustice are just failures of individual character. Work on yourself and everything fixes.",
        "type": "faulty_causation",
        "hidden_flaw": "Individual effort can't overcome structural barriers. Some problems need policy changes.",
        "explanation": "Assumes personal development fixes everything when systemic issues require systemic solutions.",
    },
]
