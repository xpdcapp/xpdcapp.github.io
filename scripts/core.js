window.XPDC = {
	access_token: '',
	group_id: '989263071121340',
	setAccess: function (response) {
		window.XPDC.access_token = response.authResponse.accessToken;
		window.XPDC.user_id = response.authResponse.userID;
	}
};

	$(function() {
		$('#xpdc_dateRange').datepick({rangeSelect: true});
		bindEvents();
	});

	function bindEvents() {
		$('#post-button').on('click', this.handleFilterPostsClick);
		$('#date-button').on('click', this.handleGetDatesClick);
		$('#comments-button').on('click', this.handleGetCommentsClick);
		$('#abutton').on('click', this.logIn);
	};

	function logIn() {
		FB.login(function(response) {
			console.log(response);
			testAPI();
			$('#xpdc_dateRange').datepick('show');
		}, {scope: 'public_profile,email,user_managed_groups', return_scopes: true});
	};

	function handleGetDatesClick() {
		getPosts().done(function() {
			setDateRange();
		})
	}

	function handleFilterPostsClick() {
		var dates = $('#xpdc_dateRange').datepick('getDate'),
			from_date = dates[0],
			to_date = dates[1],
			// from_date = new Date($('#to-date').val()),
			// to_date = new Date($('#from-date').val()),
			filtered_posts;

		getPosts().done(function() {
			filtered_posts = _.filter(window.XPDC.posts, function(post) {
				return post.date >= from_date && post.date <= to_date && post.message !== undefined
			});

			var container = $('<select multiple id="xpdc_comments" class="xpdc_comments"></select>');

			_.each(filtered_posts, function(post) {
				var trimmed_message = post.message.indexOf('|') > -1 ? post.message.substring(0, post.message.indexOf('|')) : post.message;
				container.append('<option value="' + post.id + '" class="xpdc_comment">' + trimmed_message + '</option>');
			});

			$('#xpdc_posts_select_wrapper').empty().prepend(container);
			$('#comments-button').removeClass('hidden');
			console.log(filtered_posts);
		})

	};

	function handleGetCommentsClick() {
		var selected_post = $('#xpdc_comments').val(),
			index = 0;

		_.each(selected_post, function (post_id) {
			post_id = '/' + post_id,
			multi_response = [];

			FB.api(
				post_id,
				'GET',
				{"fields":"message,comments.limit(999)"},
				function(response) {
					index++;
					multi_response.push(response)
					if (index === selected_post.length) {
						generateCSV(multi_response);
					}
					//renderComments(response);
				}
			);
		})
	}

	function generateCSV(multi_response) {

		var json_data = [],
			csv_data;
		_.each(multi_response, function (response) {
			json_data.push({
				post_name: response.message,
				name: '####################',
				message: '####################'
			});
			if (response.comments && response.comments.data) {
				_.each(response.comments.data, function (comment) {
					if (comment.from && comment.from.name) {
						json_data.push({
							name: comment.from.name,
							message: comment.message
						})
					}
				})
			}
		})

		csv_data = JSONtoCSV(json_data);
		generateCSVDownload(csv_data);
	}

	function renderComments(response) {
		var comment_wrapper = $('#xpdc_comments_wrapper');

		comment_wrapper.empty();

		if (response.comments && response.comments.data) {
			_.each(response.comments.data, function (comment) {
				var comment_ele = $('<div class="xpdc_comment"></div>')
				if (comment.from && comment.from.name) {
					comment_ele.append('name: ' + comment.from.name);
				}
				comment_ele.append('<br />message: ' + comment.message + '<br /><br />');
				comment_wrapper.append(comment_ele);
			})
		}
	}

	function getComments() {
		var group_id = '/' + $('#xpdc_group_id').val();
		FB.api(
			group_id,
			'GET',
			{"fields":"feed{comments}"},
			function(response) {
				console.log(response);
				window.XPDC.comments = parseComments(response);
				setDateRange();
			}
		);
	};

	function getPosts() {
		var group_id = '/' + $('#xpdc_group_id').val(),
			user_id = '/' + window.XPDC.user_id + '/groups',
			access_token = 'CAACEdEose0cBAEofDM72efBOwBETitLEMqGdaCT3CfFYNVYC0uo1sYY3khWrMo021DtMQQZCn5infAkkL1jSfvvGRVfkHYql1UzcVrt54tZAZCeeZAM2ZAZAWjB32GZABZBkHTF0TTDfRMWQOV6hmh77EZAKLeaDoSRjediHvm6wSI4aOqILPe9pusisZAN8ZAhy3WWHdL90IUTEciCw0QrRZBJ3',
			deferred = $.Deferred();

		// FB.api(
		// 	'/797180083761603/groups',
		//   'GET',
		// 	{"fields":"feed","access_token":window.XPDC.access_token},
		// 	function(response) {
		// 		console.log(response);
		// 		window.XPDC.posts = parsePosts(response);
		// 		deferred.resolve();
		//   }
		// );



		FB.api(
			group_id,
			'GET',
			{"fields":"feed{created_time,name,message}"},
			function(response) {
				console.log(response);
				window.XPDC.posts = parsePosts(response);
				deferred.resolve();
			}
		);
		return deferred;
	};

	function setDateRange() {

		unique = _.uniq(window.XPDC.posts, function (post) {
			return post.date_string;
		});

		_.each(unique, function (post) {
			$('#from-date')
				.prepend($("<option></option>")
				.attr("value", post.date_string)
				.text(post.date_string));

			$('#to-date')
				.prepend($("<option></option>")
				.attr("value",post.date_string)
				.text(post.date_string));
		});

	};

	function parseComments(response) {
		var parsedComments = [];
		if (response.feed && response.feed.data) {
			_.each(response.feed.data, function(item) {
				if (item.comments && item.comments.data) {
					_.each(item.comments.data, function (comment) {
						parsedComments.push({
							date_string: parseDate(comment.created_time).toDateString(),
							date: parseDate(comment.created_time),
							comment: comment.message,
							name: comment.from.name
						});
					})
				}

			})
		}
		_.each(parsedComments, function(comment) {
			console.log(comment);
		})
		return parsedComments;
	}

	function parsePosts(response) {
		var parsedPosts = [];

		if (!response.feed && response.data && response.data[0]) {
			response.feed = response.data[0].feed;
		}

		if (response.feed && response.feed.data) {
			_.each(response.feed.data, function(item) {
				if (item.message) {
					parsedPosts.push({
						date_string: parseDate(item.created_time).toDateString(),
						date: parseDate(item.created_time),
						message: item.message,
						id: item.id
					});
				}
			})
		}
		return parsedPosts;
	}

	function parseDate(dateString) {
		// Date.prototype.setISO8601(dateString);
		// var return_date = new Date(Date.prototype.toISO8601String(3))
		if (dateString.indexOf('+') > 0) {
			dateString = dateString.substring(0, dateString.indexOf('+'));
		}
		var return_date = new Date(dateString);
		return_date.setHours(0,0,0,0);
		return return_date;
	}


