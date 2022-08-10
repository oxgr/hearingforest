import express from 'express';
// import setupSocket from './socket.js'
// import * as socket from 'socket.io';
import { readFileSync, writeFileSync, appendFileSync, truncateSync } from 'fs'
import { randomBytes } from 'crypto'

// Server
const app = express();
app.use( express.static( 'public' , { extensions: ['html'] } ) );
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
    textStream: '',
    voiceForest: ''
}

model.entries = {
    textStream: [],
    voiceForest: []
}

model.rawText.textStream = readFileSync( model.filepaths.textStream )

if ( model.rawText.textStream == '' ) {

    console.log( `${model.filepaths.textStream} is empty.` )
    writeFileSync( model.filepaths.textStream, '[\n]' );

} else {

    try {
        model.entries.textStream = JSON.parse( model.rawText.textStream );
        console.log( `[TS]: Parsed ${model.entries.textStream.length} entries.` );
    } catch ( e ) {
        console.error( e );
    }

}


// Communication

app.get( '/textStream/json/:filter', ( req, res ) => {

    const { filter } = req.params;

    console.log( `[HTTP]: GET request for /textStream/json/${filter}` )

    model.entries.textStream = getEntries( 'textStream' );

    let packet = [];

    switch ( filter ) {

        case 'all':
            packet = [ ...model.entries.textStream ];
            break;

        case 'verified':
            packet = model.entries.textStream.filter( ( e ) => !!e.verified );
            break;

        case 'bookmarked':
            packet = model.entries.textStream.filter( ( e ) => !!e.bookmarked );
            break;

        case 'unlabelled':
            packet = model.entries.textStream.filter( ( e ) => !e.verified && !e.bookmarked );
            break;

    }

    res.send( packet )

} )

app.post( '/textStream', ( req, res ) => {

    const data = req.body;

    handleInput( data, '/textStream' );

    res.send( {
        response: 'ok'
    } )

} )

app.post( '/textStream/curate', ( req, res ) => {

    console.log( '[HTTP]: POST request for /textStream/curate' )

    const { id, action } = req.body;

    model.entries.textStream = getEntries( 'textStream' );

    let targetEntry = model.entries.textStream.find( ( e ) => e.id === id );

    if ( !targetEntry ) {
        console.log( `Could not find entry with id: ${id}` )
        return;
    }

    let label = ''
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
            const index = model.entries.textStream.indexOf( targetEntry );
            console.log( 'index:', index );
            model.entries.textStream.splice( model.entries.textStream.indexOf( targetEntry ), 1 );
            break;

        default:
            res.status( 418 ).send( { message: 'Action unknown!' } );
            return;

    }

    writeFileSync( model.filepaths.textStream, JSON.stringify( model.entries.textStream, null, 2 ) )

    res.status( 200 ).send( {
        message: 'ok',
        state: state
    } )

} )

function handleInput( data = {}, route = '' ) {

    console.log( 'Input received:' );

    const inputObj = { ...data }
    console.log( inputObj );
    inputObj.id = randomBytes( 4 ).toString( 'hex' );
    inputObj.verified = false;
    inputObj.bookmarked = false;

    switch ( route ) {

        case '/textStream':

            model.entries.textStream.push( inputObj ); // why cache entries?

            // Cut bracket and line break at the end before appending.
            const contents = readFileSync( model.filepaths.textStream );
            const len = contents.length - 2;
            truncateSync( model.filepaths.textStream, len );

            // Add obj to array in ,txt
            const sep = contents[ contents.length - 3 ] == 91 ? '\n' : ',\n'
            const inputObjStr = JSON.stringify( inputObj, null, 2 );
            const closing = '\n]';
            appendFileSync( model.filepaths.textStream, sep + inputObjStr + closing );

            // Create an individual .txt file
            try {
                writeFileSync( `./data/textStream/${inputObj.id}.txt`, inputObj.input, { flag: 'wx' } )
            } catch ( e ) {
                console.error( e )
            }

            break;


        case '/voiceForest':


            break;

    }

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