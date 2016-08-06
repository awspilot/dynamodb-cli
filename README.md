# dynamodb-cli

```

npm install -g dynamodb-cli

```


```

dynamodb-cli -k KEYXXXXXXXX -s SECRETXXXXXXXX -r us-east-1

```

```

dynamodb> CREATE TABLE test ( 
  hash STRING , 
  range NUMBER, 
  range2 STRING,
  hash2 STRING,
  PRIMARY KEY ( hash, range ),
  INDEX index1 LSI ( hash, range2 ),
  INDEX index2 GSI ( hash2, range2 ) PROJECTION KEYS_ONLY,
  INDEX index3 GSI ( hash2 ) PROJECTION ( range2 ) 
)

```

```

dynamodb> SHOW TABLES

```

```

dynamodb> DESCRIBE TABLE test

```


```

dynamodb> INSERT INTO test 
SET 
  hash = 'h1', 
  range = 1, 
  number = 1001, 
  boolean = true, 
  nulled = null, 
  object = {}

```

```

dynamodb> INSERT INTO test 
SET 
  hash = 'h1', 
  range = 2, 
  number = 1002, 
  boolean = false, 
  array = []

```

```

dynamodb> INSERT INTO test 
SET 
  hash = 'h1', 
  range = 3, 
  array_of_objects = [{k:'v'},{k2:'v2'}]

```

```

dynamodb> SELECT 
  * 
FROM 
  test 
WHERE 
  hash = 'h1' 
DESC 
LIMIT 2

```

```

dynamodb> DELETE 
FROM 
  test 
WHERE 
  hash = 'h1' AND range = 3

```

```

dynamodb> REPLACE 
INTO 
  test 
SET 
  hash = 'h1', range = 2

```

```

dynamodb> UPDATE 
  test 
SET 
  boolean = false, 
  number+=1 
WHERE 
  hash = 'h1' AND range = 1

```

For more information on SQL syntax please check [dynamodb-sql](https://www.npmjs.com/package/dynamodb-sql)