// 	// Move to new file
// 	Date.prototype.setISO8601 = function (string) {
//     var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
//         "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
//         "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
//     var d = string.match(new RegExp(regexp));
//
//     var offset = 0;
//     var date = new Date(d[1], 0, 1);
//
//     if (d[3]) { date.setMonth(d[3] - 1); }
//     if (d[5]) { date.setDate(d[5]); }
//     if (d[7]) { date.setHours(d[7]); }
//     if (d[8]) { date.setMinutes(d[8]); }
//     if (d[10]) { date.setSeconds(d[10]); }
//     if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
//     if (d[14]) {
//         offset = (Number(d[16]) * 60) + Number(d[17]);
//         offset *= ((d[15] == '-') ? 1 : -1);
//     }
//
//     offset -= date.getTimezoneOffset();
//     time = (Number(date) + (offset * 60 * 1000));
//     this.setTime(Number(time));
// }
//
// Date.prototype.toISO8601String = function (format, offset) {
//     /* accepted values for the format [1-6]:
//      1 Year:
//        YYYY (eg 1997)
//      2 Year and month:
//        YYYY-MM (eg 1997-07)
//      3 Complete date:
//        YYYY-MM-DD (eg 1997-07-16)
//      4 Complete date plus hours and minutes:
//        YYYY-MM-DDThh:mmTZD (eg 1997-07-16T19:20+01:00)
//      5 Complete date plus hours, minutes and seconds:
//        YYYY-MM-DDThh:mm:ssTZD (eg 1997-07-16T19:20:30+01:00)
//      6 Complete date plus hours, minutes, seconds and a decimal
//        fraction of a second
//        YYYY-MM-DDThh:mm:ss.sTZD (eg 1997-07-16T19:20:30.45+01:00)
//     */
//     if (!format) { var format = 6; }
//     if (!offset) {
//         var offset = 'Z';
//         var date = this;
//     } else {
//         var d = offset.match(/([-+])([0-9]{2}):([0-9]{2})/);
//         var offsetnum = (Number(d[2]) * 60) + Number(d[3]);
//         offsetnum *= ((d[1] == '-') ? -1 : 1);
//         var date = new Date(Number(Number(this) + (offsetnum * 60000)));
//     }
//
//     var zeropad = function (num) { return ((num < 10) ? '0' : '') + num; }
//
//     var str = "";
//     str += date.getUTCFullYear();
//     if (format > 1) { str += "-" + zeropad(date.getUTCMonth() + 1); }
//     if (format > 2) { str += "-" + zeropad(date.getUTCDate()); }
//     if (format > 3) {
//         str += "T" + zeropad(date.getUTCHours()) +
//                ":" + zeropad(date.getUTCMinutes());
//     }
//     if (format > 5) {
//         var secs = Number(date.getUTCSeconds() + "." +
//                    ((date.getUTCMilliseconds() < 100) ? '0' : '') +
//                    zeropad(date.getUTCMilliseconds()));
//         str += ":" + zeropad(secs);
//     } else if (format > 4) { str += ":" + zeropad(date.getUTCSeconds()); }
//
//     if (format > 3) { str += offset; }
//     return str;
// }
