#!/usr/bin/env node
var program = require('commander');
var readline = require('readline');

var dynalite = require('dynalite'),
dynaliteServer = dynalite({ createTableMs: 50,db: require('memdown')})
dynaliteServer.listen(4567, function(err) {
	if (err) throw err
})
var AWS = require('aws-sdk')
var DynamoSQL = require('dynamodb-sql')( new AWS.DynamoDB({endpoint: 'http://localhost:4567', "accessKeyId": "akid", "secretAccessKey": "secret", "region": "us-east-1" }))

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	historySize: 10000,
});
rl.setPrompt('dynamodb> ');

function process_one_line() {
	rl.prompt();
	rl.on('line', function(line) {
		if (line.trim().toUpperCase() === "QUIT")
			return process.exit()

		if (line.trim().toUpperCase() === "EXIT")
			return process.exit()

		if (line.trim().toUpperCase().split(' ')[0] === "HELP") {
			var topic = line.trim().toUpperCase().split(' ').map(function(v) { return v.trim()}).filter(function(v) {return v !== ''}).slice(1).join(' ')
			switch (topic) {
				case '':
				console.log("Type \"help TOPIC\" for more details:\n\
\n\
Available topics:\n\
SHOW TABLES		\n\
CREATE TABLE	\n\
INSERT			\n\
UPDATE			\n\
REPLACE			\n\
DELETE			\n\
SELECT			\n\
				")

				break;
				case 'INSERT':
				console.log("INSERT INTO \n\
    tbl_name \n\
SET \n\
    partition_key = <VALUE>, \n\
    sort_key = <VALUE> \n\
    [, other_key = <VALUE>, ... ]\n\
				")
				break;
				case 'UPDATE':
				console.log("UPDATE \n\
    tbl_name \n\
SET \n\
    key1 OP <VALUE> [, key2 OP <VALUE>, ... ] \n\
WHERE \n\
    partition_key = <VALUE> AND sort_key = <VALUE>\n\
				")
				break;
				case 'REPLACE':
				console.log("REPLACE INTO \n\
    tbl_name \n\
SET \n\
     partition_key = <VALUE>, sort_key = <VALUE> [, other_key = <VALUE>, ... ]\n\
	 			")
				break;
				case 'DELETE':
				console.log("DELETE FROM \n\
    tbl_name \n\
WHERE \n\
    partition_key = <VALUE> AND sort_key = <VALUE>\n\
				")
				break;
				case 'SELECT':
				console.log("SELECT\n\
    *\n\
FROM\n\
    tbl_name \n\
[ USE INDEX index_name ]\n\
WHERE\n\
    partition_key = <VALUE> \n\
    [ AND sort_key OP <VALUE> ]\n\
 \n\
[ HAVING attribute OP <VALUE> [ AND attribute OP <VALUE> ] ]\n\
[ DESC ]\n\
[ LIMIT <number> ]\n\
[ CONSISTENT_READ ]\n\
				")
				break;
			}
			rl.prompt()
		} else if (line.trim() !== '') {
			DynamoSQL.query(line, function(err, data) {
				if (err)
					console.log(err)
				else {
					if (data instanceof Array) {
						data.map(function(v) {
							console.log(JSON.stringify(v, null, "\t"))
						})
					} else {
						console.log(JSON.stringify(data, null, "\t"))
					}


				}
				rl.prompt();
			})
		} else {
			rl.prompt()
		}

	}).on('close',function(){
		process.exit(0);
	});
}

program
	.arguments('<file>')
	.option('-k, --key <accessKeyId>', 'AWS Key')
	.option('-s, --secret <secretAccessKey>', 'AWS Secret')
	.option('-r, --region <region>', 'AWS Region')
	.action(function() {

		if (program.key || program.secret || program.region) {
			AWS.config.update({
				accessKeyId: program.key,
				secretAccessKey: program.secret,
				region: program.region
			})
			DynamoSQL = require('dynamodb-sql')( new AWS.DynamoDB({
				accessKeyId: program.key,
				secretAccessKey: program.secret,
				region: program.region
			}))

		} else {
			DynamoSQL = require('dynamodb-sql')( new AWS.DynamoDB({endpoint: 'http://localhost:4567', "accessKeyId": "akid", "secretAccessKey": "secret", "region": "us-east-1" }))
		}
		//console.log('params:', program.key, program.secret, program.region);
		process_one_line()

	})
	.parse(['asd'].concat( process.argv ));
