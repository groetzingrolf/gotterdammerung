var SG_KEY = "NjkwMjR8MTM3MjM2MjU1OA";

var loc = null;
var type = "all";
var search_date = new Date();

function seatgeek_data (data) {
    if (!data || !data.meta || !data.meta.geolocation) {
        alert("SG API issue.")
    }
    loc = data.meta.geolocation;
    $("#filter-location").text(loc.display_name);
    $("#location").show();
}

function init () {
	$('.overlay').hover(function() {
		$(this).animate({ opacity: 0.17 });
	}, function() {
		$(this).animate({ opacity: 0 });
	});

    var d = search_date.getFullYear() + "-" + search_date.getMonth() + "-" + search_date.getDate();
    alert(d);
    var url = "http://api.seatgeek.com/2/events?datetime_local=" + d + "&geoip=true&client_id=" + SG_KEY;
    $.ajax({
        url: url,
        dataType: 'jsonp',
        jsonp: 'callback',
        jsonpCallback: "seatgeek_data"
      });
}

$(init);
