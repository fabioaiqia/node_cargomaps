# node_cargomaps
Project node to cargomaps


# Schemas
```sql
CREATE TABLE registers (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  register_id INTEGER REFERENCES registers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

# Intructions
Create file .env in root folder
DB_HOST=localhost
DB_USER=user
DB_PASSWORD=pass
DB_NAME=db
DB_PORT=port

```
npm install pg dotenv axios
```