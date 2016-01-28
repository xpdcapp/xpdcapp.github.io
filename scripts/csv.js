function JSONtoCSV(json_data) {
	var fields = Object.keys(json_data[0]);
	var csv = json_data.map(function(row){
	  return fields.map(function(fieldName){
	    return '"' + (row[fieldName] || '') + '"';
	  });
	});
	csv.unshift(fields); // add header column

	return (csv.join('\r\n'));
}

function generateCSVDownload(csv_data) {
	//this trick will generate a temp "a" tag
	var link = document.createElement("a");
	link.id="lnkDwnldLnk";

	//this part will append the anchor tag and remove it after automatic click
	document.body.appendChild(link);

	blob = new Blob([csv_data], { type: 'text/csv' });
	var csvUrl = window.webkitURL.createObjectURL(blob);
	var filename = 'UserExport.csv';
	$("#lnkDwnldLnk")
	.attr({
	'download': filename,
	'href': csvUrl
	});

	$('#lnkDwnldLnk')[0].click();
	document.body.removeChild(link);
}
