"""
config_parser.py - Parse uploaded cloud configuration files (JSON / YAML / TXT).
"""

import json
import logging

import yaml

logger = logging.getLogger(__name__)


def parse_config(content: str, filename: str = "") -> dict:
    """
    Try to parse content as JSON then YAML.
    Returns a dict or raises ValueError.
    """
    # Try JSON first
    try:
        data = json.loads(content)
        if isinstance(data, dict):
            logger.info("Parsed as JSON")
            return data
    except (json.JSONDecodeError, ValueError):
        pass

    # Try YAML
    try:
        data = yaml.safe_load(content)
        if isinstance(data, dict):
            logger.info("Parsed as YAML")
            return data
    except yaml.YAMLError:
        pass

    raise ValueError(
        "Could not parse configuration. Please provide valid JSON or YAML."
    )
