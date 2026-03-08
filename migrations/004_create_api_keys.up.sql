-- API Keys для внешнего API с биллингом по токенам

CREATE TABLE api_keys (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL REFERENCES users(id),
    name           TEXT NOT NULL,
    key_hash       TEXT NOT NULL UNIQUE,   -- SHA-256 от сырого ключа
    key_prefix     TEXT NOT NULL,          -- первые 11 символов ("lk_" + 8)
    token_balance  INTEGER NOT NULL DEFAULT 1000,
    tokens_used    INTEGER NOT NULL DEFAULT 0,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    expires_at     TIMESTAMP WITH TIME ZONE,
    last_used_at   TIMESTAMP WITH TIME ZONE,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at     TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_api_keys_user_id   ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash  ON api_keys(key_hash) WHERE deleted_at IS NULL;
CREATE INDEX idx_api_keys_deleted   ON api_keys(deleted_at);

-- Лог вызовов внешнего API
CREATE TABLE api_usage_logs (
    id          SERIAL PRIMARY KEY,
    api_key_id  TEXT NOT NULL REFERENCES api_keys(id),
    endpoint    TEXT NOT NULL,
    method      TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    tokens_cost INTEGER NOT NULL DEFAULT 0,
    ip_address  TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_usage_key_id ON api_usage_logs(api_key_id);
CREATE INDEX idx_api_usage_created ON api_usage_logs(created_at);
