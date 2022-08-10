// const url = 'http://localhost:5500';

const model = {}

model.origin = new URL( window.location.href ).origin;

model.colors = {
    default: '#101010',
    verified: '#339933',
    bookmarked: '#FF9900',
    delete: '#CC0000'
}

model.html = ( ( document ) => {

    const entries = document.getElementById( 'entries' );

    const filterLabel = document.querySelector( '#filterLabel' );
    const filterButtons = {
        all: document.getElementById( 'filterButton-all' ),
        unlabelled: document.getElementById( 'filterButton-unlabelled' ),
        verified: document.getElementById( 'filterButton-verified' ),
        bookmarked: document.getElementById( 'filterButton-bookmarked' ),
    }

    return {
        entries: entries,
        filterLabel: filterLabel,
        filterButtons: filterButtons
    }

} )( document );

Object.keys( model.html.filterButtons ).forEach( ( e ) => model.html.filterButtons[ e ].onclick = onFilterButton );
document.onclick = onDocumentClicked;


showEntries( await requestEntries( 'all' ), model.html.entries );

async function requestEntries( filter ) {

    // Inital GET HTTP request
    const response = await fetch( origin + '/textStream/json/' + filter );

    // Request returns a ReadableStream, so use helper method to turn to JSON.
    const entries = await response.json();

    console.log( { entriesReceived: entries } )

    return entries;

}

async function showEntries( entries, parent ) {

    if ( entries.length == 0 ) {

        const div = document.createElement( 'div' );
        div.className = 'entry';

        div.innerHTML = `<div class="entryBody"><p>Nothing here but us chickens!</p></div>`;
        parent.appendChild( div );

    }

    entries.forEach( ( entry, index ) => {

        const entryDiv = document.createElement( 'div' );
        entryDiv.className = 'entry';
        entryDiv.id = entry.id;

        entryDiv.innerHTML = `
        <div class="entryHeader">
            <div class="entryHeaderLeft">
                <p>${entry.name}</p>
                <p>${entry.email}</p>
            </div>
            <div class="entryHeaderRight">
                <p>#${entry.id}</p>
            </div>
        </div>
        <div class="entryBody">
            <p>${entry.input}</p>
        </div>
        <div class="entryFooter">
            <button type="button" class="clickable entryFooterButton footerButton-verify" onclick="onFooterButton()">
                <img class="icon" src="./assets/verify.svg">
            </button>
            <button type="button" class="clickable entryFooterButton footerButton-bookmark" onclick="onFooterButton()">
                <img class="icon" src="./assets/bookmark.svg">
            </button>
            <button type="button" class="clickable entryFooterButton footerButton-delete" data-warning="false" onclick="onFooterButton()">
                <img class="icon" src="./assets/x.svg">
            </button>
        </div>
        `

        // Iterate through footer buttons.
        Array.from( entryDiv.lastElementChild.children ).forEach( ( button ) => {

            const action = button.className.replace( 'clickable entryFooterButton footerButton-', '' );

            if ( action == 'verify' && !!entry.verified ) {
                button.style[ 'background-color' ] = model.colors.verified;
            }
            if ( action == 'bookmark' && !!entry.bookmarked ) {
                button.style[ 'background-color' ] = model.colors.bookmarked;
            }
            button.onclick = onFooterButton;
        } );

        parent.appendChild( entryDiv );
        parent.appendChild( document.createElement( 'hr' ) );

    } )

}

function onDocumentClicked( event ) {

    // Since icon has z-index higher than parent button, get parent if clicked element is an image.
    const target = event.target.localName == 'img' ? event.target.parentElement : event.target;

    if ( target.className.includes( 'footerButton-delete' ) ) return;

    Array.from( document.getElementsByTagName( 'button' ) ).forEach( ( e ) => {
        if ( e.dataset.warning == 'true' ) {
            console.log( { button: e, warning: e.dataset.warning } )
            e.dataset.warning = 'false';
            e.style.borderColor = 'white';
            e.firstElementChild.hidden = false;
            e.lastElementChild.remove();
        }
    } )
}

async function onFilterButton( event ) {

    // Remove existing entries.
    model.html.entries.innerHTML = '';

    // Find filter name
    const filter = event.target.id.replace( 'filterButton-', '' );


    model.html.filterLabel.innerText = event.target.innerText;

    showEntries( await requestEntries( filter ), model.html.entries );

}

function onFooterButton( event ) {

    // Since icon has z-index higher than parent button, get parent if clicked element is an image.
    const target = event.target.localName == 'button' ? event.target : event.target.parentElement;

    //  JSON gymnastics to get ID of entry element
    const id = target.parentElement.parentElement.id;

    const action = target.className.replace( 'clickable entryFooterButton footerButton-', '' );

    // Changes button message to warn user of deleting. Reversed in onDocumentClicked().
    if ( action == 'delete' && target.dataset.warning == 'false' ) {

        target.dataset.warning = 'true';
        target.firstElementChild.hidden = true;
        const warningElement = document.createElement( 'div' );
        warningElement.innerHTML = 'Delete entry?'
        target.appendChild( warningElement );
        target.style.borderColor = model.colors.delete;
        return;

    }

    const packet = {
        id: id,
        action: action
    }

    console.log( `[HTTP]: POST request for { id: ${packet.id}, action: ${packet.action} }` );

    fetch( model.origin + '/textStream/curate', {
        method: 'POST', // or 'PUT',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify( packet ),
    } )
        .then( ( response ) => response.json() )
        .then( ( data ) => {
            console.log( 'Success:', data );
            if ( data.message == 'ok' ) {

                if ( action == 'delete' ) {
                    target.parentElement.parentElement.nextSibling.remove();
                    target.parentElement.parentElement.remove();
                    return;
                }

                let color = model.colors.default;

                target.style[ 'background-color' ] =
                    !data.state ?
                        model.colors.default :
                        action == 'verify' ?
                            model.colors.verified :
                            model.colors.bookmarked
            }
        } )
        .catch( ( error ) => {
            console.error( 'Error:', error );
        } );

}