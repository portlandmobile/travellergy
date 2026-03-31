-- Staging Schema for Slice 12

CREATE SCHEMA IF NOT EXISTS staging;

CREATE TABLE IF NOT EXISTS staging.ingestion_raw (
    id SERIAL PRIMARY KEY,
    source_name TEXT NOT NULL,
    raw_data JSONB NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, validated, rejected, needs_review
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staging.ingestion_audit (
    id SERIAL PRIMARY KEY,
    ingestion_raw_id INTEGER REFERENCES staging.ingestion_raw(id),
    decision TEXT, -- accepted, rejected, flagged
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
