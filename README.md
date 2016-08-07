[![npm page](https://nodei.co/npm/dynamodb-cli.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/dynamodb-cli)

# dynamodb-cli

```

yourname@yourhost:~$ npm install -g dynamodb-cli

```


```

yourname@yourhost:~$ dynamodb-cli -k KEYXXXXXXXX -s SECRETXXXXXXXX -r us-east-1

```

or start an in-memory DynamoDB ( to test only )

```

yourname@yourhost:~$ dynamodb-cli

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
);
┌───────────────────────────────────────────────────────────────────────────┐
│ test                                                                      │
├────────────┬─────────────┬───────────┬──────────┬────────────┬────────────┤
│ Index Name │ Index Type  │ Partition │ Sort     │ Projection │ Throughput │
├────────────┼─────────────┼───────────┼──────────┼────────────┼────────────┤
│            │ PRIMARY KEY │ hash S    │ range N  │            │ 1 1        │
├────────────┼─────────────┼───────────┼──────────┼────────────┼────────────┤
│ index2     │ GSI         │ hash2 S   │ range2 S │ KEYS_ONLY  │ 1 1        │
├────────────┼─────────────┼───────────┼──────────┼────────────┼────────────┤
│ index3     │ GSI         │ hash2 S   │          │ range2     │ 1 1        │
├────────────┼─────────────┼───────────┼──────────┼────────────┼────────────┤
│ index1     │ LSI         │ hash S    │ range2 S │ ALL        │ -          │
└────────────┴─────────────┴───────────┴──────────┴────────────┴────────────┘

```

```

dynamodb> SHOW TABLES;
┌────────────┐
│ Table Name │
├────────────┤
│ test       │
└────────────┘

```

```

dynamodb> DESCRIBE TABLE test;
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│ test                                                                                              │
├────────────┬─────────────┬───────────┬──────────┬────────────┬────────────┬────────┬──────┬───────┤
│ Index Name │ Index Type  │ Partition │ Sort     │ Projection │ Throughput │ Status │ Size │ Items │
├────────────┼─────────────┼───────────┼──────────┼────────────┼────────────┼────────┼──────┼───────┤
│            │ PRIMARY KEY │ hash S    │ range N  │            │    1/1     │ ACTIVE │    0 │     0 │
├────────────┼─────────────┼───────────┼──────────┼────────────┼────────────┼────────┼──────┼───────┤
│ index2     │ GSI         │ hash2 S   │ range2 S │ KEYS_ONLY  │    1/1     │ ACTIVE │    0 │     0 │
├────────────┼─────────────┼───────────┼──────────┼────────────┼────────────┼────────┼──────┼───────┤
│ index3     │ GSI         │ hash2 S   │          │ range2     │    1/1     │ ACTIVE │    0 │     0 │
├────────────┼─────────────┼───────────┼──────────┼────────────┼────────────┼────────┼──────┼───────┤
│ index1     │ LSI         │ hash S    │ range2 S │    ALL     │    -/-     │ N/A    │    0 │     0 │
└────────────┴─────────────┴───────────┴──────────┴────────────┴────────────┴────────┴──────┴───────┘

```

```

dynamodb> INSERT INTO test 
SET 
  hash = 'h1', 
  range = 1, 
  number = 1001, 
  boolean = true, 
  nulled = null, 
  object = {};

{}

```

```

dynamodb> INSERT INTO test 
SET 
  hash = 'h1', 
  range = 3, 
  array_of_objects = [{k:'v'},{k2:'v2'}];
  
{}

```

```

dynamodb> SELECT 
  * 
FROM 
  test 
WHERE 
  hash = 'h1' 
DESC 
LIMIT 2;

{
	"hash": "h1",
	"range": 3,
	"array_of_objects": [
		{
			"k": "v"
		},
		{
			"k2": "v2"
		}
	]
}
{
	"hash": "h1",
	"range": 1,
	"number": 1001,
	"boolean": true,
	"nulled": null,
	"object": {}
}

```

```

dynamodb> DELETE 
FROM 
  test 
WHERE 
  hash = 'h1' AND range = 3;
  
dynamodb> REPLACE 
INTO 
  test 
SET 
  hash = 'h1', range = 2;
  
```

```

dynamodb> UPDATE 
  test 
SET 
  boolean = false, 
  number+=1 
WHERE 
  hash = 'h1' AND range = 1;

```

```

dynamodb> DROP TABLE test;

┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ test                                                                                                │
├────────────┬─────────────┬───────────┬──────────┬────────────┬────────────┬──────────┬──────┬───────┤
│ Index Name │ Index Type  │ Partition │ Sort     │ Projection │ Throughput │ Status   │ Size │ Items │
├────────────┼─────────────┼───────────┼──────────┼────────────┼────────────┼──────────┼──────┼───────┤
│            │ PRIMARY KEY │ hash S    │ range N  │            │    1/1     │ DELETING │    0 │     0 │
├────────────┼─────────────┼───────────┼──────────┼────────────┼────────────┼──────────┼──────┼───────┤
│ index1     │ LSI         │ hash S    │ range2 S │    ALL     │    -/-     │ N/A      │    0 │     0 │
└────────────┴─────────────┴───────────┴──────────┴────────────┴────────────┴──────────┴──────┴───────┘

```



For more information on SQL syntax please check [dynamodb-sql](https://www.npmjs.com/package/dynamodb-sql)
