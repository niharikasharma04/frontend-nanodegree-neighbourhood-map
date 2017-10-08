var map;
var myInfoWindow;
var restaurants = [];
var markers = [];



function initMap() {

    var canvas = document.getElementById('map'),
        latlng1 = new google.maps.LatLng(40.7320, -73.9961),
        mapOptions = {
            zoom: 10,
            center: latlng1
        };
    console.log("in initmap,map=" + map);
    self.map = new google.maps.Map(canvas, mapOptions);
    myInfoWindow = new google.maps.InfoWindow();
    var selectedIcon = new changeMarkerColor('2caae1');
    console.log("in init map");
    for (var i = 0; i < restaurants.length; i++) {
        var title = restaurants[i].name;
        var latlng = new google.maps.LatLng(
            parseFloat(restaurants[i].location.latitude),
            parseFloat(restaurants[i].location.longitude));
        console.log("initmap,latlng=" + latlng);
        var marker = new google.maps.Marker({
            position: latlng,
            title: title,
            animation: google.maps.Animation.DROP,
            id: i
        });

        markers.push(marker);
        marker.addListener('mouseover', changeMarker);
        marker.addListener('click', populateWindow);
        marker.addListener('mouseout', function() {
            this.setIcon(null);
        });
    }

    function changeMarker() {
        this.setIcon(selectedIcon);
    }

    function populateWindow() {
        populateInfoWindow(this, myInfoWindow);
    }
    showMarkers();
}

function showMarkers() {
    var mapBounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        mapBounds.extend(markers[i].position);
    }
    map.fitBounds(mapBounds);
    console.log("in showmarksers");
}

function changeMarkerColor(markerColor) {
    var marker = new google.maps.MarkerImage('http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' +
        markerColor + '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return marker;
}
/*populateInfoWindow would fillup details about a particular restaurant, into
 ** a window when that particular restaurant's marker is clicked. The window is then 
 ** displayed with a picture and restaurant's name and location.
 */
function populateInfoWindow(marker, myInfoWindow) {
    console.log("in popinfowindow");
    animateMarker(marker);
    if (myInfoWindow.marker != marker) {
        myInfoWindow.marker = marker;
        var content = '<div class="InfoWindow"><div><center><h5>' + marker.title + '</center></h5>';
        content += restaurants[marker.id].location.address + '</div><div><img class= "infoImage" src="';
        content += restaurants[marker.id].image + '"></div></div>';
        myInfoWindow.setContent(content);
        myInfoWindow.open(map, marker);
        myInfoWindow.addListener('closeclick', function() {
            myInfoWindow.marker = null;
        });
    }
}

function selectMarker(value) {
    console.log("in selectMarker");
    if (myInfoWindow.marker != value.location) {
        for (var i = 0; i < markers.length; i++) {
            if (markers[i].title == value.name) {
                populateInfoWindow(markers[i], myInfoWindow);
                break;
            }
        }
    }
}

function animateMarker(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(null);
    }, 700);
}
/*fetchRestaurants would call third party Zomato's API and fetch trending restaurants in NYC.
 ** It would get the restaurant's location,name and featured image data.
 ** Query to the API contains entity_id which should be 280 for NYC, and collection_id
 ** whose value 1 specifies that we want "trending this week" restaurants data.
 */
function fetchRestaurants() {
    console.log("get rest");
    $.ajax({
        url: 'https://developers.zomato.com/api/v2.1/search?',
        headers: {
            'Accept': 'application/json',
            'user-key': '540d2b8eb4d92de1483434dd1a303c7c'
        },
        data: 'entity_id=280&entity_type=city&collection_id = 1&count=20&lat=40.7420&lon=-74.0048&radius=4000&sort=rating&order=desc',
        async: true
    }).done(function(data) {
        console.log("data=" + data);
        console.log("length=" + data.restaurants.length);
        for (var i = 0; i < data.restaurants.length; i++) {
            var restaurant = [];
            restaurant.id = data.restaurants[i].restaurant.id;
            restaurant.location = data.restaurants[i].restaurant.location;
            console.log("location=" + data.restaurants[i].restaurant.location.latitude);
            restaurant.name = data.restaurants[i].restaurant.name;
            console.log("name=" + data.restaurants[i].restaurant.name);
            restaurant.url = data.restaurants[i].restaurant.url;
            restaurant.image = data.restaurants[i].restaurant.featured_image;
            restaurants.push(restaurant);
        }
        viewModel.init();
        initMap();
    }).fail(function() {
        alert("Error in fetchig restaurants");
    });

}

function googleError() {
    alert("Error in Loading Map");
}
var viewModel = {
    query: ko.observable(''),
    list: ko.observableArray([]),
    error: ko.observable(''),
    init: function(query) {
        console.log("in viewmodel init");
        for (var l = 0; l < restaurants.length; l++) {
            viewModel.list.push(restaurants[l]);
        }
    },
    searchFunction: function(query) {
        viewModel.list.removeAll();
        for (var x = 0; x < markers.length; x++) {
            markers[x].setVisible(false);
        }
        for (var l in restaurants) {
            if (restaurants[l].name.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
                viewModel.list.push(restaurants[l]);
                var latlng = new google.maps.LatLng(
                    parseFloat(restaurants[l].location.latitude),
                    parseFloat(restaurants[l].location.longitude));
                console.log("restlatlng=" + restaurants[l].location.latitude);
                var marker = latlng;
                console.log("end-marker=" + marker);

                for (var i = 0; i < markers.length; i++) {
                    if (markers[i].position.lat().toFixed(5) == marker.lat().toFixed(5) &&
                        markers[i].position.lng().toFixed(5) == marker.lng().toFixed(5)) {
                        markers[i].setVisible(true);
                    }
                }
            }
        }
    }
};
viewModel.query.subscribe(viewModel.searchFunction);
ko.applyBindings(viewModel);