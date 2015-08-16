var map = null;
var geocoder = null;
var xmlhttp = null;
var pos = null;
var xmlFile = "data.xml";
var infowindow;
// source: http://stackoverflow.com/questions/1875596/have-just-one-infowindow-open-in-google-maps-api-v3
// https://developers.google.com/maps/articles/geolocation
var initialLocation;
var browserSupportFlag = new Boolean();

if (window.XMLHttpRequest) {
	xmlhttp = new XMLHttpRequest();
} else if (window.ActiveXObject) {
	xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
}

function displayMap() {
	
	var time = document.getElementById("time").value;
	var mapOptions = {
		zoom: 14,
		mapTypeControl: true,
		scaleControl: true,
		// first centre map on Paris
		center: new google.maps.LatLng(48.856614, 2.3522219)
	};

	map = new google.maps.Map(document.getElementById("map"), mapOptions);
	var infoWindow = new google.maps.InfoWindow();//this had {map;map in it}
	infowindow = new google.maps.InfoWindow();
	if (navigator.geolocation) {
		browserSupportFlag = true;
		navigator.geolocation.getCurrentPosition(function(position) {
		pos = {
			lat: position.coords.latitude,
			lng: position.coords.longitude
		};

		pos = { 

		lat: 40.7903,
		lng: -73.9597

		};

		currentLocMarker(pos);
		//infoWindow.setPosition(pos);
		//infoWindow.setContent("YOU ARE HERE.");
		map.setCenter(pos);

		var category = document.getElementById("category").value;

		if (time < 30) {
			var request = {
				location: pos,
				radius: 83.33*time,
				types: [category]
			};
			var service = new google.maps.places.PlacesService(map);
			service.nearbySearch(request, callback);
		} else {
		
		var request = {
			location: pos,
			radius: 83.33*time,
			query: category
		};

		var service = new google.maps.places.PlacesService(map);
		service.textSearch(request, callback);
		}

		
		}, function() {
			handleLocationError(true, infoWindow, map.getCenter());
		});
		

	} else {
		// Browser doesn't support Geolocation
		handleLocationError(false, infoWindow, map.getCenter());
	}

	document.getElementById("map").innerHTML = map;
	//placeMarkers();

}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
	infoWindow.setPosition(pos);
	infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
		'Error: Your browser doesn\'t support geolocation.');
}

function callback(results, status) {
	//alert(results.length);
	//createMarker(results[0]);
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      //createMarker(results[i]);
      //alert(results[i].name);
	  if (results[i].opening_hours.open_now) {
     createMarker(results[i]);
	  }
    }
  }
}

function currentLocMarker(loc) {
	var marker = new google.maps.Marker({
		map: map,
		position: loc,
		icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
	});
}

function createMarker(place) {
  var placeLoc = place.geometry.location;
  var photoUrl = "";
  if (place.photos) {
	  photoUrl = "<img class='placeimg' src='" + place.photos[0].getUrl({'maxWidth': 100, 'maxHeight': 100}) + "'></img>";
  }
  var data = "<div class='infowindow'><span class='placename'>" + place.name + "</span><br />"
  + "<span id = 'rating'>Rating: " + place.rating + "</span><br />" + photoUrl + "<br /><a class='direction' href='https://www.google.com/maps/dir/Current+Location/" + placeLoc 
  + "'>Get Me There!</a></div>";
 
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(data);
    infowindow.open(map, this);
    	//bindInfoWindow(marker, map, infowindow,place.name); 

  });
}

function getDistance(p1, p2){
  return (google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1000).toFixed(2);
}

function addMarker() {
	var address = document.getElementById("address").value;
	// https://developers.google.com/maps/documentation/javascript/examples/geocoding-simple
	geocoder = new google.maps.Geocoder();
	geocoder.geocode({"address": address}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			map.setCenter(results[0].geometry.location);
			map.setZoom(12);
			createMarker(results[0].geometry.location, address);
			saveMarker(results[0].geometry.location, address);
		} else {
			alert(address + " not found");
		}
	});
}

function placeMarkers() {
	downloadUrl(xmlFile, function(data) {
		var xml = data.responseXML;
		var markers = xml.documentElement.getElementsByTagName("marker");
		for (var i = 0; i < markers.length; i++) {
			var address = markers[i].getAttribute("address");
			var point = new google.maps.LatLng(
				parseFloat(markers[i].getAttribute("lat")),
				parseFloat(markers[i].getAttribute("lng")));
			map.setCenter(point);
			map.setZoom(12);
			createMarker(point, address);
		}
	});
}

/*function createMarker(point, address) {  
	var marker = new google.maps.Marker({
		map: map,
		position: point,
		title: address
	});
	// source: http://stackoverflow.com/questions/9475830/google-maps-api-v3-markers-all-share-the-same-infowindow
	bindInfoWindow(marker, map, infoWindow, address); 
}*/

function saveMarker(point, address) {
	var lat = point.lat();
	var lng = point.lng();
	var url = "saveMarkers.php?lat=" + lat + "&lng=" + lng + "&address=" + address;
	if (xmlhttp.overrideMimeType) {
		xmlhttp.overrideMimeType("text/xml");
	}
	xmlhttp.open("GET", url, true); 
	xmlhttp.onreadystatechange = getConfirm;  //no response required 
	//xmlhttp.setRequestHeader("Content-Type", "text/xml" );
	xmlhttp.send(null);
}

function getConfirm() {
	if ((xmlhttp.readyState == 4) &&(xmlhttp.status == 200))
    {
        var markerAddConfirm = xmlhttp.responseText;
		var spantag = document.getElementById("markerConfirm");
        spantag.innerHTML = markerAddConfirm;
    }
}

// source: http://www.creare.co.uk/loading-google-map-markers-via-xml
function downloadUrl(xmlFile, callback) {
	xmlhttp.open("GET", xmlFile, true); 
	xmlhttp.onreadystatechange = function()	{
		if (xmlhttp.readyState == 4) {
			callback(xmlhttp);
		}
	};
	xmlhttp.send(null); 
}

function bindInfoWindow(marker, map, infoWindow, html) {
	google.maps.event.addListener(marker, "click", function() {
        infoWindow.setContent(html);
        infoWindow.open(map, marker);
    });
}