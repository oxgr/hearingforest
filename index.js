import express from 'express';
import { readFileSync, writeFileSync, appendFileSync, truncateSync } from 'fs'
import { randomBytes } from 'crypto'
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// console.debug( lamejs );

// Server
const app = express();
app.use( express.static( 'public', { extensions: ['html'] }  ) );
app.use( express.json( { limit: '50mb' } ) );

const PORT = process.env.PORT || 4060;
const server = app.listen( PORT, () => {
    console.log( `Listening on http://localhost:${PORT}` );
} )

// Data

const model = {}

model.filepaths = {
    textStream: './data/textStream.json',
    voiceForest: './data/voiceForest.json'
}

model.rawText = {
    textStream: '',
    voiceForest: ''
}

model.entries = {
    textStream: [],
    voiceForest: []
}

// Read .json files, store result in rawText, and if it's empty, fill with brackets to start array.
Object.keys( model.entries ).forEach( ( proj ) => {
    
    model.rawText[ proj ] = readFileSync( model.filepaths[ proj ] )
    
    if ( model.rawText[ proj ] == '' ) {
    
        console.log( `${model.filepaths[ proj ]} is empty.` )
        writeFileSync( model.filepaths[ proj ], '[\n]' );
    
    } else {
    
        try {
            model.entries[ proj ] = JSON.parse( model.rawText[ proj ] );
            console.log( `[${proj}]: Parsed ${model.entries[ proj ].length} entries.` );
        } catch ( e ) {
            console.error( e );
        }
    
    }

})

// Communication

app.get( '/:route/json/:filter', ( req, res ) => {

    const { route, filter } = req.params;

    console.log( `[HTTP]: GET request for /${route}/json/${filter}` )

    model.entries[ route ] = getEntries( route ).filter( ( e ) => !!!e.deleted );

    let packet = [];

    switch ( filter ) {

        case 'all':
            packet = [ ...model.entries[ route ] ];
            break;

        case 'verified':
            packet = model.entries[ route ].filter( ( e ) => !!e.verified );
            break;

        case 'bookmarked':
            packet = model.entries[ route ].filter( ( e ) => !!e.bookmarked );
            break;

        case 'unlabelled':
            packet = model.entries[ route ].filter( ( e ) => !e.verified && !e.bookmarked );
            break;

    }

    packet.filter( e => !e.deleted );

    res.send( packet )

} )

app.post( '/:route/input', ( req, res ) => {

    const { route } = req.params;
    const data = req.body;
    
    console.log( `[HTTP]: POST request for /${route}/input` )

    handleInput( data, route );

    res.send( {
        response: 'ok'
    } )

} )

app.post( '/:route/curate', ( req, res ) => {

    const { route } = req.params;
    const { id, action } = req.body;
    
    console.log( `[HTTP]: POST request for /${route}/curate` )
    
    model.entries[ route ] = getEntries( route );

    let targetEntry = model.entries[ route ].find( ( e ) => e.id === id );

    if ( !targetEntry ) {
        const msg =  `Could not find entry with id: ${id}`;
        console.log( msg )
        res.send( {
            message: msg
        })
        return;
    }

    let state = false;

    switch ( action ) {

        case 'verify':
            targetEntry.verified = !targetEntry.verified;
            state = targetEntry.verified;
            break;

        case 'bookmark':
            targetEntry.bookmarked = !targetEntry.bookmarked;
            state = targetEntry.bookmarked;
            break;

        case 'delete':
            targetEntry.deleted = !targetEntry.deleted;
            state = targetEntry.deleted;
            // const index = model.entries[ route ].indexOf( targetEntry );
            // console.log( 'Index:', index );
            break;

        default:
            res.status( 418 ).send( { message: 'Action unknown!' } );
            return;

    }

    writeFileSync( model.filepaths[ route ], JSON.stringify( model.entries[ route ], null, 2 ) )

    res.status( 200 ).send( {
        message: 'ok',
        state: state
    } )

} )

app.get( '/voiceForest/audio/:id', ( req, res ) => {

    const { id } = req.params;

    try {        
        res.status( 200 ).sendFile( join( __dirname, 'data', 'voiceForest', `${id}.mp3` ) );
    } catch ( e ) {
        console.error( e );
        res.status( 418 ).send( {
            message: `Error: Could not find ${id}.mp3`
        })
    }


})

function handleInput( data = {}, route = '' ) {

    // Setup data
    const inputObj = {
        name: data.name,
        email: data.email,
        input: route == 'voiceForest' ? Buffer.from( Object.values( data.input ) ) : data.input,
        id: randomBytes( 4 ).toString( 'hex' ),
        verified: data.verified || false,
        bookmarked: false,
        deleted: false
    }
    
    console.log( 'Input received:' );
    console.log( inputObj );
    
    switch ( route ) {

        case 'textStream':

            let textToPrint = inputObj.input;
            if ( inputObj.name ) textToPrint += '\n\n' + inputObj.name;
            // Create an individual .txt file
            try {
                writeFileSync( `./data/textStream/${inputObj.id}.txt`, textToPrint, { flag: 'wx' } )
            } catch ( e ) {
                console.error( e )
            }

            break;

        case 'voiceForest':

            const mp3Filename = `${inputObj.id}.mp3`
            
            // Create an individual .mp3 file
            try {
                writeFileSync( `./data/voiceForest/${mp3Filename}`, inputObj.input, { flag: 'wx' } )
            } catch ( e ) {
                console.error( e )
            }
            
            inputObj.input = mp3Filename;

            break;

    }

    // Cut bracket and line break at the end before appending.
    const contents = readFileSync( model.filepaths[ route ] );
    const len = contents.length - 2;
    truncateSync( model.filepaths[ route ], len );

    // Add obj to array in .json file.
    const sep = contents[ contents.length - 3 ] == 91 ? '\n' : ',\n'    // If the last character after truncating is a bracket i.e. empty array, don't add comma.
    const inputObjStr = JSON.stringify( inputObj, null, 2 );
    const closing = '\n]';
    appendFileSync( model.filepaths[ route ], sep + inputObjStr + closing );

    return false;

}

function getEntries( name ) {

    let entries;

    try {
        entries = JSON.parse( readFileSync( model.filepaths[ name ] ) );
    } catch ( e ) {
        console.error( e );
    }

    return entries;

}

// const socket = setupSocket( server );  