#!/usr/bin/env node
require('./cli_overrides');
config = require("./package.json")
var program = require('commander');
var readline = require('readline');
var figlet = require('figlet');
var Table = require('cli-table2');
var colors = require('colors/safe')

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

var cmd_line_queue = []

function process_one_line() {
	rl.prompt();
	rl.on('line', function(line) {


		if (line.trim() == '') {
			cmd_line_queue.push("\n")
			return rl.prompt()
		}

		// check if its a cli specific command
		if (command_is_sistem([line].concat(cmd_line_queue).join("\n") )) {
			cli_overrides([line].concat(cmd_line_queue).join("\n"))
			cmd_line_queue = []
			rl.setPrompt('dynamodb> ');
			return rl.prompt()
		}

		//  check if line ends with ";"
		if (line.trim().substr(-1) !== ';') {
			cmd_line_queue.push(line)
			rl.setPrompt('');
			return rl.prompt()
		}
		cmd_line_queue.push(line.trim().substr(0,line.trim().length -1))

		var query = cmd_line_queue.join("\n")
		cmd_line_queue = [] // reset
		rl.setPrompt('dynamodb> ');
		//if (cli_overrides(query))
		//	return rl.prompt()


		DynamoSQL.query(query, function(err, data) {
			if (err)
				console.log(err)
			else {
				var op = command_guess(query)

				if (op == 'SHOW_TABLES') {
					var table = new Table({head: ['Table Name']})
					data.TableNames.map(function(v) {table.push([v]) })
					console.log(table.toString());
					return rl.prompt();
				}
				if (op == 'DROP_TABLE') {
					//console.log(JSON.stringify(data,null,"\t"))

					var table = new Table(
						//{head: ['Index Name','Index Type','Partition','Sort','Projection','Throughput','Status','Size','Items' ]}
					)
					table.push([
						{colSpan:9,content:data.TableDescription.TableName}
					])
					table.push([
						colors.red('Index Name'),
						colors.red('Index Type'),
						colors.red('Partition'),
						colors.red('Sort'),
						colors.red('Projection'),
						colors.red('Throughput'),
						colors.red('Status'),
						colors.red('Size'),
						colors.red('Items')
					])
					table.push(
						[
							'',
							'PRIMARY KEY',
							(data.TableDescription.KeySchema || [])
								.filter(function(v) {return v.KeyType === 'HASH'})
								.map(function(v) {
								return	v.AttributeName + ' ' +
										data.TableDescription.AttributeDefinitions
											.filter(function(vv) { return vv.AttributeName === v.AttributeName })
											.map(function(v) { return v.AttributeType }).join(' ')
							}).join("\n"),
							(data.TableDescription.KeySchema || [])
								.filter(function(v) {return v.KeyType === 'RANGE'})
								.map(function(v) {
								return	v.AttributeName + ' ' +
										data.TableDescription.AttributeDefinitions
											.filter(function(vv) { return vv.AttributeName === v.AttributeName })
											.map(function(v) { return v.AttributeType }).join(' ')
							}).join("\n"),
							'',
							{
								hAlign: 'center',
								content: data.TableDescription.ProvisionedThroughput.ReadCapacityUnits + '/' + data.TableDescription.ProvisionedThroughput.WriteCapacityUnits,
							},
							data.TableDescription.TableStatus,
							{
								hAlign: 'right',
								content: data.TableDescription.TableSizeBytes,
							},
							{
								hAlign: 'right',
								content: data.TableDescription.ItemCount,
							}
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
								{
									hAlign:v.Projection.ProjectionType === 'INCLUDE' ? 'left' : 'center',
									content:v.Projection.ProjectionType === 'INCLUDE' ? (v.Projection.NonKeyAttributes.join(",\n") ) : v.Projection.ProjectionType,
								},
								{
									hAlign: 'center',
									content: v.ProvisionedThroughput.ReadCapacityUnits + '/' + v.ProvisionedThroughput.WriteCapacityUnits,
								},

								v.IndexStatus,
								{
									hAlign: 'right',
									content: v.IndexSizeBytes,
								},
								{
									hAlign: 'right',
									content: v.ItemCount
								}

							]
						)
					})
					;(data.TableDescription.LocalSecondaryIndexes || []).map(function(v) {
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
								{
									hAlign:v.Projection.ProjectionType === 'INCLUDE' ? 'left' : 'center',
									content:v.Projection.ProjectionType === 'INCLUDE' ? (v.Projection.NonKeyAttributes.join(",\n") ) : v.Projection.ProjectionType,
								},
								{
									hAlign: 'center',
									content: '-/-',
								},

								'N/A',
								{
									hAlign: 'right',
									content: v.IndexSizeBytes,
								},
								{
									hAlign: 'right',
									content: v.ItemCount
								}

							]
						)
					})

					console.log(table.toString());
					return rl.prompt();
				}
				if (op == 'CREATE_TABLE') {
					var table = new Table(
						//{head: ['Index Name','Index Type','Partition','Sort','Projection','Throughput','Status','Size','Items' ]}
					)
					table.push([
						{colSpan:6,content:data.TableDescription.TableName}
					])
					table.push([
						colors.red('Index Name'),
						colors.red('Index Type'),
						colors.red('Partition'),
						colors.red('Sort'),
						colors.red('Projection'),
						colors.red('Throughput'),
					])

					table.push(
						[
							'',
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
					var table = new Table(
						//{head: ['Index Name','Index Type','Partition','Sort','Projection','Throughput','Status','Size','Items' ]}
					)
					table.push([
						{colSpan:9,content:data.Table.TableName}
					])
					table.push([
						colors.red('Index Name'),
						colors.red('Index Type'),
						colors.red('Partition'),
						colors.red('Sort'),
						colors.red('Projection'),
						colors.red('Throughput'),
						colors.red('Status'),
						colors.red('Size'),
						colors.red('Items')
					])
					table.push(
						[
							'',
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
							{
								hAlign: 'center',
								content: data.Table.ProvisionedThroughput.ReadCapacityUnits + '/' + data.Table.ProvisionedThroughput.WriteCapacityUnits,
							},
							data.Table.TableStatus,
							{
								hAlign: 'right',
								content: data.Table.TableSizeBytes,
							},
							{
								hAlign: 'right',
								content: data.Table.ItemCount,
							}
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
								{
									hAlign:v.Projection.ProjectionType === 'INCLUDE' ? 'left' : 'center',
									content:v.Projection.ProjectionType === 'INCLUDE' ? (v.Projection.NonKeyAttributes.join(",\n") ) : v.Projection.ProjectionType,
								},
								{
									hAlign: 'center',
									content: v.ProvisionedThroughput.ReadCapacityUnits + '/' + v.ProvisionedThroughput.WriteCapacityUnits,
								},

								v.IndexStatus,
								{
									hAlign: 'right',
									content: v.IndexSizeBytes,
								},
								{
									hAlign: 'right',
									content: v.ItemCount
								}

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
								{
									hAlign:v.Projection.ProjectionType === 'INCLUDE' ? 'left' : 'center',
									content:v.Projection.ProjectionType === 'INCLUDE' ? (v.Projection.NonKeyAttributes.join(",\n") ) : v.Projection.ProjectionType,
								},
								{
									hAlign: 'center',
									content: '-/-',
								},

								'N/A',
								{
									hAlign: 'right',
									content: v.IndexSizeBytes,
								},
								{
									hAlign: 'right',
									content: v.ItemCount
								}

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
	})
	rl.on('close',function(){
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

		console.log("\nDynamoDB cli version ", config.version, " \n")
		figlet('DynamoDB', function(err, data) {
			console.log(data)
			console.log("\nType 'help;' for help. End every command with a semicolon ';' Type QUIT or EXIT to leave the console. \n\n" )

			process_one_line()
		});






	})
	.parse(['asd'].concat( process.argv ));
