ABPS DIVERSIFIED SYNTHETIC DATA PACK
Generated: 2026-09-16
Purpose: application-validation data for the Automatic Block Planning System.

Key improvements:
- Broader asset age (0-45 years) and condition/health ranges.
- Wider failure/anomaly taxonomy spanning Engineering, TRD and S&T.
- Tasks clustered across active sections so coordination pairs are learnable.
- Multiple task statuses, urgency/safety levels, isolation/possession requirements.
- Task actions now contain both verification-required and non-verification actions.
- Compatibility has a materially stronger positive signal than the previous pack.
- Dependencies link real task IDs and include multiple dependency types.
- ML predictions are aligned to task IDs and have varied model versions and explanations.
- Train movements include passenger/goods/mixed traffic and a broad delay distribution.
- Block windows include available/reserved/closed/restricted states and multiple block types.
- Resource data includes capacity, duty/maintenance states and different capabilities.
- Maintenance history includes verified completion, rework, cancellation, deferral and emergency restoration.
- Scenario catalog explicitly covers anomaly -> task -> action -> planning handling.

IMPORTANT:
This is synthetic/demo data for application validation. It is not live Indian Railways operational data and must not be treated as official production training data.
The ML target/predictions should be validated against real, point-in-time labeled failure outcomes before being promoted to production.
