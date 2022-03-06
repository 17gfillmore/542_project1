
const INDEX_FLAG = 11;
const INDEX_LATITUDE = 3;
const INDEX_LONGITUDE = 4;
const INDEX_PLACENAME = 2;
const LAT_LNG_PARSER = /\((.*),'(.*)',(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),'(.*)'\)/;

let gmMarkers = [];

const addMarker = function (placename, latitude, longitude) {
    let marker = new google.maps.Marker({
        position: {lat: Number(latitude), lng: Number(longitude)},
        map,
        title: placename, 
        label: placename,
        animation: google.maps.Animation.DROP
    })

    gmMarkers.push(marker);
};

const clearMarkers = function () {
    gmMarkers.forEach(function (marker) {
        marker.setMap(null);
    });

    gmMarkers = [];
};

const initMap = function() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 31.7683, lng: 35.2137 },
        zoom: 8,
        mapTypeId: 'terrain'

    });
}

const setupMarkers = function () {
    if (gmMarkers.length > 0) {
        clearMarkers();
    }
    let bounds = new google.maps.LatLngBounds();

    document.querySelectorAll("a[onclick^=\"showLocation(\"]").forEach(function (element) {
        let matches = LAT_LNG_PARSER.exec(element.getAttribute("onclick"));

        if (matches) {
            let placename = matches[INDEX_PLACENAME];
            let latitude = matches[INDEX_LATITUDE];
            let longitude = matches[INDEX_LONGITUDE];
            let flag = matches[INDEX_FLAG];

            if (flag !== '') {
                placename = `${placename} ${flag}`;

            }
            addMarker(placename, latitude, longitude);
            bounds.extend({lat: Number(latitude), lng: Number(longitude)});
        }
    });

    // if there are any markers, zoom and center the map appropriately; else, show default Jerusalem view
    gmMarkers.length ? map.fitBounds(bounds) : initMap()
};

const showLocation = function (id, placename, latitude, longitude, viewLatitude, viewLongitude, viewTilt, viewRoll, viewAltitude, viewHeading) {
    map.panTo({lat: latitude, lng: longitude});
    map.setZoom(Math.round(viewAltitude / 500));
};

export { addMarker, clearMarkers, initMap, setupMarkers, showLocation }