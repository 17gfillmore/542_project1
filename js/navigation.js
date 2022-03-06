import { setupMarkers } from "./mapHelper.js";
import { htmlDiv, htmlAnchor, htmlElement, htmlLink } from "./htmlHelper.js";
import { ajax, books, volumes, encodedScripturesUrlParameters } from "./mapScripApi.js"

// CONSTANTS -----------------------------------------------
const BOTTOM_PADDING = "<br /><br />";
const BOOKID_SKIPS_PREV = {201: '166', 301: '219', 401: '303'}
const CLASS_BOOKS = "books";
const CLASS_BUTTON = "btn";
const CLASS_CHAPTER = "chapter";
const CLASS_VOLUME = "volume";
const CRUMB_SPACER = '>';
const DIV_PREVNEXT = 'prevnext';
const DIV_BREADCRUMBS = 'breadcrumbs';
const DIV_SCRIPTURES_NAVIGATOR = "scripnav";
const DIV_SCRIPTURES = 'scriptures';
const TAG_HEADERS = "h5";


const bookChapterValid = function (bookId, chapter) {
    let book = books[bookId];

    if (book === undefined || chapter < 0 || chapter > book.numChapters) {
        return false;
    }
    if (chapter === 0 && book.numChapters > 0) {
        return false;
    }

    return true;
};

const booksGrid = function (volume) {
    return htmlDiv({
        classKey: CLASS_BOOKS,
        content: booksGridContent(volume)
    });
};

const booksGridContent = function (volume) {
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

const chaptersGrid = function (book) {
    return htmlDiv({
        classKey: CLASS_VOLUME,
        content: htmlElement(TAG_HEADERS, book.fullName)
    }) + htmlDiv({
        classKey: CLASS_BOOKS,
        content: chaptersGridContent(book)
    });
};

const chaptersGridContent = function (book) {
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

const getScripturesCallback = function (chapterHtml) {
    document.getElementById(DIV_SCRIPTURES).innerHTML = chapterHtml;
    setupMarkers();
};

const getScripturesFailure = function () {
    document.getElementById(DIV_SCRIPTURES).innerHTML = 'unable to retrieve chapter contents.';
};

const navigateBook = function(bookId) {
    let book = books[bookId];

    document.getElementById(DIV_PREVNEXT).innerHTML = '';
    setBreadcrumbs(book.parentBookId, bookId)

    if (book.numChapters <= 1) { // go straight to the text
        navigateChapter(bookId, book.numChapters);
    } else {        // when navigating to the chapter links view
        document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
            id: DIV_SCRIPTURES_NAVIGATOR,
            content: chaptersGrid(book)
        });
    }
};

const navigateChapter = function(bookId, chapter) {
    setBreadcrumbs(books[bookId].parentBookId, bookId, chapter)
    setPrevNext(bookId, chapter);

    // TODO? update this to use new api (fetch) instead of ajax
    ajax(encodedScripturesUrlParameters(bookId, chapter), getScripturesCallback, getScripturesFailure, true);
};

const navigateHome = function(volumeId) {
    volumeId 
        ? setBreadcrumbs(volumeId)
        : setBreadcrumbs();
    document.getElementById(DIV_PREVNEXT).innerHTML = '';
    document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
        id: DIV_SCRIPTURES_NAVIGATOR,
        content: volumesGridContent(volumeId)
    });
    setupMarkers();
};

const onHashChanged = function () {
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

const setBreadcrumbs = function (volumeId, bookId, chapter) {
    // the way this is set up assumes that it's only called with parameters for which breadcrumbs are needed.
    // if you haven't navigated to a book, don't pass a book in. etc

    let crumbs = '';
    if (volumeId) {
        crumbs = htmlLink({
            classKey: "crumb1",
            id: "home",
            content: "home",
            href: "#"
        })
        crumbs += CRUMB_SPACER + htmlLink({
            classKey: 'crumb2',
            id: "volume",
            content: `${volumes[volumeId - 1].fullName}`, // volumeId - 1 because the id is inside the array items, and I didn't want to search because they are ordered
            ...(bookId) && {href: `#${volumeId}`} // only make the crumb a clickable link if we've navigated past it (e.g. are looking at a book)
        })
    }
    if (bookId) {
        crumbs += CRUMB_SPACER + htmlLink({
            classKey: 'crumb2',
            id: 'book',
            content: `${books[bookId].fullName}`,
            ...(chapter) && {href: `#${volumeId}:${bookId}`}
        })
    }
    if (chapter) {
        crumbs += CRUMB_SPACER + htmlLink({
            classKey: 'crumb2',
            content: `${titleForBookChapter(books[bookId], chapter)}`
        })
    }

    document.getElementById(DIV_BREADCRUMBS).innerHTML = crumbs;
}

const setPrevNext = function (bookId, chapter) {
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

const titleForBookChapter = function (book, chapter) {
    if (book !== undefined) {
        if (chapter > 0) {
            return `${book.tocName} ${chapter}`
        }

        return book.tocName;
    }
};

const volumesGridContent = function (volumeId) {
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

export { bookChapterValid, booksGrid, booksGridContent, chaptersGrid, chaptersGridContent, encodedScripturesUrlParameters,
    navigateBook, navigateChapter, navigateHome, onHashChanged, setBreadcrumbs, setPrevNext, titleForBookChapter, volumesGridContent }