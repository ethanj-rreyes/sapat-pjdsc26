"""
SAPAT demo: Filipino narration (voice: fil-PH-BlessicaNeural).
Run on your laptop, from the video folder:
    pip install edge-tts
    python tools/narrate_fil.py
It writes one clip per sentence to public/narration_fil/. Then tell Claude it's done.
"""
import asyncio, os
import edge_tts

VOICE = "fil-PH-BlessicaNeural"
RATE = "+6%"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "narration_fil")

LINES = [
    ('s1_hook_0', 'Kumain ka na ba?'),
    ('s1_hook_1', "Have you eaten? It's how Filipinos say, I care."),
    ('s1_hook_2', 'But for millions of families, the honest answer is: busog, pero hindi sapat.'),
    ('s1_hook_3', 'Full, but not nourished.'),
    ('s2_problem_0', 'One in four Filipino children under five is stunted, and four in ten among the poorest.'),
    ('s2_problem_1', 'The poorest tenth of families spend forty-four percent of their food budget on rice and cereals,'),
    ('s2_problem_2', "because no one can see what a healthy diet costs for their own family, at this month's prices."),
    ('s2_problem_3', 'A nutritious diet now costs about one hundred sixty-seven pesos per person a day.'),
    ('s2_problem_4', 'The official food threshold is sixty-three.'),
    ('s3_intro_0', 'So we built SAPAT: sustansya na abot-kaya. Nutrition within reach.'),
    ('s3_intro_1', "SAPAT plans the healthiest week a family's budget can buy, for each person, at local market prices."),
    ('s4_engine_0', 'It links four public datasets: PSA market prices, every month.'),
    ('s4_engine_1', 'FNRI food composition tables.'),
    ('s4_engine_2', "The Philippine Dietary Reference Intakes, for each person's needs."),
    ('s4_engine_3', 'And the Family Income and Expenditure Survey, for real spending.'),
    ('s4_engine_4', 'A linear program picks the most nutritious mix the budget can buy, following healthy food rules,'),
    ('s4_engine_5', 'and protects children under five and mothers first.'),
    ('s4_engine_6', 'It runs right in the browser, in milliseconds.'),
    ('s5a_week_0', "Here's the family app, with an example family of five in Leyte, on twelve hundred ninety pesos a week."),
    ('s5a_week_1', 'The Week tab plans every meal as real Filipino ulam, like ginisang monggo.'),
    ('s5a_week_2', "And it's honest: this budget reaches sixty-three percent of needs, against forty-six percent spent the usual way."),
    ('s5b_market_0', 'The Market tab turns the plan into one list, in the units stalls actually sell: kilos, pieces, bundles, with price ranges from PSA data.'),
    ('s5b_market_1', 'Tap the calculator on any price to see exactly how it was computed.'),
    ('s5c_today_0', "Today answers the daily question, Ano'ng ulam natin?"),
    ('s5c_today_1', 'Log meals in one tap, even when you eat out.'),
    ('s5c_today_2', 'And each week, SAPAT suggests one cheaper swap, like monggo instead of pork.'),
    ('s5d_family_0', 'And Family shows how each member is doing, from energy and growth to blood, eyes, and bones, with the cheapest food to close each gap.'),
    ('s6a_map_0', 'For local governments, the dashboard maps the cost of a healthy day in every province, every month, with Watch and Alert levels.'),
    ('s6a_map_1', 'Replaying the 2023 rice spike, it flagged eight of seventeen regions.'),
    ('s6b_feeding_0', 'Its feeding program planner builds a five-day Filipino menu.'),
    ('s6b_feeding_1', "At thirty pesos a meal, it covers about nine in ten of each child's needs."),
    ('s7_results_0', 'Does it work?'),
    ('s7_results_1', "Across every region, at the poorest ten percent's food budget, the usual way of spending meets forty-one percent of a family's needs."),
    ('s7_results_2', 'Planned with SAPAT: sixty-two percent.'),
    ('s7_results_3', 'For a three-year-old: forty-five to seventy-six.'),
    ('s7_results_4', 'Same money, better food, in all fifty-one cases.'),
    ('s8_close_0', "SAPAT doesn't ask families to spend more. It helps every peso do more."),
    ('s8_close_1', 'SAPAT. Sustansya na abot-kaya.'),
    ('s8_close_2', 'From Team SiniGANG, for PJDSC 2026.'),
]


async def main():
    os.makedirs(OUT, exist_ok=True)
    for name, text in LINES:
        path = os.path.join(OUT, name + ".mp3")
        await edge_tts.Communicate(text, VOICE, rate=RATE).save(path)
        print("ok", name)
    print("Done:", len(LINES), "clips in", os.path.abspath(OUT))

asyncio.run(main())
