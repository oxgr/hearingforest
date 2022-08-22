/**
 * This script takes in text information from a HTML form for online submissions to Text Stream by Rafael Lozano-Hemmer.
 * A <Model> object hosts global variables to make globals explicitly defined.
 * Made for the Listening Forest exhibition at Crystal Bridges Museum, Arkansas.
 * 
 * @author Faadhi Fauzi <faadhi@antimodular.com>
 * Antimodular Research
 * August 2022
 */



const model = {};

model.origin = new URL( window.location.href ).origin;

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
    const confirmation = form[ 3 ];
    const submitButton = form[ form.length - 1 ];

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
            confirmation: confirmation,
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

        console.log( {
            input: model.html.form.input,
            confirmation: model.html.form.confirmation
        })
        // if ( parseInt( model.html.form.characterCount.innerHTML, 10 ) < 10 ) {
        if ( model.html.form.input.value == '' ) {
            model.html.form.input.style.borderColor = 'red';
            return;
        }
        
        if ( !model.html.form.confirmation.checked ) {
            model.html.form.confirmation.parentElement.style.border = '2px solid #CC0000';
            return;
        }

        
        const packet = {
            name: model.html.form.name.value,
            email: model.html.form.email.value,
            input: model.html.form.input.value,
        }

        console.log( 'Sending packet...' );
        console.log( { Packet: packet } );
        
        fetch( model.origin + '/textStream/input', {
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

