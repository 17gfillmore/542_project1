const REQUEST_GET = 'GET';
const REQUEST_STATUS_OK = 200;
const REQUEST_STATUS_ERROR = 400;
const URL_BASE = "https://scriptures.byu.edu/";
const URL_BOOKS = `${URL_BASE}mapscrip/model/books.php`;
const URL_SCRIPTURES = `${URL_BASE}mapscrip/mapgetscrip.php`;
const URL_VOLUMES = `${URL_BASE}mapscrip/model/volumes.php`;

let books;
let volumes;

const ajax = function (url, successCallback, failureCallback, skipJsonParse, animationType) {
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
                successCallback(data, animationType);
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

const cacheBooks = function (callback) {
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

const encodedScripturesUrlParameters = function (bookId, chapter, verses, isJst) {
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

const getData = function (url, successCallback, failureCallback, skipJsonParse) {
    fetch(url).then(function (response) {
        if (response.ok) {
            if (skipJsonParse) {
                return response.text();
            } else {
                return response.json();
            }
        }
        throw new Error("Network response was not okay");
    }).then(function (data) {
        if (typeof successCallback === 'function') {
            successCallback(data);
        } else {
            throw new Error("Callback is not a valid function")
        }
    }).catch(function (error) {
        console.log("Error:", error.message);

        if (typeof failureCallback === 'function') {
            failureCallback(error)
        }
    })
};

const getJson = function (url) {
    return fetch(url).then(function (response) {
        if (response.ok) {
            return response.json();
        }
        throw new Error("Network response was not okay")
    })
};

const init = function (callback) {
    Promise.all([getJson(URL_BOOKS), getJson(URL_VOLUMES)]).then(jsonResults => {
        let [ booksResult, volumesResult ] = jsonResults;

        books = booksResult;
        volumes = volumesResult;

        cacheBooks(callback)
    }).catch(error => {
        console.log("Unable to get volumes/books data;", error.message);
    });

    // let booksLoaded = false;
    // let volumesLoaded = false;

    // getData(URL_BOOKS,
    //     data => {
    //         books = data;
    //         booksLoaded = true;

    //         if (volumesLoaded) {
    //             cacheBooks(callback);
    //         }
    //     }
    // );
    // getData(URL_VOLUMES,
    //     data => {
    //         volumes = data;
    //         volumesLoaded = true;

    //         if (booksLoaded) {
    //             cacheBooks(callback);
    //         }
    //     }
    // );
};

const mapScripApi = {
    init
};

export { ajax, books, volumes, encodedScripturesUrlParameters };
export default Object.freeze(mapScripApi);