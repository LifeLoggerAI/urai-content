# Research Prompt Usage Guide

## Choose the right mode

| Mode | Use when | Typical evidence target | Typical output |
|---|---|---:|---|
| Master prompt | The question is complex or the correct method is unclear | Proportional to complexity | Full audit-ready research package |
| Quick scan | Fast orientation or a current-state overview is sufficient | 8–15 strong sources | Short report, key tables, confidence rating |
| Deep literature review | Scientific, medical, policy, or technical evidence requires completeness | Broad multi-source search | Methods, PRISMA-style flow, evidence matrix, confidence by outcome |
| Market/competitive analysis | Comparing products, vendors, pricing, IP, regulation, or go-to-market | First-party and official sources first | Competitive map, comparison tables, risks, opportunities, timeline |

## Minimum inputs

Provide a topic or primary question and the decision the research should support. Audience, geography, time window, domain, citation style, source language, deliverables, and time constraint may be supplied or conservatively inferred.

## Execution

1. Copy the appropriate template from the [master prompt](./autonomous-research-agent-master-prompt.md).
2. Fill the topic, objective, and any known constraints.
3. Run the prompt in a tool-enabled model that can access current sources when recency matters.
4. Review the declared assumptions before relying on the result.
5. Confirm citations support the claims and that inaccessible sources are labeled.
6. Confirm confidence, limitations, contradictory evidence, and open questions are explicit.
7. For production use, execute the [evaluation suite](./evals/README.md).

## Quality gates

A result is not accepted when it lacks citations for major claims, omits confidence, hides source-access limitations, presents inference as fact, bypasses access controls, or fails the mode-specific deliverables.

## Release use

Use only the latest tagged release for repeatable production workflows. Record the tag, model/runtime, execution date, and evaluation report with each material research deliverable.
