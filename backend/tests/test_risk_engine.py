from app.models.schemas import RiskInput, Severity
from app.services.risk_engine import compute_rule_based_risk


def test_critical_peak_closure_accident_score():
    result = compute_rule_based_risk(
        RiskInput(
            cause="Accident",
            zone="Silk Board",
            junction="Silk Board Junction",
            hour=18,
            day_of_week=2,
            weekend=False,
            durationMin=120,
            requiresClosure=True,
        )
    )

    assert result.score == 100
    assert result.severity == Severity.critical
    assert any("Road closure" in factor.label for factor in result.factors)


def test_weekend_adjustment_reduces_score():
    weekday = compute_rule_based_risk(
        RiskInput(
            cause="Vehicle Breakdown",
            zone="Whitefield",
            junction="ITPL Main Gate",
            hour=11,
            day_of_week=3,
            weekend=False,
            durationMin=60,
            requiresClosure=False,
        )
    )
    weekend = compute_rule_based_risk(
        RiskInput(
            cause="Vehicle Breakdown",
            zone="Whitefield",
            junction="ITPL Main Gate",
            hour=11,
            day_of_week=6,
            weekend=True,
            durationMin=60,
            requiresClosure=False,
        )
    )

    assert weekday.score - weekend.score == 10
