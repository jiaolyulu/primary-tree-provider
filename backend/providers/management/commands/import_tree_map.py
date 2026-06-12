from __future__ import annotations

import json
import re
import sqlite3
from pathlib import Path
from typing import Any

from django.core.management.base import BaseCommand, CommandParser


DEFAULT_SOURCE = Path("backend/data/trees_map_all_fields.json")
FIELD_NAME_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

# Used for exports that do not declare metadata.text_fields.
LEGACY_TEXT_FIELDS = {
    "species_common",
    "species_scientific",
    "medical_specialty",
    "specialty_description",
    "provider_type",
    "tree_experience_level",
    "popularity_badge",
    "searchable_conditions",
    "storm_response_readiness",
    "care_philosophy",
    "provider_bio",
    "clinic_description",
    "patient_review_summary",
    "care_audience",
    "primary_care_services",
    "signature_prescription",
    "office_vibe",
    "waiting_room_feature",
    "leaf_paperwork_level",
    "branch_office_status",
    "clinic_name",
    "clinic_address",
    "clinic_zipcode",
    "clinic_city",
    "clinic_neighborhood",
    "clinic_state",
}

LEGACY_NUMERIC_TYPES = {
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

REAL_FIELDS = {"lng", "lat", "care_rating", "shade_side_manner_score", "clinic_latitude", "clinic_longitude"}

INTEGER_FIELDS = {
    "provider_id",
    "years_of_practice",
    "years_at_current_spot",
    "review_count",
    "star_doctor",
    "next_available_visit_days",
    "weekend_availability",
    "care_accessibility_score",
    "clinic_zipcode",
}


class Command(BaseCommand):
    help = "Build the compact SQLite provider index from a packed tree provider JSON export."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "source",
            type=Path,
            nargs="?",
            default=DEFAULT_SOURCE,
            help="Path to a packed tree provider JSON export",
        )
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
        metadata = {**payload["metadata"], "version": payload.get("version")}
        fields: list[str] = metadata["fields"]
        dicts: dict[str, list[str]] = payload["dicts"]
        rows: list[list[Any]] = payload["rows"]
        text_fields, numeric_fields, boolean_fields = self.field_groups(metadata, dicts)

        self.validate_source(metadata, fields, dicts, rows, text_fields, numeric_fields, boolean_fields)

        output.parent.mkdir(parents=True, exist_ok=True)
        if output.exists():
            output.unlink()

        connection = sqlite3.connect(output)
        try:
            connection.execute("PRAGMA journal_mode = OFF")
            connection.execute("PRAGMA synchronous = OFF")
            self.create_schema(connection, fields, text_fields, numeric_fields, boolean_fields, metadata)
            self.insert_dictionaries(connection, dicts)
            self.insert_providers(connection, fields, rows, text_fields)
            self.insert_conditions(connection, fields, rows, dicts)
            self.validate_database(connection, fields, rows, dicts, metadata)
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
    def validate_source(
        metadata: dict[str, Any],
        fields: list[str],
        dicts: dict[str, list[str]],
        rows: list[list[Any]],
        text_fields: set[str],
        numeric_fields: set[str],
        boolean_fields: set[str],
    ) -> None:
        if not fields:
            raise ValueError("Source metadata must include at least one field.")
        if len(fields) != len(set(fields)):
            raise ValueError("Source metadata includes duplicate field names.")
        unsafe_fields = [field for field in fields if not FIELD_NAME_PATTERN.match(field)]
        if unsafe_fields:
            raise ValueError(f"Source metadata includes unsafe field names: {', '.join(unsafe_fields)}")

        supported_fields = text_fields | numeric_fields | boolean_fields
        unsupported_fields = [field for field in fields if field not in supported_fields]
        if unsupported_fields:
            raise ValueError(f"Unsupported fields in source: {', '.join(unsupported_fields)}")

        for required_field in ["provider_id", "searchable_conditions"]:
            if required_field not in fields:
                raise ValueError(f"Source metadata must include {required_field}.")

        expected_row_count = metadata.get("row_count")
        if expected_row_count is not None and expected_row_count != len(rows):
            raise ValueError(f"Source row_count is {expected_row_count:,}, but payload has {len(rows):,} rows.")

        text_fields_without_dictionaries = sorted(field for field in text_fields if field not in dicts)
        if text_fields_without_dictionaries:
            raise ValueError(
                "Text fields missing dictionary entries: " + ", ".join(text_fields_without_dictionaries)
            )

        field_indexes = {field: index for index, field in enumerate(fields)}
        for row_index, row in enumerate(rows):
            if len(row) != len(fields):
                raise ValueError(
                    f"Row {row_index} has {len(row)} values, but source metadata defines {len(fields)} fields."
                )

        for field in text_fields:
            dictionary_values = dicts[field]
            field_index = field_indexes[field]
            for row_index, row in enumerate(rows):
                value_id = row[field_index]
                if not isinstance(value_id, int) or value_id < 0 or value_id >= len(dictionary_values):
                    raise ValueError(f"Row {row_index} has an invalid dictionary id for {field}: {value_id!r}.")

    @staticmethod
    def field_groups(
        metadata: dict[str, Any],
        dicts: dict[str, list[str]],
    ) -> tuple[set[str], set[str], set[str]]:
        text_fields = set(metadata.get("text_fields") or dicts.keys() or LEGACY_TEXT_FIELDS)
        numeric_fields = set(metadata.get("numeric_fields") or LEGACY_NUMERIC_TYPES.keys())
        boolean_fields = set(metadata.get("boolean_fields") or [])
        return text_fields, numeric_fields, boolean_fields

    @staticmethod
    def sql_type(field: str, numeric_fields: set[str], boolean_fields: set[str]) -> str:
        if field == "provider_id":
            return "INTEGER PRIMARY KEY"
        if field in boolean_fields or field in INTEGER_FIELDS:
            return "INTEGER NOT NULL"
        if field in numeric_fields or field in REAL_FIELDS:
            return "REAL NOT NULL"
        return "INTEGER NOT NULL"

    @staticmethod
    def provider_column(field: str, text_fields: set[str]) -> str:
        return field

    @classmethod
    def create_schema(
        cls,
        connection: sqlite3.Connection,
        fields: list[str],
        text_fields: set[str],
        numeric_fields: set[str],
        boolean_fields: set[str],
        metadata: dict[str, Any],
    ) -> None:
        columns = []
        for field in fields:
            column_name = cls.provider_column(field, text_fields)
            columns.append(f"{column_name} {cls.sql_type(field, numeric_fields, boolean_fields)}")

        connection.execute(f"CREATE TABLE providers ({', '.join(columns)})")
        connection.execute(
            """
            CREATE TABLE source_metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
            """
        )
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
        metadata_entries = [
            ("version", json.dumps(metadata.get("version"))),
            ("source_file", json.dumps(metadata.get("source_file"))),
            ("row_count", json.dumps(metadata.get("row_count"))),
            ("fields", json.dumps(fields)),
            ("text_fields", json.dumps(sorted(text_fields))),
            ("numeric_fields", json.dumps(sorted(numeric_fields))),
            ("boolean_fields", json.dumps(sorted(boolean_fields))),
        ]
        connection.executemany(
            "INSERT INTO source_metadata (key, value) VALUES (?, ?)",
            metadata_entries,
        )

        provider_columns = {cls.provider_column(field, text_fields) for field in fields}
        zip_column = "clinic_zipcode_id" if "clinic_zipcode_id" in provider_columns else "clinic_zipcode"
        latitude_column = "clinic_latitude" if "clinic_latitude" in provider_columns else "lat"
        longitude_column = "clinic_longitude" if "clinic_longitude" in provider_columns else "lng"
        specialty_column = (
            "medical_specialty_id" if "medical_specialty_id" in provider_columns else "medical_specialty"
        )

        connection.executescript(
            f"""
            CREATE INDEX idx_dictionary_value ON dictionary_entries (field, value);
            CREATE INDEX idx_providers_zip ON providers ({zip_column});
            CREATE INDEX idx_providers_lat_lng ON providers ({latitude_column}, {longitude_column});
            CREATE INDEX idx_providers_lng_lat ON providers ({longitude_column}, {latitude_column});
            CREATE INDEX idx_providers_specialty ON providers ({specialty_column});
            CREATE INDEX idx_providers_star_rating ON providers (star_doctor, care_rating DESC);
            CREATE INDEX idx_providers_zip_specialty ON providers ({zip_column}, {specialty_column});
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

    @classmethod
    def insert_providers(
        cls,
        connection: sqlite3.Connection,
        fields: list[str],
        rows: list[list[Any]],
        text_fields: set[str],
    ) -> None:
        column_names = [cls.provider_column(field, text_fields) for field in fields]
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

    @staticmethod
    def validate_database(
        connection: sqlite3.Connection,
        fields: list[str],
        rows: list[list[Any]],
        dicts: dict[str, list[str]],
        metadata: dict[str, Any],
    ) -> None:
        provider_columns = [row[1] for row in connection.execute("PRAGMA table_info(providers)").fetchall()]
        if provider_columns != fields:
            raise ValueError("SQLite providers table does not preserve the source field list exactly.")

        provider_count = connection.execute("SELECT COUNT(*) FROM providers").fetchone()[0]
        if provider_count != len(rows):
            raise ValueError(f"SQLite providers table has {provider_count:,} rows, expected {len(rows):,}.")

        expected_row_count = metadata.get("row_count")
        if expected_row_count is not None and provider_count != expected_row_count:
            raise ValueError(
                f"SQLite providers table has {provider_count:,} rows, source metadata expects {expected_row_count:,}."
            )

        dictionary_count = connection.execute("SELECT COUNT(*) FROM dictionary_entries").fetchone()[0]
        expected_dictionary_count = sum(len(values) for values in dicts.values())
        if dictionary_count != expected_dictionary_count:
            raise ValueError(
                "SQLite dictionary_entries table has "
                f"{dictionary_count:,} rows, expected {expected_dictionary_count:,}."
            )

        metadata_fields = json.loads(
            connection.execute("SELECT value FROM source_metadata WHERE key = 'fields'").fetchone()[0]
        )
        if metadata_fields != fields:
            raise ValueError("SQLite source_metadata fields do not match the source field list.")
