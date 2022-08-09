import express from 'express';
import setupSocket from './socket.js'
import fs from 'fs'
import { randomBytes } from 'crypto'
// import * as socket from 'socket.io';

// Server
const app = express();
app.use( express.static( 'public' ) );
app.use( express.json() );

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
    textStream: fs.readFileSync( model.filepaths.textStream ),
    voiceForest: ''
}

model.entries = {
    textStream: [],
    voiceForest: []
}

if ( model.rawText.textStream == '' ) {

    console.log( `${model.filepaths.textStream} is empty.` )
    fs.writeFileSync( model.filepaths.textStream, '[\n]' );

} else {

    try {
        model.entries.textStream = JSON.parse( model.rawText.textStream ) ;
    } catch ( e ) {
        console.error( e );
    }

}


console.log( `[TS]: Parsed ${model.entries.textStream.length} entries.`);

// Communication

app.get( '/textStream/json/all', ( req, res ) => {

    model.rawText.textStream = fs.readFileSync( model.filepaths.textStream );

    try {
        model.entries.textStream = JSON.parse( model.rawText.textStream ) ;
    } catch ( e ) {
        console.error( e );
    }

    const packet = {
        json: JSON.stringify(model.entries.textStream, null, 0)
    }

    console.log( `
    contents.length: ${model.rawText.textStream.length}
    reStringified.length: ${packet.json.length}
    `)

    res.send( model.entries.textStream )

})

app.get( '/textStream/json/verified', ( req, res ) => {

    const verifiedEntries = model.entries.textStream.map( ( e ) => e.verified === true );

    res.send( verifiedEntries )

})

app.get( '/textStream/json/bookmarked', ( req, res ) => {

    const verifiedEntries = model.entries.textStream.map( ( e ) => e.bookmarked === true );

    res.send( verifiedEntries )

})

app.get( '/textStream/json/unlabelled', ( req, res ) => {

    const verifiedEntries = model.entries.textStream.map( ( e ) => e.verified === false && e.bookmarked === false );

    res.send( verifiedEntries )

})

app.post( '/textStream', ( req, res ) => {

    const data = req.body;

    handleInput( data, '/textStream' ); 

    res.send({
        response: 'yep!'
    })

})

function handleInput( data = {}, route = '' ) {

    console.log( 'Input received:' );

    const inputObj = {...data}
    console.log( inputObj );
    inputObj.id = randomBytes( 4 ).toString( 'hex' );
    inputObj.verified = false;
    inputObj.bookmarked = false;

    switch ( route ) {

        case '/textStream':

            model.entries.textStream.push( inputObj ); // why cache entries?
            
            // Cut bracket and line break at the end before appending.
            const contents = fs.readFileSync( model.filepaths.textStream );
            const len = contents.length - 2;
            fs.truncateSync( model.filepaths.textStream, len );
            
            // Add obj to array in ,txt
            const sep = contents[ contents.length - 3 ] == 91 ? '\n' : ',\n'
            const inputObjStr = JSON.stringify( inputObj, null, 2 );
            const closing = '\n]';
            fs.appendFileSync( model.filepaths.textStream, sep + inputObjStr + closing );

            // Create an individual .txt file
            try {
                fs.writeFileSync( `./data/textStream/${id}.txt`, input, { flag: 'wx' } )
            } catch ( e ) {
                console.error( e )
            }

            break;

            
        case '/voiceForest' :


            break;

    }

    return false;

}

// const socket = setupSocket( server );  