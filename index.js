#!/usr/bin/env node
require('./cli_overrides');
var program = require('commander');
var readline = require('readline');
var figlet = require('figlet');
var Table = require('cli-table');

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
		if (cli_overrides(line))
			return rl.prompt()


		DynamoSQL.query(line, function(err, data) {
			if (err)
				console.log(err)
			else {
				var op = command_guess(line)

				if (op == 'SHOW_TABLES') {
					var table = new Table({head: ['Table Name']})
					data.TableNames.map(function(v) {table.push([v]) })
					console.log(table.toString());
					return rl.prompt();
				}

				if (op == 'CREATE_TABLE') {
					var table = new Table({head: ['Index Name','Index Type','Partition','Sort','Projection','Throughput' ]})
					table.push(
						[
							data.TableDescription.TableName + ' ( table ) ',
							'PRIMARY KEY',
							data.TableDescription.KeySchema
								.filter(function(v) {return v.KeyType === 'HASH'})
								.map(function(v) {
								return	v.AttributeName + ' ' +
										data.TableDescription.AttributeDefinitions
											.filter(function(vv) { return vv.AttributeName === v.AttributeName })
											.map(function(v) { return v.AttributeType }).join(' ')
							}).join("\n"),
							data.TableDescription.KeySchema
								.filter(function(v) {return v.KeyType === 'RANGE'})
								.map(function(v) {
								return	v.AttributeName + ' ' +
										data.TableDescription.AttributeDefinitions
											.filter(function(vv) { return vv.AttributeName === v.AttributeName })
											.map(function(v) { return v.AttributeType }).join(' ')
							}).join("\n"),
							'',
							data.TableDescription.ProvisionedThroughput.ReadCapacityUnits + ' ' + data.TableDescription.ProvisionedThroughput.WriteCapacityUnits,
						]
					)

					;(data.TableDescription.GlobalSecondaryIndexes || []).map(function(v) {
						table.push(
							[
								v.IndexName,
								'GSI',
								v.KeySchema
									.filter(function(v) {return v.KeyType === 'HASH'})
									.map(function(v) {
									return	v.AttributeName + ' ' +
											data.TableDescription.AttributeDefinitions
												.filter(function(vv) { return vv.AttributeName === v.AttributeName })
												.map(function(v) { return v.AttributeType }).join(' ')
								}).join("\n"),
								v.KeySchema
									.filter(function(v) {return v.KeyType === 'RANGE'})
									.map(function(v) {
									return	v.AttributeName + ' ' +
											data.TableDescription.AttributeDefinitions
												.filter(function(vv) { return vv.AttributeName === v.AttributeName })
												.map(function(v) { return v.AttributeType }).join(' ')
								}).join("\n"),
								v.Projection.ProjectionType === 'INCLUDE' ? (v.Projection.NonKeyAttributes.join(",\n") ) : v.Projection.ProjectionType,
								v.ProvisionedThroughput.ReadCapacityUnits + ' ' + v.ProvisionedThroughput.WriteCapacityUnits
							]
						)
					})
					;(data.TableDescription || []).LocalSecondaryIndexes.map(function(v) {
						table.push(
							[
								v.IndexName,
								'LSI',
								v.KeySchema
									.filter(function(v) {return v.KeyType === 'HASH'})
									.map(function(v) {
									return	v.AttributeName + ' ' +
											data.TableDescription.AttributeDefinitions
												.filter(function(vv) { return vv.AttributeName === v.AttributeName })
												.map(function(v) { return v.AttributeType }).join(' ')
								}).join("\n"),
								v.KeySchema
									.filter(function(v) {return v.KeyType === 'RANGE'})
									.map(function(v) {
									return	v.AttributeName + ' ' +
											data.TableDescription.AttributeDefinitions
												.filter(function(vv) { return vv.AttributeName === v.AttributeName })
												.map(function(v) { return v.AttributeType }).join(' ')
								}).join("\n"),
								v.Projection.ProjectionType === 'INCLUDE' ? (v.Projection.NonKeyAttributes.join(",\n") ) : v.Projection.ProjectionType,
								'-'
							]
						)
					})
					console.log(table.toString());
					//console.log(JSON.stringify(data, null, "\t"))
					return rl.prompt();
				}

				if (op == 'DESCRIBE_TABLE') {
					var table = new Table({head: ['Index Name','Index Type','Partition','Sort','Projection','Throughput','Status','Size','Items' ]})
					table.push(
						[
							data.Table.TableName + ' ( table ) ',
							'PRIMARY KEY',
							data.Table.KeySchema
								.filter(function(v) {return v.KeyType === 'HASH'})
								.map(function(v) {
								return	v.AttributeName + ' ' +
										data.Table.AttributeDefinitions
											.filter(function(vv) { return vv.AttributeName === v.AttributeName })
											.map(function(v) { return v.AttributeType }).join(' ')
							}).join("\n"),
							data.Table.KeySchema
								.filter(function(v) {return v.KeyType === 'RANGE'})
								.map(function(v) {
								return	v.AttributeName + ' ' +
										data.Table.AttributeDefinitions
											.filter(function(vv) { return vv.AttributeName === v.AttributeName })
											.map(function(v) { return v.AttributeType }).join(' ')
							}).join("\n"),
							'',
							data.Table.ProvisionedThroughput.ReadCapacityUnits + ' ' + data.Table.ProvisionedThroughput.WriteCapacityUnits,
							data.Table.TableStatus,
							data.Table.TableSizeBytes,
							data.Table.ItemCount,

						]
					)

					;(data.Table.GlobalSecondaryIndexes || []).map(function(v) {
						table.push(
							[
								v.IndexName,
								'GSI',
								v.KeySchema
									.filter(function(v) {return v.KeyType === 'HASH'})
									.map(function(v) {
									return	v.AttributeName + ' ' +
											data.Table.AttributeDefinitions
												.filter(function(vv) { return vv.AttributeName === v.AttributeName })
												.map(function(v) { return v.AttributeType }).join(' ')
								}).join("\n"),
								v.KeySchema
									.filter(function(v) {return v.KeyType === 'RANGE'})
									.map(function(v) {
									return	v.AttributeName + ' ' +
											data.Table.AttributeDefinitions
												.filter(function(vv) { return vv.AttributeName === v.AttributeName })
												.map(function(v) { return v.AttributeType }).join(' ')
								}).join("\n"),
								v.Projection.ProjectionType === 'INCLUDE' ? (v.Projection.NonKeyAttributes.join(",\n") ) : v.Projection.ProjectionType,
								v.ProvisionedThroughput.ReadCapacityUnits + ' ' + v.ProvisionedThroughput.WriteCapacityUnits,
								v.IndexStatus,
								v.IndexSizeBytes,
								v.ItemCount
							]
						)
					})
					;(data.Table.LocalSecondaryIndexes || []).map(function(v) {
						table.push(
							[
								v.IndexName,
								'LSI',
								v.KeySchema
									.filter(function(v) {return v.KeyType === 'HASH'})
									.map(function(v) {
									return	v.AttributeName + ' ' +
											data.Table.AttributeDefinitions
												.filter(function(vv) { return vv.AttributeName === v.AttributeName })
												.map(function(v) { return v.AttributeType }).join(' ')
								}).join("\n"),
								v.KeySchema
									.filter(function(v) {return v.KeyType === 'RANGE'})
									.map(function(v) {
									return	v.AttributeName + ' ' +
											data.Table.AttributeDefinitions
												.filter(function(vv) { return vv.AttributeName === v.AttributeName })
												.map(function(v) { return v.AttributeType }).join(' ')
								}).join("\n"),
								v.Projection.ProjectionType === 'INCLUDE' ? (v.Projection.NonKeyAttributes.join(",\n") ) : v.Projection.ProjectionType,
								'N/A',
								'N/A',
								v.IndexSizeBytes,
								v.ItemCount
							]
						)
					})

					console.log(table.toString());
					//console.log(JSON.stringify(data, null, "\t"))
					return rl.prompt();
				}

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

		figlet('DynamoDB', function(err, data) {
			console.log(data)
			console.log("\n")

			process_one_line()
		});






	})
	.parse(['asd'].concat( process.argv ));
