# REA workflow and evidence record — ThoughtSpot Spotter AI Analyst

## Investigation scope

Target: publicly described ThoughtSpot Spotter (AI Analyst), specifically asking questions in natural language and receiving analytical visual answers.

Skill examined:
\`REA_skills_Codex-main/REA-Skills/reverse-engineer-anything/SKILL.md\` in:
https://github.com/zia62381-crypto/rea_codex

The skill distinguishes runtime browser capture (\`capture_browser_scenario\`), explicit inspection of local JS bundles (\`analyze_javascript_application\`) and ordinary source analysis. **The REA MCP tools were not registered in the active ChatGPT session**, so no REA Evidence was captured. The skill's instructions cannot themselves expose a remote site's proprietary source code.

## Public facts observed

- Spotter provides a conversational interface to query data.
- Answers can be charts, tables, and descriptive explanations.
- Follow-up questions and drilldown are advertised.
- The system exposes tokens and interpretable analytical constructs.
- The production Spotter product uses governed semantic models, training, AI and related proprietary services.

Sources:

- https://www.thoughtspot.com/blog/introducing-spotter-ai-analyst
- https://docs.thoughtspot.com/cloud/26.7.0.cl/spotter-getting-started
- https://docs.thoughtspot.com/cloud/26.11.0.cl/spotter-versions
- https://www.thoughtspot.com/why-thoughtspot

## Independent implementation

- Browser-only HTML/CSS/JS with ES modules.
- Query tokenizer/rule-based intent resolver in \`src/analytics.js\`.
- Aggregation computed locally from generated sample records or user-imported CSV.
- Chart rendering via self-authored SVG; table and explanation in \`src/app.js\`.
- No official API request or unauthorized service access.
- No attempt to impersonate a logged-in ThoughtSpot user or retrieve protected code.

## Known differences

This frontend does NOT replicate ThoughtSpot's private LLM orchestration, relational search engine, SQL engine, connector library, embeddings, semantic models, security/permissions, insight ranking or authenticated Liveboards. "Why" results show observed changes, not inferred causes.

## Validation

Run \`npm test\` for analytics functions and open via \`python3 -m http.server 8000\` for interactive browser checks. Publishing code to GitHub alone is not proof of a passing runtime build.
