// import { io } from './socket.io.js';
import { io } from 'https://cdn.socket.io/4.4.1/socket.io.esm.min.js';

const model = {};

const url = new URL( window.location.href );
model.origin = url.origin;

model.html = ( ( document ) => {
    // const input = document.getElementById( 'input' );
    // const submitButton = document.getElementById( 'btn-submit' );
    
    const form = document.getElementById( 'input' );
    const characterCount = document.getElementById( 'characterCount' )
    const submitted = document.getElementById( 'submitted' );

    console.log( submitted.hidden )

    const name = form[ 0 ];
    const email = form[ 1 ];
    const input = form[ 2 ];
    const submitButton = form[ 3 ];

    input.oninput = updateCharacterCount;
    submitButton.onclick = submitButtonClicked;


    const removeForm = () => {
        form.remove();
        submitted.hidden = false;
    }

    return {
        formElement: form,
        form: {
            name: name,
            email: email,
            input: input,
            submitButton: submitButton,
            characterCount: characterCount
        },
        removeForm: removeForm
    }

    function updateCharacterCount( e ) {

        const count = model.html.form.input.value.length;
        model.html.form.characterCount.innerHTML = count;
    
        const maxCharactercCount = 240;
        const val = ( 1 - ( count / maxCharactercCount ) ) * 255;
        model.html.form.characterCount.style.color = `rgb( 255, ${val}, ${val} )`
    }
    
    function submitButtonClicked( e ) {
    
        
        const packet = {
            name: model.html.form.name.value,
            email: model.html.form.email.value,
            input: model.html.form.input.value,
        }

        console.log( 'Sending packet...' );
        console.log( { Packet: packet } );
        
        fetch(model.origin + '/textStream', {
            method: 'POST', // or 'PUT',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                // "Access-Control-Allow-Headers" : "Content-Type",
                // "Access-Control-Allow-Origin": "*",
                // "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            body: JSON.stringify(packet),
        })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    
        // model.socket.emit( 'textStream/input', JSON.stringify( packet, null, 0 ) );
        
        model.html.removeForm();
    
    }

})( document )

// model.socket = ( ( io ) => {
//     const socket = io( 'http://localhost:4060' );
    
//     socket.on( 'print', ( arg ) => {
//         console.log( arg )
//     })

//     socket.on( 'response', ( arg ) => {

//         // console.log( `response received. arg: ${arg}` );

//         if ( arg === 'ok' ) {
//             // console.log( 'response ok, removing form...')
//             model.html.removeForm()
//         }

//     })

//     return socket;
// })( io );

