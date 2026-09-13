#!/usr/bin/env python
import os
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(APP_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")


def main():
    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
