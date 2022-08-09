// const url = 'http://localhost:5500';

const url = new URL( window.location.href );
const origin = url.origin;

const model = {}

model.html = ( ( document ) => {

    const entries = document.getElementById( 'entries' );

    return {
        entries: entries
    }

})( document );

// GET HTTP request
const response = await fetch( origin + '/textStream/json/all' );

// Request returns a ReadableStream, so use helper method to turn to JSON.
const entries = await response.json();

console.log( {
    response: response,
    entries: entries,
})

entries.forEach( ( e, i ) => {

    const div = document.createElement( 'div' );
    div.className = 'entry';

    div.innerHTML = `
    <div class="entryHeader">
        <div class="entryHeaderLeft">
            <p>${e.name}</p>
            <p>${e.email}</p>
        </div>
        <div class="entryHeaderRight">
            <p>#${e.id}</p>
        </div>
    </div>
    <div class="entryBody">
        <p>${e.input}</p>
    </div>
    <div class="entryFooter">
        <button type="button">Verify</button>
        <button type="button">Bookmark</button>
    </div>
    `

    model.html.entries.appendChild( div );
    model.html.entries.appendChild( document.createElement( 'hr' ) );

})

