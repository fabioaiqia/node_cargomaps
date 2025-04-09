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

# Alter table to recived new parameters
```sql
ALTER TABLE registers
ADD COLUMN name TEXT,
ADD COLUMN nickname TEXT,
ADD COLUMN address TEXT;
ADD COLUMN profile_picture TEXT
```

# Create Table Trucks
```sql
CREATE TABLE trucks (
	id SERIAL PRIMARY KEY,
	register_id INTEGER NOT NULL REFERENCES registers(id) ON DELETE CASCADE,
	type VARCHAR(50) NOT NULL,
	height DECIMAL(4,2),
	width DECIMAL(4,2),
	length DECIMAL(5,2),
	weight INTEGER,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

# Intructions
Create file .env in root folder
DB_HOST=localhost
DB_USER=user
DB_PASSWORD=pass
DB_NAME=db
DB_PORT=port

```
npm install express pg dotenv axios
```