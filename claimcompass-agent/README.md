# ClaimCompass ADK Agent

ClaimCompass-specific ADK app generated with `agents-cli` version `0.2.0` and
customized for the Google Cloud Rapid Agent Hackathon MongoDB track.

The agent is intentionally scoped to the synthetic golden denial:

- payer: BCBS Texas Demo
- CPT: `90837`
- issue: missing telehealth modifier `95`
- denial codes: `CO-45` and `N179`
- action bucket: `corrected_claim`

The hosted Next.js demo API runs the full sample-PDF flow. This ADK package
provides the ClaimCompass-specific Agent Runtime target and eval surface, not a
generic weather/time scaffold.

## Project Structure

```
claimcompass-agent/
├── app/         # Core agent code
│   ├── agent.py               # Main agent logic
│   ├── agent_runtime_app.py    # Agent Runtime application logic
│   └── app_utils/             # App utilities and helpers
├── tests/                     # Unit, integration, and load tests
├── GEMINI.md                  # AI-assisted development guide
└── pyproject.toml             # Project dependencies
```

## Requirements

Before you begin, ensure you have:
- **uv**: Python package manager (used for all dependency management in this project) - [Install](https://docs.astral.sh/uv/getting-started/installation/) ([add packages](https://docs.astral.sh/uv/concepts/dependencies/) with `uv add <package>`)
- **agents-cli**: Agents CLI - Install with `uv tool install google-agents-cli`
- **Google Cloud SDK**: For GCP services - [Install](https://cloud.google.com/sdk/docs/install)


## Quick Start

Install `agents-cli` and its skills if not already installed:

```bash
uvx google-agents-cli setup
```

Install required packages:

```bash
agents-cli install
```

Test the agent with a local web server:

```bash
agents-cli playground
```

You can also use features from the [ADK](https://adk.dev/) CLI with `uv run adk`.

## Commands

| Command              | Description                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `agents-cli install` | Install dependencies using uv                                                         |
| `agents-cli playground` | Launch local development environment                                                  |
| `agents-cli lint`    | Run code quality checks                                                               |
| `uv run pytest tests/unit tests/integration` | Run unit and integration tests                                                        |
| `agents-cli deploy`  | Deploy agent to Agent Runtime                                                                |
| `agents-cli publish gemini-enterprise` | Register deployed agent to Gemini Enterprise                    |

## 🛠️ Project Management

| Command | What It Does |
|---------|--------------|
| `agents-cli scaffold enhance` | Add CI/CD pipelines and Terraform infrastructure |
| `agents-cli infra cicd` | One-command setup of entire CI/CD pipeline + infrastructure |
| `agents-cli scaffold upgrade` | Auto-upgrade to latest version while preserving customizations |

---

## Development

Edit the agent logic in `app/agent.py` and test with `agents-cli playground` -
it auto-reloads on save.

## Deployment

```bash
gcloud config set project claimcompass-497412
agents-cli deploy
```

To add CI/CD and Terraform, run `agents-cli scaffold enhance`.
To set up your production infrastructure, run `agents-cli infra cicd`.

Do not deploy Agent Runtime without explicit cost approval. Earlier deploy tests
used nonzero idle capacity, so temporary deployments should be deleted or scaled
down after proof.

## Observability

Built-in telemetry exports to Cloud Trace, BigQuery, and Cloud Logging.
