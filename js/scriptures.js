const Scriptures = (function () {
    "use strict";

    // CONSTANTS
    const BOTTOM_PADDING = "<br /><br />";
    const CLASS_BOOKS = "books";
    const CLASS_BUTTON = "btn";
    const CLASS_CHAPTER = "chapter";
    // const CLASS_ICON = "material-icons";
    const CLASS_VOLUME = "volume";
    // const DIV_BREADCRUMBS = "crumbs";
    const DIV_SCRIPTURES_NAVIGATOR = "scripnav";
    const DIV_SCRIPTURES = 'scriptures';
    const INDEX_FLAG = 11;
    const INDEX_LATITUDE = 3;
    const INDEX_LONGITUDE = 4;
    const INDEX_PLACENAME = 2;
    const LAT_LNG_PARSER = /\((.*),'(.*)',(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),'(.*)'\)/;
    // const MAX_ZOOM_LEVEL = 18;
    // const MIN_ZOOM_LEVEL = 6;
    const REQUEST_GET = 'GET';
    const REQUEST_STATUS_OK = 200;
    const REQUEST_STATUS_ERROR = 400;
    const TAG_HEADERS = "h5";
    // const TAG_LIST_ITEM = "li";
    // const TAG_SPAN = "span";
    // const TAG_UNORDERED_LIST = "ul";
    // const TEXT_TOP_LEVEL = "The Scriptures";
    const URL_BASE = "https://scriptures.byu.edu/";
    const URL_BOOKS = `${URL_BASE}mapscrip/model/books.php`;
    const URL_SCRIPTURES = `${URL_BASE}mapscrip/mapgetscrip.php`;
    const URL_VOLUMES = `${URL_BASE}mapscrip/model/volumes.php`;
    // const ZOOM_RATIO = 450;


    // PRIVATE VARIABLES
    let books;
    let geoplaces = [];
    let gmMarkers = [];
    let requestedBookId;
    let requestedChapter;
    let requestedNextPrevious;
    let volumes;

    // PRIVATE METHOD DECLARATIONS
    let addGeoplace;
    let addMarker;
    let ajax;
    let bookChapterValid;
    let booksGrid;
    let booksGridContent;
    let chaptersGrid;
    let chaptersGridContent;
    let cacheBooks;
    let clearMarkers;
    let encodedScripturesUrlParameters;
    let geoplaceIndex;
    let getScripturesCallback;
    let getScripturesFailure;
    let htmlAnchor;
    let htmlDiv;
    let htmlElement;
    let htmlLink;
    let htmlListItem;
    let htmlListItemLink;
    let init;
    let injectBreadcrumbs;
    let mergePlacename;
    let navigateBook;
    let navigateChapter;
    let navigateHome;
    let nextChapter;
    let nextPreviousMarkup;
    let onHashChanged;
    let previousChapter;
    let setupMarkers;
    let showLocation;
    let testGeoPlaces;
    let titleForBookChapter;
    let volumesGridContent;
    let zoomMapToFitMarkers;



    // PRIVATE METHODS
    addGeoplace = function (placename, latitude, longitude) {
        let index = geoplaceIndex(latitude, longitude);

        if (index >= 0) {
            mergePlaceName(placename, index);
        } else {
            geoplaces.push({
                latitude,
                longitude,
                placename
            });
        }
    };

    addMarker = function (placename, latitude, longitude) {
        let marker = new google.maps.Marker({
            position: {lat: Number(latitude), lng: Number(longitude)},
            map,
            title: placename, 
            animation: google.maps.Animation.DROP
        })

        gmMarkers.push(marker);
    };

    ajax = function (url, successCallback, failureCallback, skipJsonParse) {
        let request = new XMLHttpRequest();
        request.open(REQUEST_GET, url, true);

        request.onload = function() {
            if (request.status >= REQUEST_STATUS_OK && request.status < REQUEST_STATUS_ERROR) {
                let data = (
                    skipJsonParse 
                    ? request.response 
                    : JSON.parse(request.response)
                    );

                if (typeof successCallback === 'function') {
                    successCallback(data);
                }
            } else {
                // We reached our target server, but it returned an error
                if (typeof failureCallback === 'function') {
                    failureCallback(request);
                }
            }
        };

        request.onerror = failureCallback 
        request.send();
    };

    bookChapterValid = function (bookId, chapter) {
        let book = books[bookId];

        if (book === undefined || chapter < 0 || chapter > book.numChapters) {
            return false;
        }
        if (chapter === 0 && book.numChapters > 0) {
            return false;
        }

        return true;
    };

    booksGrid = function (volume) {
        return htmlDiv({
            classKey: CLASS_BOOKS,
            content: booksGridContent(volume)
        });
    };

    booksGridContent = function (volume) {
        let gridContent = '';

        volume.books.forEach(function (book) {
            gridContent += htmlLink({
                classKey: CLASS_BUTTON,
                id: book.id,
                href: `#${volume.id}:${book.id}`,
                content: book.gridName
            });
        });

        return gridContent;
    };

    chaptersGrid = function (book) {
        return htmlDiv({
            classKey: CLASS_VOLUME,
            content: htmlElement(TAG_HEADERS, book.fullName)
        }) + htmlDiv({
            classKey: CLASS_BOOKS,
            content: chaptersGridContent(book)
        });
    };

    chaptersGridContent = function (book) {
        let gridContent = '';
        let chapter = 1;

        while (chapter <= book.numChapters) {
            gridContent += htmlLink({
                classKey: `${CLASS_BUTTON} ${CLASS_CHAPTER}`,
                id: chapter,
                href: `#0:${book.id}:${chapter}`,
                content: chapter
            });

            chapter += 1;
        }

        return gridContent;
    };

    cacheBooks = function (callback) {
        volumes.forEach(function (volume) {
            let volumeBooks = [];
            let bookId = volume.minBookId;

            while (bookId <= volume.maxBookId) {
                volumeBooks.push(books[bookId])
                bookId += 1;
            }

            volume.books = volumeBooks;
        });

        if (typeof callback === "function") {
            callback();
        }
    };
    
    clearMarkers = function () {
        gmMarkers.forEach(function (marker) {
            marker.setMap(null);
        });

        gmMarkers = [];
        geoplaces = [];
    };

    encodedScripturesUrlParameters = function (bookId, chapter, verses, isJst) {
        if (bookId !== undefined && chapter !== undefined) {
            let options = '';
 
            if (verses !== undefined) {
                options += verses;
            }
            if (isJst !== undefined) {
                options += "&jst=JST";
            }

            return `${URL_SCRIPTURES}?book=${bookId}&chap=${chapter}&verses${options}`;
        }
    };

    geoplaceIndex = function (latitude, longitude) {
        let i = geoplaces.length - 1;

        while (i >= 0) {
            const geoplace = geoplaces[i];

            // Note: here is the safe way to compare IEEE floating-point
            // numbers: compare their difference to a small number
            const latitudeDelta = Math.abs(geoplace.latitude - latitude);
            const longitudeDelta = Math.abs(geoplace.longitude - longitude);

            if (latitudeDelta < 0.00000001 && longitudeDelta < 0.00000001) {
                return i;
            }

            i -= 1;
        }

        return -1;
    };

    getScripturesCallback = function (chapterHtml) {
        document.getElementById(DIV_SCRIPTURES).innerHTML = chapterHtml;

        setupMarkers();
    };

    getScripturesFailure = function () {
        document.getElementById(DIV_SCRIPTURES).innerHTML = 'unable to retrieve chapter contents.';
    };

    htmlAnchor = function(volume) {
        return `<a name="v${volume.id}" />`;
    };

    htmlDiv = function (parameters) {
        let classString = "";
        let contentString = "";
        let idString = "";

        if (parameters.classKey !== undefined) {
            classString = ` class="${parameters.classKey}"`;
        }
        if (parameters.content !== undefined) {
            contentString = parameters.content;
        }
        if (parameters.id !== undefined) {
            idString = ` id="${parameters.id}"`;
        }

        return `<div${idString}${classString}>${contentString}</div>`;
    };

    htmlElement = function (tagName, content, classValue) {
        let classString = "";

        if (classValue !== undefined) {
            classString = ` class="${classValue}"`;
        }

        return `<${tagName}${classString}>${content}</${tagName}>`;
    };

    htmlLink = function (parameters) {
        let classString = '';
        let contentString = '';
        let hrefString = '';
        let idString = '';
        let titleString = "";
        
        if (parameters.classKey !== undefined) {
            classString = ` class="${parameters.classKey}"`;
        }
        if (parameters.content !== undefined) {
            contentString = parameters.content;
        }
        if (parameters.href !== undefined) {
            hrefString = ` href="${parameters.href}"`;
        }
        if (parameters.id !== undefined) {
            idString = ` id="${parameters.id}"`;
        }
        if (parameters.title !== undefined) {
            titleString = ` title="${parameters.title}"`;
        }

        return `<a${idString}${classString}${hrefString}>${contentString}</a>`;
    };

    
    init = function (callback) {
        let booksLoaded = false;
        let volumesLoaded = false;

        ajax(URL_BOOKS,
            data => {
                books = data;
                booksLoaded = true;

                if (volumesLoaded) {
                    cacheBooks(callback);
                }
            }
        );
        ajax(URL_VOLUMES,
            data => {
                volumes = data;
                volumesLoaded = true;

                if (booksLoaded) {
                    cacheBooks(callback);
                }
            }
        );
    };

    mergePlacename = function (placename, index) {
        let geoplace = geoplaces[index];

        if (!geoplace.placename.includes(placename)) {
            geoplace.placename += ", " + placename;
        }
    };

    navigateBook = function(bookId) {
        let book = books[bookId];

        if (book.numChapters <= 1) {
            navigateChapter(bookId, book.numChapters);
        } else {
            document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
                id: DIV_SCRIPTURES_NAVIGATOR,
                content: chaptersGrid(book)
            });
        }
    };

    navigateChapter = function(bookId, chapter) {
        ajax(encodedScripturesUrlParameters(bookId, chapter), getScripturesCallback, getScripturesFailure, true);
    };

    navigateHome = function(volumeId) {
        document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
            id: DIV_SCRIPTURES_NAVIGATOR,
            content: volumesGridContent(volumeId)
        });
    };


    nextChapter = function (bookId, chapter) {
        let book = books[bookId];

        if (book !== undefined) {
            if (chapter < book.numChapters) {
                return [
                    bookId, 
                    chapter + 1,
                    titleForBookChapter(book, chapter + 1)
                ];
            }

            let nextBook = books[bookId + 1];

            if (nextBook !== undefined) {
                let nextChapterValue = 0;

                if (nextBook.numChapters > 0) {
                    nextChapterValue = 1;
                }

                return [
                    nextBook.id,
                    nextChapterValue,
                    titleForBookChapter(nextBook, nextChapterValue)
                ];
            }
        }
    };

    onHashChanged = function () {
        let ids = [];
        
        if (location.hash !== '' && location.hash.length > 1) {
            ids = location.hash.slice(1).split(':');
        }

        if (ids.length <= 0) {
            navigateHome();
        } else if (ids.length === 1) {
            let volumeId = Number(ids[0]);

            if (volumeId < volumes[0].id || volumeId > volumes.slice(-1)[0].id) {
                navigateHome();
            } else {
                navigateHome(volumeId);
            }
        } else {
            let bookId = Number(ids[1]);

            if (books[bookId] === undefined) {
                navigateHome();
            } else {
                if (ids.length === 2) {
                    navigateBook(bookId);
                } else {
                    let chapter = Number(ids[2]);

                    if (bookChapterValid(bookId, chapter)) {
                        navigateChapter(bookId, chapter);
                    } else {
                        navigateHome();
                    }
                }
            }
        }
    };

    setupMarkers = function () {
        if (gmMarkers.length > 0) {
            clearMarkers();
        }

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
            }
        });
    };

    showLocation = function (id, placename, latitude, longitude, viewLatitude, viewLongitude, viewTilt, viewRoll, viewAltitude, viewHeading) {
        console.log(id, placename, latitude, longitude, viewLatitude, viewLongitude, viewTilt, viewRoll, viewAltitude, viewHeading);
    };

    titleForBookChapter = function (book, chapter) {
        if (book !== undefined) {
            if (chapter > 0) {
                return `${book.tocName} ${chapter}`
            }

            return book.tocName;
        }
    };

    volumesGridContent = function (volumeId) {
        let gridContent = '';

        volumes.forEach(function (volume) {
            if (volumeId === undefined || volumeId === volume.id) {
                gridContent += htmlDiv({
                    classKey: CLASS_VOLUME,
                    content: htmlAnchor(volume) + htmlElement(TAG_HEADERS, volume.fullName)
                });

                gridContent += booksGrid(volume);
            }
        });

        return gridContent + BOTTOM_PADDING;
    };


    // PUBLIC API

    return {
        init,
        onHashChanged,
        showLocation,
        testGeoPlaces
    };
}());