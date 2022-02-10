const Scriptures = (function () {
    "use strict";

    // CONSTANTS -----------------------------------------------
    const BOTTOM_PADDING = "<br /><br />";
    const BOOKID_SKIPS_PREV = {201: '166', 301: '219', 401: '303'}
    const CLASS_BOOKS = "books";
    const CLASS_BUTTON = "btn";
    const CLASS_CHAPTER = "chapter";
    const CLASS_VOLUME = "volume";
    const DIV_PREVNEXT = 'prevnext';
    const DIV_BREADCRUMBS = 'breadcrumbs';
    const DIV_SCRIPTURES_NAVIGATOR = "scripnav";
    const DIV_SCRIPTURES = 'scriptures';
    const INDEX_FLAG = 11;
    const INDEX_LATITUDE = 3;
    const INDEX_LONGITUDE = 4;
    const INDEX_PLACENAME = 2;
    const LAT_LNG_PARSER = /\((.*),'(.*)',(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),'(.*)'\)/;
    const REQUEST_GET = 'GET';
    const REQUEST_STATUS_OK = 200;
    const REQUEST_STATUS_ERROR = 400;
    const TAG_HEADERS = "h5";
    const URL_BASE = "https://scriptures.byu.edu/";
    const URL_BOOKS = `${URL_BASE}mapscrip/model/books.php`;
    const URL_SCRIPTURES = `${URL_BASE}mapscrip/mapgetscrip.php`;
    const URL_VOLUMES = `${URL_BASE}mapscrip/model/volumes.php`;


    // PRIVATE VARIABLES --------------------------------------
    let books;
    let gmMarkers = [];
    let volumes;

    // PRIVATE METHOD DECLARATIONS -----------------------------
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
    let getScripturesCallback;
    let getScripturesFailure;
    let htmlAnchor;
    let htmlDiv;
    let htmlElement;
    let htmlLink;
    let init;
    let initMap;
    let navigateBook;
    let navigateChapter;
    let navigateHome;
    let onHashChanged;
    let setPrevNext;
    let setupMarkers;
    let showLocation;
    let titleForBookChapter;
    let volumesGridContent;

    // PRIVATE METHODS ----------------------------------------

    addMarker = function (placename, latitude, longitude) {
        let marker = new google.maps.Marker({
            position: {lat: Number(latitude), lng: Number(longitude)},
            map,
            title: placename, 
            label: placename,
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
    
    clearMarkers = function () {
        gmMarkers.forEach(function (marker) {
            marker.setMap(null);
        });

        gmMarkers = [];
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

    getScripturesCallback = function (chapterHtml) {
        // document.getElementById(DIV_NAVBAR).innerHTML = '<div></div>';
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

    initMap = function() {
        map = new google.maps.Map(document.getElementById("map"), {
            center: { lat: 31.7683, lng: 35.2137 },
            zoom: 8,
        });
    }

    navigateBook = function(bookId) {
        let book = books[bookId];

        document.getElementById(DIV_PREVNEXT).innerHTML = '';

        if (book.numChapters <= 1) { // go straight to the text
            navigateChapter(bookId, book.numChapters);
        } else {        // when navigating to the chapter links view
            document.getElementById(DIV_BREADCRUMBS).innerHTML = htmlLink({
                classKey: "crumb1",
                id: "home",
                content: "home",
                href: "#"
            }) + '<' + htmlLink({
                classKey: 'crumb2',
                content: `${book.fullName}`
            })
            
            document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
                id: DIV_SCRIPTURES_NAVIGATOR,
                content: chaptersGrid(book)
            });
        }
    };

    navigateChapter = function(bookId, chapter) {
        document.getElementById(DIV_BREADCRUMBS).innerHTML = htmlLink({
            classKey: "crumb1",
            id: "home",
            content: 'home',
            href: "#"
        }) + '<' + htmlLink({
            classKey: "crumb2",
            id: "book",
            content: `${books[bookId].fullName}`,
            href: `#${books[bookId].parentBookId}:${bookId}`
        }) + '<' + htmlLink({
            classKey: 'crumb2',
            content: `${chapter}`
        })
        setPrevNext(bookId, chapter);
        ajax(encodedScripturesUrlParameters(bookId, chapter), getScripturesCallback, getScripturesFailure, true);
    };

    navigateHome = function(volumeId) {
        document.getElementById(DIV_BREADCRUMBS).innerHTML = '';
        document.getElementById(DIV_PREVNEXT).innerHTML = '';
        document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
            id: DIV_SCRIPTURES_NAVIGATOR,
            content: volumesGridContent(volumeId)
        });
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

    setPrevNext = function (bookId, chapter) {
        let next = ''
        let prev = ''
        
        let book = books[bookId];
        let nextBook = books[bookId + 1];
        if (bookChapterValid(bookId, chapter + 1)) { 
            // just go to the next chapter
            next = `#${book.parentBookId}:${bookId}:${chapter + 1}`;
        } else {
            // if the next book doesn't exist at incremented id, it's a new volume
            if (nextBook === undefined) {
                nextBook = books[`${book.parentBookId}01`]
            }
            // next book, chap1 (unless there are 0 chapters in next book)                                         
            next = `#${nextBook.parentBookId}:${nextBook.id}:${nextBook.numChapters === 0 ? 0 : 1}`
        }

        let prevBook = books[bookId - 1]
        if (bookChapterValid(bookId, chapter - 1)) {
            // just go to the prev chapter
            prev = `#${book.parentBookId}:${bookId}:${chapter - 1}`;
        } else {
            // if incremented id isn't a book, look up the last book id in the prev volume
            if (prevBook === undefined) {
                // dict lookup of last bookId of prev volume
                prevBook = books[BOOKID_SKIPS_PREV[book.id]]
            }
            // prev book, numChapters (last chapter)                                        
            prev = `#${prevBook.parentBookId}:${prevBook.id}:${prevBook.numChapters}`
        }

        document.getElementById(DIV_PREVNEXT).innerHTML = 
        htmlLink({
            classKey: "",
            id: "prev",
            content: "< prev",
            href: `${prev}`
        }) + htmlLink({
            classString: "",
            id: "next",
            content: "next >",
            href: `${next}`
        });
    }

    setupMarkers = function () {
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

    showLocation = function (id, placename, latitude, longitude, viewLatitude, viewLongitude, viewTilt, viewRoll, viewAltitude, viewHeading) {
        console.log(id, placename, latitude, longitude, viewLatitude, viewLongitude, viewTilt, viewRoll, viewAltitude, viewHeading);
        // zoom in on point selected, center map on it
        map.panTo({lat: latitude, lng: longitude});
        map.setZoom(Math.round(viewAltitude / 500));
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


    // PUBLIC API -------------------------------------------

    return {
        init,
        onHashChanged,
        showLocation
    };
}());