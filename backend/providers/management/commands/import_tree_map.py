from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any

from django.core.management.base import BaseCommand, CommandParser


TEXT_FIELDS = {
    "species_common",
    "species_scientific",
    "medical_specialty",
    "provider_type",
    "popularity_badge",
    "searchable_conditions",
    "care_philosophy",
    "patient_review_summary",
    "primary_care_services",
    "signature_prescription",
    "waiting_room_feature",
    "leaf_paperwork_level",
    "branch_office_status",
    "clinic_name",
    "clinic_address",
    "clinic_zipcode",
    "clinic_city",
    "clinic_neighborhood",
}

NUMERIC_TYPES = {
    "lng": "REAL NOT NULL",
    "lat": "REAL NOT NULL",
    "provider_id": "INTEGER PRIMARY KEY",
    "years_of_practice": "INTEGER NOT NULL",
    "care_rating": "REAL NOT NULL",
    "review_count": "INTEGER NOT NULL",
    "star_doctor": "INTEGER NOT NULL",
    "next_available_visit_days": "INTEGER NOT NULL",
    "weekend_availability": "INTEGER NOT NULL",
    "care_accessibility_score": "INTEGER NOT NULL",
    "shade_side_manner_score": "REAL NOT NULL",
}


class Command(BaseCommand):
    help = "Build the compact SQLite provider index from trees_map.json."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("source", type=Path, help="Path to trees_map.json")
        parser.add_argument(
            "--output",
            type=Path,
            default=Path("backend/data/provider_index.sqlite"),
            help="SQLite database output path",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        source: Path = options["source"]
        output: Path = options["output"]
        payload = json.loads(source.read_text())
        fields: list[str] = payload["metadata"]["fields"]
        dicts: dict[str, list[str]] = payload["dicts"]
        rows: list[list[Any]] = payload["rows"]

        unsupported_fields = [field for field in fields if field not in TEXT_FIELDS and field not in NUMERIC_TYPES]
        if unsupported_fields:
            raise ValueError(f"Unsupported fields in source: {', '.join(unsupported_fields)}")

        output.parent.mkdir(parents=True, exist_ok=True)
        if output.exists():
            output.unlink()

        connection = sqlite3.connect(output)
        try:
            connection.execute("PRAGMA journal_mode = OFF")
            connection.execute("PRAGMA synchronous = OFF")
            self.create_schema(connection, fields)
            self.insert_dictionaries(connection, dicts)
            self.insert_providers(connection, fields, rows)
            self.insert_conditions(connection, fields, rows, dicts)
            connection.executescript(
                """
                PRAGMA optimize;
                VACUUM;
                """
            )
            connection.commit()
        finally:
            connection.close()

        size_mb = output.stat().st_size / 1024 / 1024
        self.stdout.write(self.style.SUCCESS(f"Imported {len(rows):,} providers into {output} ({size_mb:.1f} MB)."))

    @staticmethod
    def create_schema(connection: sqlite3.Connection, fields: list[str]) -> None:
        columns = []
        for field in fields:
            if field in NUMERIC_TYPES:
                columns.append(f"{field} {NUMERIC_TYPES[field]}")
            else:
                columns.append(f"{field}_id INTEGER NOT NULL")

        connection.execute(f"CREATE TABLE providers ({', '.join(columns)})")
        connection.execute(
            """
            CREATE TABLE dictionary_entries (
                field TEXT NOT NULL,
                value_id INTEGER NOT NULL,
                value TEXT NOT NULL,
                PRIMARY KEY (field, value_id)
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE provider_conditions (
                provider_id INTEGER NOT NULL,
                condition_key TEXT NOT NULL
            )
            """
        )
        connection.executescript(
            """
            CREATE INDEX idx_dictionary_value ON dictionary_entries (field, value);
            CREATE INDEX idx_providers_zip ON providers (clinic_zipcode_id);
            CREATE INDEX idx_providers_lat_lng ON providers (lat, lng);
            CREATE INDEX idx_providers_lng_lat ON providers (lng, lat);
            CREATE INDEX idx_providers_specialty ON providers (medical_specialty_id);
            CREATE INDEX idx_providers_star_rating ON providers (star_doctor, care_rating DESC);
            CREATE INDEX idx_providers_zip_specialty ON providers (clinic_zipcode_id, medical_specialty_id);
            CREATE INDEX idx_provider_conditions_key ON provider_conditions (condition_key, provider_id);
            CREATE INDEX idx_provider_conditions_provider ON provider_conditions (provider_id);
            """
        )

    @staticmethod
    def insert_dictionaries(connection: sqlite3.Connection, dicts: dict[str, list[str]]) -> None:
        entries = [
            (field, value_id, value)
            for field, values in dicts.items()
            for value_id, value in enumerate(values)
        ]
        connection.executemany(
            "INSERT INTO dictionary_entries (field, value_id, value) VALUES (?, ?, ?)",
            entries,
        )

    @staticmethod
    def insert_providers(connection: sqlite3.Connection, fields: list[str], rows: list[list[Any]]) -> None:
        column_names = [field if field in NUMERIC_TYPES else f"{field}_id" for field in fields]
        placeholders = ", ".join("?" for _ in column_names)
        connection.executemany(
            f"INSERT INTO providers ({', '.join(column_names)}) VALUES ({placeholders})",
            [tuple(row) for row in rows],
        )

    @staticmethod
    def insert_conditions(
        connection: sqlite3.Connection,
        fields: list[str],
        rows: list[list[Any]],
        dicts: dict[str, list[str]],
    ) -> None:
        provider_id_index = fields.index("provider_id")
        conditions_index = fields.index("searchable_conditions")
        condition_rows = []
        for row in rows:
            provider_id = row[provider_id_index]
            conditions_value = dicts["searchable_conditions"][row[conditions_index]]
            for condition in [item.strip().lower() for item in conditions_value.split(",") if item.strip()]:
                condition_rows.append((provider_id, condition))

        connection.executemany(
            "INSERT INTO provider_conditions (provider_id, condition_key) VALUES (?, ?)",
            condition_rows,
        )
