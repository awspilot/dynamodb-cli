
cli_overrides = function(line) {
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
DESCRIBE TABLE	\n\
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
		return true
	}

	if (line.trim() === '')
		return true

	return false
}
command_guess = function(line) {
	var q = line.split(' ').map(function(v) {return v.trim().toUpperCase()}).filter(function(v){ return v != ''})

	if (['INSERT','UPDATE','REPLACE','DELETE','SELECT'].indexOf(q.slice(0,1).join(' ')) !== -1)
		return q.slice(0,1).join(' ')

	if (['SHOW TABLES','CREATE TABLE','DESCRIBE TABLE'].indexOf(q.slice(0,2).join(' '))  !== -1)
		return q.slice(0,2).join('_')

	return;
}
