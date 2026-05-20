#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import random
from pathlib import Path


def build_cases(seed: int, count: int) -> list[dict[str, str]]:
    rng = random.Random(seed)
    tools = ["weather", "account"]
    cases = []
    for index in range(count):
        tool = rng.choice(tools)
        cases.append(
            {
                "sessionId": f"sess_generated_{index:03d}",
                "userId": f"user_generated_{index % 4}",
                "message": f"Check {tool} context for customer {rng.randint(100, 999)}.",
                "toolName": tool,
            }
        )
    return cases


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=20260519)
    parser.add_argument("--count", type=int, default=8)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(build_cases(args.seed, args.count), indent=2) + "\n")


if __name__ == "__main__":
    main()

